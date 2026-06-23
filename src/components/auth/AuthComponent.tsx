import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, CheckCircle2, User, ShieldCheck, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { NEON_COLOR } from '../../utils/constants';
import type { UserData } from '../../types';
import { hashPin } from '../../utils/crypto';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '../../utils/rateLimit';

interface AuthComponentProps {
  onPlayerLogin: (playerData: UserData & Record<string, unknown>) => void;
  isRecovering?: boolean;
  onPasswordUpdated?: () => void;
  onBack?: () => void;
}

type View = 'playerLogin' | 'coachLogin' | 'coachRegister' | 'clubAdminLogin' | 'clubAdminRegister' | 'forgotPassword' | 'resetPassword';

const withTimeout = <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);

const AuthComponent = ({ onPlayerLogin, isRecovering = false, onPasswordUpdated, onBack }: AuthComponentProps) => {
  const [view, setView] = useState<View>(() => isRecovering ? 'resetPassword' : 'playerLogin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamId, setTeamId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [clubIdInput, setClubIdInput] = useState('');
  const [newClubId, setNewClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberCoach, setRememberCoach] = useState(false);
  const [forgotPasswordOrigin, setForgotPasswordOrigin] = useState<'coachLogin' | 'clubAdminLogin'>('coachLogin');
  const [slowHint, setSlowHint] = useState(false);

  useEffect(() => { if (isRecovering) setView('resetPassword'); }, [isRecovering]);

  useEffect(() => {
    if (view === 'playerLogin') {
      const savedTeamId = localStorage.getItem('rememberedTeamId');
      const savedPin = localStorage.getItem('rememberedPin');
      if (savedTeamId && savedPin) { setTeamId(savedTeamId); setPin(savedPin); setRememberMe(true); }
    } else if (view === 'coachLogin' || view === 'clubAdminLogin') {
      const savedEmail = localStorage.getItem('rememberedCoachEmail');
      if (savedEmail) { setEmail(savedEmail); setRememberCoach(true); }
    }
  }, [view]);

  const handleCoachAuth = async (isRegistering: boolean) => {
    const attemptCoach = async () => {
      setLoading(true); setSlowHint(false);
      const t = setTimeout(() => setSlowHint(true), 8000);
      try {
        if (isRegistering) {
          if (!newTeamId.trim()) throw new Error('Een unieke Team ID is verplicht om een team te registreren.');
          const { data: teamData } = await supabase.from('teams').select('id').eq('id', newTeamId).single();
          if (teamData) throw new Error('Deze Team ID is al in gebruik. Kies een andere.');

          if (clubIdInput.trim()) {
            const { data: clubData } = await supabase.from('clubs').select('id').eq('id', clubIdInput.trim()).single();
            if (!clubData) throw new Error('Club ID niet gevonden. Controleer het ID bij je club admin.');
          }

          const { data, error } = await withTimeout(
            supabase.auth.signUp({ email, password }),
            45000, 'Registratie duurt te lang. Controleer je verbinding.'
          );
          if (error) throw error;

          const teamPayload: Record<string, unknown> = {
            id: newTeamId,
            coach_id: data.user!.id,
            team_name: `${email.split('@')[0]}'s Team`,
          };
          if (clubIdInput.trim()) teamPayload.club_id = clubIdInput.trim();

          await supabase.from('teams').insert(teamPayload);
          await supabase.from('profiles').insert({
            id: data.user!.id,
            role: 'coach',
            team_id: newTeamId,
            email: email.trim().toLowerCase(),
            ...(clubIdInput.trim() ? { club_id: clubIdInput.trim() } : {}),
          });
        } else {
          if (rememberCoach) localStorage.setItem('rememberedCoachEmail', email);
          else localStorage.removeItem('rememberedCoachEmail');
          const { error } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            45000, '__timeout__'
          );
          if (error) throw error;
        }
        return 'ok';
      } catch (err) {
        return (err as Error).message;
      } finally {
        clearTimeout(t); setLoading(false); setSlowHint(false);
      }
    };

    const messages: Record<string, string> = {
      'Invalid login credentials': 'Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord.',
      'User already registered': 'Dit e-mailadres is al in gebruik door een ander account.',
      'Password should be at least 6 characters': 'Het wachtwoord moet uit minstens 6 tekens bestaan.',
    };

    setError('');
    const r1 = await attemptCoach();
    if (r1 === 'ok') return;
    if (r1 === '__timeout__' && !isRegistering) {
      setError('Server wordt opgestart, nog even geduld...');
      await new Promise(res => setTimeout(res, 2000));
      setError('');
      const r2 = await attemptCoach();
      if (r2 !== 'ok') setError(r2 === '__timeout__' ? 'Server reageert niet. Probeer het over een minuut opnieuw.' : (messages[r2] ?? r2));
    } else {
      setError(messages[r1] ?? r1);
    }
  };

  const handleClubAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubId.trim()) { setError('Kies een unieke Club ID.'); return; }
    if (!clubName.trim()) { setError('Vul een clubnaam in.'); return; }
    if (password.length < 6) { setError('Wachtwoord moet minimaal 6 tekens zijn.'); return; }

    setLoading(true); setError('');
    try {
      const { data: existing } = await supabase.from('clubs').select('id').eq('id', newClubId).single();
      if (existing) throw new Error('Deze Club ID is al in gebruik. Kies een andere.');

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      await supabase.from('clubs').insert({ id: newClubId, name: clubName.trim() });
      await supabase.from('profiles').insert({ id: data.user!.id, role: 'club_admin', club_id: newClubId });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId.trim() || !pin.trim()) { setError('Team ID en Pincode zijn beide verplicht.'); return; }

    try {
      checkRateLimit(teamId);
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    const attempt = async () => {
      setLoading(true); setSlowHint(false);
      const t = setTimeout(() => setSlowHint(true), 8000);
      try {
        // Fetch candidates by team, then verify PIN hash client-side
        const { data, error } = await withTimeout(
          supabase.from('players').select('*').eq('team_id', teamId),
          45000, '__timeout__'
        );
        if (error) throw new Error('Verbindingsfout. Probeer het opnieuw.');
        if (!data || data.length === 0) throw new Error('Team ID niet gevonden. Controleer de code bij je coach.');

        // Find player where pin_hash matches SHA-256(pin + player.id)
        let matched = null;
        for (const player of data) {
          const expectedHash = await hashPin(pin, player.id);
          if (player.pin_hash === expectedHash) { matched = player; break; }
        }

        if (!matched) throw new Error('Pincode onjuist. Controleer de code bij je coach.');

        if (rememberMe) { localStorage.setItem('rememberedTeamId', teamId); localStorage.setItem('rememberedPin', pin); }
        else { localStorage.removeItem('rememberedTeamId'); localStorage.removeItem('rememberedPin'); }

        clearAttempts(teamId);
        onPlayerLogin({ role: 'player', teamId, uid: matched.id, ...matched });
        return 'ok';
      } catch (err) {
        return (err as Error).message;
      } finally {
        clearTimeout(t); setLoading(false); setSlowHint(false);
      }
    };

    setError('');
    const r1 = await attempt();
    if (r1 === 'ok') return;
    if (r1 === '__timeout__') {
      setError('Server wordt opgestart, nog even geduld...');
      await new Promise(res => setTimeout(res, 2000));
      setError('');
      const r2 = await attempt();
      if (r2 !== 'ok') {
        recordFailedAttempt(teamId);
        setError(r2 === '__timeout__' ? 'Server reageert niet. Probeer het over een minuut opnieuw.' : r2);
      }
    } else {
      recordFailedAttempt(teamId);
      setError(r1);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (!email.trim()) throw new Error('Vul je e-mailadres in.');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      if (error) throw error;
      setSuccess('Reset-link verstuurd! Controleer je inbox (en spammap).');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (newPassword.length < 6) throw new Error('Wachtwoord moet minimaal 6 tekens zijn.');
      if (newPassword !== confirmPassword) throw new Error('Wachtwoorden komen niet overeen.');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess('Wachtwoord succesvol bijgewerkt!');
      setTimeout(() => onPasswordUpdated?.(), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const btnClass = 'w-full py-3 font-bold text-black rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50';

  const renderForm = () => {
    if (view === 'resetPassword') return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-1" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>NIEUW WACHTWOORD</h2>
        <p className="text-sm text-gray-400 text-center mb-4">Kies een nieuw wachtwoord voor je account.</p>
        <Input label="Nieuw wachtwoord" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimaal 6 tekens" />
        <Input label="Bevestig wachtwoord" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Herhaal je wachtwoord" />
        <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading ? <Loader2 className="animate-spin" /> : 'Wachtwoord opslaan'}
        </button>
      </form>
    );

    if (view === 'forgotPassword') return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <button type="button" onClick={() => { setView(forgotPasswordOrigin); setError(''); setSuccess(''); }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-2">
          <ArrowLeft size={14} /> Terug
        </button>
        <h2 className="text-2xl font-bold text-center mb-1" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>WACHTWOORD VERGETEN</h2>
        <p className="text-sm text-gray-400 text-center">We sturen een reset-link naar je e-mailadres.</p>
        <Input label="E-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@email.com" />
        {success ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-900/30 border border-green-700">
            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        ) : (
          <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
            {loading ? <Loader2 className="animate-spin" /> : 'Verstuur reset-link'}
          </button>
        )}
      </form>
    );

    if (view === 'playerLogin') return (
      <form onSubmit={handlePlayerLogin} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-4" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>SPELER LOGIN</h2>
        <Input label="Team ID" value={teamId} onChange={e => setTeamId(e.target.value)} placeholder="Vraag je coach" />
        <Input label="Jouw Pincode" value={pin} onChange={e => setPin(e.target.value)} placeholder="6-cijferige code" />
        <div className="flex items-center">
          <input id="remember-me" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800" />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">Bewaar mijn gegevens</label>
        </div>
        <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading ? <Loader2 className="animate-spin" /> : 'Inloggen'}
        </button>
        {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Server start op na inactiviteit, dit kan tot 45 seconden duren...</p>}
      </form>
    );

    if (view === 'clubAdminLogin') return (
      <form onSubmit={e => { e.preventDefault(); void handleCoachAuth(false); }} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-4" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>CLUB LOGIN</h2>
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@club.nl" />
        <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="remember-club" type="checkbox" checked={rememberCoach} onChange={e => setRememberCoach(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800" />
            <label htmlFor="remember-club" className="ml-2 block text-sm text-gray-400">Bewaar mijn e-mail</label>
          </div>
          <button type="button" onClick={() => { setForgotPasswordOrigin('clubAdminLogin'); setView('forgotPassword'); setError(''); }} className="text-sm text-gray-400 hover:text-white transition-colors">
            Vergeten?
          </button>
        </div>
        <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading ? <Loader2 className="animate-spin" /> : 'Inloggen'}
        </button>
        {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Server start op na inactiviteit, dit kan tot 45 seconden duren...</p>}
      </form>
    );

    if (view === 'clubAdminRegister') return (
      <form onSubmit={handleClubAdminRegister} className="space-y-4">
        <button type="button" onClick={() => { setView('coachLogin'); setError(''); }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-2">
          <ArrowLeft size={14} /> Terug
        </button>
        <h2 className="text-2xl font-bold text-center mb-4" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>CLUB REGISTRATIE</h2>
        <Input label="Clubnaam" value={clubName} onChange={e => setClubName(e.target.value)} placeholder="bv. VV Sportlust" />
        <Input label="Kies een unieke Club ID" value={newClubId} onChange={e => setNewClubId(e.target.value)} placeholder="bv. VVS-CLUB" />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@club.nl" />
        <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimaal 6 tekens" />
        <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading ? <Loader2 className="animate-spin" /> : 'Club Registreren'}
        </button>
      </form>
    );

    // Coach login / register
    return (
      <form onSubmit={e => { e.preventDefault(); void handleCoachAuth(view === 'coachRegister'); }} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-4" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>
          {view === 'coachLogin' ? 'COACH LOGIN' : 'COACH REGISTRATIE'}
        </h2>
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@email.com" />
        <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        {view === 'coachRegister' && (
          <>
            <Input label="Kies een unieke Team ID" value={newTeamId} onChange={e => setNewTeamId(e.target.value)} placeholder="bv. VVC11-1" />
            <Input label="Club ID (optioneel)" value={clubIdInput} onChange={e => setClubIdInput(e.target.value)} placeholder="Vraag je club admin" />
          </>
        )}
        {view === 'coachLogin' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-coach" type="checkbox" checked={rememberCoach} onChange={e => setRememberCoach(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800" />
              <label htmlFor="remember-coach" className="ml-2 block text-sm text-gray-400">Bewaar mijn e-mail</label>
            </div>
            <button type="button" onClick={() => { setForgotPasswordOrigin('coachLogin'); setView('forgotPassword'); setError(''); }} className="text-sm text-gray-400 hover:text-white transition-colors">
              Vergeten?
            </button>
          </div>
        )}
        <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading ? <Loader2 className="animate-spin" /> : view === 'coachLogin' ? 'Inloggen' : 'Registreren'}
        </button>
        {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Server start op na inactiviteit, dit kan tot 45 seconden duren...</p>}
      </form>
    );
  };

  const isCoachView = view === 'coachLogin' || view === 'coachRegister' || view === 'clubAdminLogin' || view === 'clubAdminRegister';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-6">
      {onBack && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onBack}
          className="absolute top-5 left-5 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Terug naar home
        </motion.button>
      )}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-2">
        <img src="/logo.png" alt="Skillkaart" className="w-20 h-20 rounded-2xl object-cover" style={{ filter: `drop-shadow(0 0 12px ${NEON_COLOR}60)` }} />
        <p className="text-gray-500 text-sm">Voetbal ontwikkeling voor jongeren</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="w-full max-w-sm">
        <Card>
          {view !== 'forgotPassword' && view !== 'resetPassword' && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => { setView('playerLogin'); setError(''); }}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${
                  view === 'playerLogin' ? 'border-[#00FF9D] bg-[#00FF9D]/[0.07] text-white' : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <User size={20} style={{ color: view === 'playerLogin' ? NEON_COLOR : '#6b7280' }} />
                <div className="text-center">
                  <div className="font-bold text-xs leading-none">Speler</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Team + PIN</div>
                </div>
              </button>
              <button
                onClick={() => { setView('coachLogin'); setError(''); }}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${
                  view === 'coachLogin' || view === 'coachRegister' ? 'border-[#00FF9D] bg-[#00FF9D]/[0.07] text-white' : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <ShieldCheck size={20} style={{ color: view === 'coachLogin' || view === 'coachRegister' ? NEON_COLOR : '#6b7280' }} />
                <div className="text-center">
                  <div className="font-bold text-xs leading-none">Coach</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Email + ww</div>
                </div>
              </button>
              <button
                onClick={() => { setView('clubAdminLogin'); setError(''); }}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${
                  view === 'clubAdminLogin' || view === 'clubAdminRegister' ? 'border-[#00FF9D] bg-[#00FF9D]/[0.07] text-white' : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <Building2 size={20} style={{ color: view === 'clubAdminLogin' || view === 'clubAdminRegister' ? NEON_COLOR : '#6b7280' }} />
                <div className="text-center">
                  <div className="font-bold text-xs leading-none">Club</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Admin</div>
                </div>
              </button>
            </div>
          )}
          {renderForm()}
          {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
          {view === 'resetPassword' && success && (
            <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-green-900/30 border border-green-700">
              <CheckCircle2 size={18} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}
          {view === 'coachLogin' && (
            <p className="text-center text-sm mt-4 text-gray-400">
              Nog geen account? <button onClick={() => setView('coachRegister')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Registreer hier</button>
            </p>
          )}
          {view === 'coachRegister' && (
            <p className="text-center text-sm mt-4 text-gray-400">
              Al een account? <button onClick={() => setView('coachLogin')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
            </p>
          )}
          {view === 'clubAdminLogin' && (
            <p className="text-center text-sm mt-4 text-gray-400">
              Nog geen account? <button onClick={() => setView('clubAdminRegister')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Club registreren</button>
            </p>
          )}
          {view === 'clubAdminRegister' && (
            <p className="text-center text-sm mt-4 text-gray-400">
              Al een account? <button onClick={() => setView('clubAdminLogin')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
            </p>
          )}

          {(view === 'playerLogin' || view === 'coachLogin' || view === 'clubAdminLogin') && (
            <div className="mt-6 border-t border-gray-800 pt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-3">Demo Account</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { localStorage.removeItem('rememberedCoachEmail'); setRememberCoach(false); setView('clubAdminLogin'); setEmail('chat@weareimpact.nl'); setPassword('Skillkaart2026!'); setError(''); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:bg-gray-800/70 hover:border-gray-600 transition-all text-left group"
                >
                  <Building2 size={15} style={{ color: NEON_COLOR }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">Club Admin — Impact FC</p>
                    <p className="text-[10px] text-gray-500 truncate">chat@weareimpact.nl · Skillkaart2026!</p>
                  </div>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">invullen →</span>
                </button>
                <button
                  type="button"
                  onClick={() => { localStorage.removeItem('rememberedCoachEmail'); setRememberCoach(false); setView('coachLogin'); setEmail('v.munster@weareimpact.nl'); setPassword('Demo1234'); setError(''); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:bg-gray-800/70 hover:border-gray-600 transition-all text-left group"
                >
                  <ShieldCheck size={15} style={{ color: NEON_COLOR }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">Coach — V. Munster</p>
                    <p className="text-[10px] text-gray-500 truncate">v.munster@weareimpact.nl · Demo1234</p>
                  </div>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">invullen →</span>
                </button>
                <button
                  type="button"
                  onClick={() => { localStorage.removeItem('rememberedTeamId'); localStorage.removeItem('rememberedPin'); setRememberMe(false); setView('playerLogin'); setTeamId('IMPACT-JO10-1'); setPin('112233'); setError(''); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:bg-gray-800/70 hover:border-gray-600 transition-all text-left group"
                >
                  <User size={15} style={{ color: NEON_COLOR }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">Speler — Luca van den Berg</p>
                    <p className="text-[10px] text-gray-500">IMPACT-JO10-1 · PIN 112233</p>
                  </div>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">invullen →</span>
                </button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthComponent;
