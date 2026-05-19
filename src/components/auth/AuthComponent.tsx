import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { NEON_COLOR } from '../../utils/constants';
import type { UserData } from '../../types';

interface AuthComponentProps {
  onPlayerLogin: (playerData: UserData & Record<string, unknown>) => void;
  isRecovering?: boolean;
  onPasswordUpdated?: () => void;
}

type View = 'playerLogin' | 'coachLogin' | 'coachRegister' | 'forgotPassword' | 'resetPassword';

const AuthComponent = ({ onPlayerLogin, isRecovering = false, onPasswordUpdated }: AuthComponentProps) => {
  const [view, setView] = useState<View>(() => isRecovering ? 'resetPassword' : 'playerLogin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamId, setTeamId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberCoach, setRememberCoach] = useState(false);

  useEffect(() => {
    if (isRecovering) setView('resetPassword');
  }, [isRecovering]);

  useEffect(() => {
    if (view === 'playerLogin') {
      const savedTeamId = localStorage.getItem('rememberedTeamId');
      const savedPin = localStorage.getItem('rememberedPin');
      if (savedTeamId && savedPin) { setTeamId(savedTeamId); setPin(savedPin); setRememberMe(true); }
    } else if (view === 'coachLogin') {
      const savedEmail = localStorage.getItem('rememberedCoachEmail');
      if (savedEmail) { setEmail(savedEmail); setRememberCoach(true); }
    }
  }, [view]);

  const handleCoachAuth = async (isRegistering: boolean) => {
    setLoading(true); setError('');
    try {
      if (isRegistering) {
        if (!newTeamId.trim()) throw new Error('Een unieke Team ID is verplicht om een team te registreren.');
        const { data: teamData } = await supabase.from('teams').select('id').eq('id', newTeamId).single();
        if (teamData) throw new Error('Deze Team ID is al in gebruik. Kies een andere.');
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        await supabase.from('teams').insert({ id: newTeamId, coach_id: data.user!.id, team_name: `${email.split('@')[0]}'s Team` });
        await supabase.from('profiles').insert({ id: data.user!.id, role: 'coach', team_id: newTeamId });
      } else {
        if (rememberCoach) localStorage.setItem('rememberedCoachEmail', email);
        else localStorage.removeItem('rememberedCoachEmail');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const messages: Record<string, string> = {
        'Invalid login credentials': 'Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord.',
        'User already registered': 'Dit e-mailadres is al in gebruik door een ander account.',
        'Password should be at least 6 characters': 'Het wachtwoord moet uit minstens 6 tekens bestaan.',
      };
      setError(messages[(err as Error).message] ?? (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (!teamId.trim() || !pin.trim()) throw new Error('Team ID en Pincode zijn beide verplicht.');
      const { data: playerData, error } = await supabase
        .from('players').select('*').eq('team_id', teamId).eq('pin', pin).single();
      if (error || !playerData) throw new Error('Speler niet gevonden. Controleer de Team ID en Pincode.');
      if (rememberMe) { localStorage.setItem('rememberedTeamId', teamId); localStorage.setItem('rememberedPin', pin); }
      else { localStorage.removeItem('rememberedTeamId'); localStorage.removeItem('rememberedPin'); }
      onPlayerLogin({ role: 'player', teamId, uid: playerData.id, ...playerData });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (!email.trim()) throw new Error('Vul je e-mailadres in.');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
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

  const btnClass = "w-full py-3 font-bold text-black rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50";

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
        <button type="button" onClick={() => { setView('coachLogin'); setError(''); setSuccess(''); }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-2">
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
      </form>
    );

    return (
      <form onSubmit={e => { e.preventDefault(); void handleCoachAuth(view === 'coachRegister'); }} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-4" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>
          {view === 'coachLogin' ? 'COACH LOGIN' : 'COACH REGISTRATIE'}
        </h2>
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@email.com" />
        <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        {view === 'coachRegister' && (
          <Input label="Kies een unieke Team ID" value={newTeamId} onChange={e => setNewTeamId(e.target.value)} placeholder="bv. VVC11-1" />
        )}
        {view === 'coachLogin' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-coach" type="checkbox" checked={rememberCoach} onChange={e => setRememberCoach(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800" />
              <label htmlFor="remember-coach" className="ml-2 block text-sm text-gray-400">Bewaar mijn e-mail</label>
            </div>
            <button type="button" onClick={() => { setView('forgotPassword'); setError(''); }} className="text-sm text-gray-400 hover:text-white transition-colors">
              Vergeten?
            </button>
          </div>
        )}
        <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
          {loading ? <Loader2 className="animate-spin" /> : view === 'coachLogin' ? 'Inloggen' : 'Registreren'}
        </button>
      </form>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-sm">
          {view !== 'forgotPassword' && view !== 'resetPassword' && (
            <div className="flex border-b border-gray-700 mb-6">
              <button onClick={() => { setView('playerLogin'); setError(''); }} className={`w-full py-3 font-medium ${view === 'playerLogin' ? 'text-[--neon-color]' : 'text-gray-400'}`}>Speler</button>
              <button onClick={() => { setView('coachLogin'); setError(''); }} className={`w-full py-3 font-medium ${view.startsWith('coach') ? 'text-[--neon-color]' : 'text-gray-400'}`}>Coach</button>
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
          {view === 'coachLogin' && <p className="text-center text-sm mt-4 text-gray-400">Nog geen account? <button onClick={() => setView('coachRegister')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Registreer hier</button></p>}
          {view === 'coachRegister' && <p className="text-center text-sm mt-4 text-gray-400">Al een account? <button onClick={() => setView('coachLogin')} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button></p>}
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthComponent;
