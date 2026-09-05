import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { NEON_COLOR } from '../../utils/constants';
import type { UserData } from '../../types';
import { hashPin } from '../../utils/crypto';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '../../utils/rateLimit';
import { fetchInviteByToken, acceptCoachInvite, type CoachInvite } from '../../lib/teamManagement';
import CoachInviteWelcome from './CoachInviteWelcome';

interface AuthComponentProps {
  onPlayerLogin: (playerData: UserData & Record<string, unknown>) => void;
  isRecovering?: boolean;
  initialError?: string;
  onPasswordUpdated?: () => void;
  onBack?: () => void;
  onParentLogin?: () => void;
}

type View = 'playerLogin' | 'coachLogin' | 'coachRegister' | 'coachInviteWelcome' | 'forgotPassword' | 'resetPassword';

const withTimeout = <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);

const AuthComponent = ({ onPlayerLogin, isRecovering = false, initialError, onPasswordUpdated, onBack, onParentLogin }: AuthComponentProps) => {
  const [view, setView] = useState<View>(() => {
    if (isRecovering) return 'resetPassword';
    if (initialError) return 'forgotPassword';
    // /coach opent direct de coach-login, net als /club dat voor ClubLogin doet.
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/coach')) return 'coachLogin';
    return 'playerLogin';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamId, setTeamId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [clubIdInput, setClubIdInput] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(initialError ?? '');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberCoach, setRememberCoach] = useState(false);
  const [forgotPasswordOrigin, setForgotPasswordOrigin] = useState<'coachLogin'>('coachLogin');
  const [slowHint, setSlowHint] = useState(false);
  const [invite, setInvite] = useState<CoachInvite | null>(null);
  // Het token komt uit de URL en wordt niet meer door de server teruggegeven.
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  // Magic-link invite: zodra de sessie uit de URL-hash is hersteld, ronden we
  // de koppeling af. De coach hoeft dan géén wachtwoord te kiezen.
  const [claimingInvite, setClaimingInvite] = useState(false);
  // Supabase blokkeert login zolang het e-mailadres niet bevestigd is (oude flow).
  // We vertalen die melding en bieden een knop om de bevestigingsmail opnieuw te sturen.
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => { if (isRecovering) setView('resetPassword'); }, [isRecovering]);

  // Vult een demo-account in wanneer je vanaf /demo doorklikt (?demo=clubAdmin|coach|player).
  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (!demo) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (demo === 'coach') {
      localStorage.removeItem('rememberedCoachEmail'); setRememberCoach(false);
      setView('coachLogin'); setEmail('weareimpactnl@gmail.com'); setPassword('Demo1234');
    } else if (demo === 'player') {
      localStorage.removeItem('rememberedTeamId'); localStorage.removeItem('rememberedPin'); setRememberMe(false);
      setView('playerLogin'); setTeamId('IMPACT-JO10-1'); setPin('112233');
    }
  }, []);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('coachInvite');
    if (!token) return;
    fetchInviteByToken(token).then(result => {
      if (result.status === 'ok') {
        setInvite(result.invite);
        setInviteToken(token);
        setEmail(result.invite.email);
        // Magic-link flow: de coach is al ingelogd via de invite-link (#access_token
        // in de URL-hash). Dan ronden we de koppeling meteen af — geen wachtwoord nodig.
        if (window.location.hash.includes('access_token=')) {
          void claimInvite();
          return;
        }
        setView('coachInviteWelcome');
        return;
      }
      // Zonder deze takken deed een verlopen of ingetrokken link helemaal niets.
      setView('coachLogin');
      setError(
        result.status === 'not_found'
          ? 'Deze uitnodiging is niet meer geldig. Mogelijk is hij al gebruikt of ingetrokken — vraag je club-admin om een nieuwe.'
          : `Uitnodiging kon niet worden geladen: ${result.message}`
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- claimInvite is een stable async fn; alleen bij mount de invite laden
  }, []);

  // Rondt een coach-uitnodiging af nadat de (magic-link) sessie is hersteld.
  // Het account bestaat al bevestigd — geen signUp meer nodig.
  const claimInvite = async () => {
    if (!inviteToken || !invite) return;
    setClaimingInvite(true);
    setView('coachInviteWelcome');
    try {
      // Zorg dat de magic-link sessie volledig hersteld is vóórdat we getUser() doen.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Sessie ontbreekt. Open de uitnodigingsmail opnieuw.');
      await acceptCoachInvite(inviteToken, session.user.id, invite.email);
      // Sessie + profiel staan klaar. Schone reload (zonder hash/token) zodat App.tsx
      // de coach naar het dashboard routeert — geen spinner-hang mogelijk.
      window.location.replace(window.location.pathname);
    } catch (err) {
      setClaimingInvite(false);
      setView('coachLogin');
      setError((err as Error).message ?? 'Uitnodiging kon niet worden afgerond. Probeer het opnieuw.');
    }
  };

  // Verberg de "opnieuw versturen"-actie zodra de gebruiker het e-mailadres wijzigt.
  useEffect(() => { setEmailNotConfirmed(false); }, [email]);

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
          if (invite && inviteToken) {
            // Magic-link flow: de coach is al ingelogd (sessie via URL-hash).
            // Alleen de koppeling aan het team afronden — géén wachtwoord meer.
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Sessie ontbreekt. Open de uitnodigingsmail opnieuw.');
            await acceptCoachInvite(inviteToken, user.id, invite.email);
          } else {
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
            if (clubIdInput.trim()) {
              await supabase.from('team_coaches').insert({
                team_id: newTeamId,
                club_id: clubIdInput.trim(),
                coach_id: data.user!.id,
                email: email.trim().toLowerCase(),
                role: 'head',
                status: 'active',
                joined_at: new Date().toISOString(),
              });
            }
          }
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
      'Email not confirmed': 'Je e-mailadres is nog niet bevestigd. Controleer je inbox (en spammap) voor de bevestigingslink, of vraag hieronder een nieuwe link aan.',
    };

    setError(''); setEmailNotConfirmed(false); setSuccess('');
    const r1 = await attemptCoach();
    if (r1 === 'ok') return;
    if (r1 === '__timeout__' && !isRegistering) {
      setError('Server wordt opgestart, nog even geduld...');
      await new Promise(res => setTimeout(res, 2000));
      setError('');
      const r2 = await attemptCoach();
      if (r2 !== 'ok') {
        if (r2 === 'Email not confirmed') { setEmailNotConfirmed(true); setError(messages[r2]); }
        else setError(r2 === '__timeout__' ? 'Server reageert niet. Probeer het over een minuut opnieuw.' : (messages[r2] ?? r2));
      }
    } else if (r1 === 'Email not confirmed') {
      setEmailNotConfirmed(true);
      setError(messages[r1]);
    } else {
      setError(messages[r1] ?? r1);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) { setError('Vul eerst je e-mailadres in.'); return; }
    setResending(true); setError(''); setSuccess('');
    try {
      const redirectTo = window.location.hostname === 'localhost' ? window.location.origin : 'https://skillkaart.nl';
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setSuccess('Bevestigingsmail opnieuw verstuurd! Check je inbox (en spammap).');
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setError('Te veel mails verstuurd. Wacht een uur en probeer het opnieuw.');
      } else {
        setError(msg || 'Kon de bevestigingsmail niet versturen. Probeer het later opnieuw.');
      }
    } finally {
      setResending(false);
    }
  };

  // Wachtwoordloze inlog voor coaches die via magic-link zijn uitgenodigd (geen
  // wachtwoord). Hergebruikt de bestaande /api/send-login-link serverless route.
  const handleSendMagicLink = async () => {
    if (!email.trim()) { setError('Vul eerst je e-mailadres in.'); return; }
    if (rememberCoach) localStorage.setItem('rememberedCoachEmail', email);
    else localStorage.removeItem('rememberedCoachEmail');
    setResending(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/send-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Kon de inloglink niet versturen.');
      setSuccess('Inloglink verstuurd! Check je inbox (en spammap) en klik op de knop.');
    } catch (err) {
      setError((err as Error).message ?? 'Kon de inloglink niet versturen.');
    } finally {
      setResending(false);
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
      const redirectTo = window.location.hostname === 'localhost' ? window.location.origin : 'https://skillkaart.nl';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setSuccess('Reset-link verstuurd! Controleer je inbox (en spammap).');
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setError('Te veel reset-mails verstuurd. Wacht een uur en probeer het opnieuw, of gebruik de link die je al ontvangen hebt.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSlowHint(false);
    const slowTimer = setTimeout(() => setSlowHint(true), 6000);
    try {
      if (newPassword.length < 6) throw new Error('Wachtwoord moet minimaal 6 tekens zijn.');
      if (newPassword !== confirmPassword) throw new Error('Wachtwoorden komen niet overeen.');
      // Retry up to 3 times — Supabase Auth can be slow to start on free tier.
      let lastErr: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { error } = await withTimeout(
            supabase.auth.updateUser({ password: newPassword }),
            20000,
            'Server reageert niet, opnieuw proberen...'
          );
          if (error) throw error;
          setSuccess('Wachtwoord succesvol bijgewerkt!');
          setTimeout(() => onPasswordUpdated?.(), 1500);
          return;
        } catch (err) {
          lastErr = err as Error;
          if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
        }
      }
      throw lastErr;
    } catch (err) {
      setError((err as Error).message ?? 'Server reageert niet. Probeer het opnieuw.');
    } finally {
      clearTimeout(slowTimer);
      setSlowHint(false);
      setLoading(false);
    }
  };

  const btnClass = 'w-full py-3 font-bold text-black rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50';
  const isLightMode = view !== 'resetPassword';

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
        {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Dit duurt langer dan normaal...</p>}
      </form>
    );

    if (view === 'forgotPassword') return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <button type="button" onClick={() => { setView(forgotPasswordOrigin); setError(''); setSuccess(''); }} className={`flex items-center gap-1.5 text-sm transition-colors mb-2 ${isLightMode ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}>
          <ArrowLeft size={14} /> Terug
        </button>
        <h2 className="text-2xl font-bold text-center mb-1" style={isLightMode ? {} : { textShadow: `0 0 8px ${NEON_COLOR}` }}>WACHTWOORD VERGETEN</h2>
        <p className="text-sm text-gray-400 text-center">We sturen een reset-link naar je e-mailadres.</p>
        <Input light={isLightMode} label="E-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@email.com" />
        {success ? (
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${isLightMode ? 'bg-green-50 border-green-200' : 'bg-green-900/30 border-green-700'}`}>
            <CheckCircle2 size={18} className={`shrink-0 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
            <p className={`text-sm ${isLightMode ? 'text-green-700' : 'text-green-300'}`}>{success}</p>
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
        <h2 className="text-2xl font-bold text-center mb-4" style={isLightMode ? {} : { textShadow: `0 0 8px ${NEON_COLOR}` }}>SPELER LOGIN</h2>
        <Input light={isLightMode} label="Team ID" value={teamId} onChange={e => setTeamId(e.target.value)} placeholder="Vraag je coach" />
        <Input light={isLightMode} label="Jouw Pincode" value={pin} onChange={e => setPin(e.target.value)} placeholder="6-cijferige code" />
        <div className="flex items-center">
          <input id="remember-me" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className={`h-4 w-4 rounded ${isLightMode ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'}`} />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">Bewaar mijn gegevens</label>
        </div>
        <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading ? <Loader2 className="animate-spin" /> : 'Inloggen'}
        </button>
        {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Dit duurt langer dan normaal...</p>}
        <p className="text-center text-sm text-gray-500">
          Ben je coach? <button type="button" onClick={() => { setView('coachLogin'); setError(''); }} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
        </p>
        {onParentLogin && (
          <p className="text-center text-sm text-gray-500">
            Ben je ouder? <button type="button" onClick={onParentLogin} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
          </p>
        )}
      </form>
    );

    if (view === 'coachInviteWelcome' && invite) return (
      <CoachInviteWelcome
        invite={invite}
        light={isLightMode}
        claiming={claimingInvite}
        onContinue={() => { void claimInvite(); }}
        onLogin={() => { setView('coachLogin'); setError(''); }}
      />
    );

    // Coach login (wachtwoordloos, alleen magic-link) / register (met wachtwoord)
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          if (view === 'coachLogin') void handleSendMagicLink();
          else void handleCoachAuth(true);
        }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-4" style={isLightMode ? {} : { textShadow: `0 0 8px ${NEON_COLOR}` }}>
          {view === 'coachLogin' ? 'COACH LOGIN' : 'COACH REGISTRATIE'}
        </h2>
        {view === 'coachRegister' && invite && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${isLightMode ? 'bg-green-50 border-green-200' : 'bg-green-900/30 border-green-700'}`}>
            <CheckCircle2 size={18} className={`shrink-0 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
            <p className={`text-sm ${isLightMode ? 'text-green-700' : 'text-green-300'}`}>
              Je bent uitgenodigd als coach voor <strong>{invite.team_name}</strong>.
            </p>
          </div>
        )}
        <Input light={isLightMode} label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@email.com" disabled={!!invite} />
        {view === 'coachRegister' && (
          <Input light={isLightMode} label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        )}
        {view === 'coachRegister' && !invite && (
          <>
            <Input light={isLightMode} label="Kies een unieke Team ID" value={newTeamId} onChange={e => setNewTeamId(e.target.value)} placeholder="bv. VVC11-1" />
            <Input light={isLightMode} label="Club ID (optioneel)" value={clubIdInput} onChange={e => setClubIdInput(e.target.value)} placeholder="Vraag je club admin" />
          </>
        )}
        {view === 'coachLogin' && (
          <div className="flex items-center">
            <input id="remember-coach" type="checkbox" checked={rememberCoach} onChange={e => setRememberCoach(e.target.checked)} className={`h-4 w-4 rounded ${isLightMode ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'}`} />
            <label htmlFor="remember-coach" className="ml-2 block text-sm text-gray-400">Bewaar mijn e-mail</label>
          </div>
        )}
        {emailNotConfirmed && (
          <button
            type="button"
            disabled={resending}
            onClick={() => void handleResendConfirmation()}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex justify-center items-center gap-2 ${isLightMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-[#00FF9D] text-black hover:opacity-90'}`}
          >
            {resending ? <Loader2 className="animate-spin" size={16} /> : 'Bevestigingsmail opnieuw versturen'}
          </button>
        )}
        {success && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${isLightMode ? 'bg-green-50 border-green-200' : 'bg-green-900/30 border-green-700'}`}>
            <CheckCircle2 size={18} className={`shrink-0 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
            <p className={`text-sm ${isLightMode ? 'text-green-700' : 'text-green-300'}`}>{success}</p>
          </div>
        )}
        <button type="submit" disabled={loading || resending} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading || resending
            ? <Loader2 className="animate-spin" />
            : view === 'coachLogin' ? 'Stuur inloglink' : 'Registreren'}
        </button>
        {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Dit duurt langer dan normaal...</p>}
      </form>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen px-4 gap-6${isLightMode ? ' bg-white text-gray-900' : ''}`}>
      {onBack && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onBack}
          className={`absolute top-5 left-5 flex items-center gap-1.5 text-sm transition-colors ${isLightMode ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}
        >
          <ArrowLeft size={14} /> Terug naar home
        </motion.button>
      )}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-2">
        <img src="/logo.png" alt="Skillkaart" className="w-20 h-20 rounded-2xl object-cover" style={{ filter: `drop-shadow(0 0 12px ${NEON_COLOR}60)` }} />
        <p className="text-gray-500 text-sm">Voetbal ontwikkeling voor jongeren</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="w-full max-w-sm">
        <Card light={isLightMode}>
          {renderForm()}
          {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
          {view === 'resetPassword' && success && (
            <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-green-900/30 border border-green-700">
              <CheckCircle2 size={18} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}
          {view === 'coachLogin' && (
            <>
              <p className="text-center text-sm mt-4 text-gray-500">
                Nog geen account? <button onClick={() => setView('coachRegister')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Registreer hier</button>
              </p>
              <p className="text-center text-sm mt-1 text-gray-500">
                Ben je speler? <button onClick={() => { setView('playerLogin'); setError(''); }} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
              </p>
              {onParentLogin && (
                <p className="text-center text-sm mt-1 text-gray-500">
                  Ben je ouder? <button onClick={onParentLogin} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
                </p>
              )}
            </>
          )}
          {view === 'coachRegister' && (
            <p className="text-center text-sm mt-4 text-gray-500">
              Al een account? <button onClick={() => setView('coachLogin')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
            </p>
          )}

        </Card>
      </motion.div>
    </div>
  );
};

export default AuthComponent;
