import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { NEON_COLOR } from '../../utils/constants';

const withTimeout = <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);

const ClubLogin = () => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newClubId, setNewClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rememberedClubEmail');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  // Demo-account via ?demo=clubAdmin (van /demo pagina)
  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (demo === 'clubAdmin') {
      window.history.replaceState({}, '', window.location.pathname);
      setEmail('chat@weareimpact.nl');
      setPassword('Skillkaart2026!');
    }
  }, []);

  const attemptLogin = async () => {
    if (rememberMe) localStorage.setItem('rememberedClubEmail', email);
    else localStorage.removeItem('rememberedClubEmail');
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      45000, '__timeout__'
    );
    if (error) throw error;
    return data.session;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSlowHint(false); setError(''); setSuccess('');
    const t = setTimeout(() => setSlowHint(true), 8000);
    try {
      // signInWithPassword geeft de sessie al terug in de response — geen losse
      // getSession() call meer nodig. Die kan intern blijven hangen achter de
      // GoTrueClient-lock als onAuthStateChange in App.tsx tegelijk een profiles-
      // query aan het uitvoeren is (zie getSessionSafe-comment in App.tsx).
      const session = await attemptLogin();
      // Supabase onAuthStateChange in App.tsx pikt de sessie op; redirect weg
      // van /club zodat App.tsx de club_admin rol ziet en het dashboard toont.
      if (session?.user) {
        window.location.href = '/';
      }
    } catch (err) {
      const msg = (err as Error).message;
      const messages: Record<string, string> = {
        'Invalid login credentials': 'Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord.',
        'Email not confirmed': 'Je e-mailadres is nog niet bevestigd. Controleer je inbox (en spammap) voor de bevestigingslink.',
      };
      setError(messages[msg] ?? msg);
    } finally {
      clearTimeout(t); setLoading(false); setSlowHint(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubId.trim()) { setError('Kies een unieke Club ID.'); return; }
    if (!clubName.trim()) { setError('Vul een clubnaam in.'); return; }
    if (password.length < 6) { setError('Wachtwoord moet minimaal 6 tekens zijn.'); return; }

    setLoading(true); setError(''); setSuccess('');
    try {
      const { data: existing } = await supabase.from('clubs').select('id').eq('id', newClubId).single();
      if (existing) throw new Error('Deze Club ID is al in gebruik. Kies een andere.');

      const { data, error } = await withTimeout(
        supabase.auth.signUp({ email, password }),
        45000, 'Registratie duurt te lang. Controleer je verbinding.'
      );
      if (error) throw error;

      await supabase.from('clubs').insert({ id: newClubId, name: clubName.trim() });
      await supabase.from('profiles').insert({ id: data.user!.id, role: 'club_admin', club_id: newClubId });
      setSuccess('Registratie succesvol! Controleer je e-mail voor de bevestigingslink, daarna kun je inloggen.');
      setView('login');
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
      const redirectTo = window.location.hostname === 'localhost' ? window.location.origin : 'https://skillkaart.nl/club';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setSuccess('Reset-link verstuurd! Controleer je inbox (en spammap).');
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setError('Te veel reset-mails verstuurd. Wacht een uur en probeer het opnieuw.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const btnClass = 'w-full py-3 font-bold text-black rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white">
      <Card light={false}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <Building2 size={40} style={{ color: NEON_COLOR }} />
          <h2 className="text-2xl font-bold text-center mb-2" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>
            {view === 'login' ? 'CLUB LOGIN' : 'CLUB REGISTRATIE'}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-4">
            Alleen voor geverifieerde club-administratoren.
          </p>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-900/30 border border-green-700">
              <CheckCircle2 size={18} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <Input light={false} label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@club.nl" />
              <Input light={false} label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-club"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800"
                  />
                  <label htmlFor="remember-club" className="ml-2 block text-sm text-gray-400">Bewaar mijn e-mail</label>
                </div>
                <button
                  type="button"
                  onClick={e => { setError(''); setSuccess(''); void handleForgotPassword(e); }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Wachtwoord vergeten?
                </button>
              </div>
              <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
                {loading ? <Loader2 className="animate-spin" /> : 'Inloggen'}
              </button>
              {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Server start op na inactiviteit, dit kan even duren...</p>}
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="w-full space-y-4">
              <Input light={false} label="Clubnaam" value={clubName} onChange={e => setClubName(e.target.value)} placeholder="bv. VV Sportlust" />
              <Input light={false} label="Kies een unieke Club ID" value={newClubId} onChange={e => setNewClubId(e.target.value)} placeholder="bv. VVS-CLUB" />
              <Input light={false} label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@club.nl" />
              <Input light={false} label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimaal 6 tekens" />
              <button type="submit" disabled={loading} className={btnClass} style={{ backgroundColor: NEON_COLOR }}>
                {loading ? <Loader2 className="animate-spin" /> : 'Club Registreren'}
              </button>
            </form>
          )}

          {view === 'login' && (
            <p className="text-center text-sm mt-4 text-gray-400">
              Nog geen account? <button onClick={() => { setView('register'); setError(''); setSuccess(''); }} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Club registreren</button>
            </p>
          )}

          {view === 'register' && (
            <p className="text-center text-sm mt-4 text-gray-400">
              Al een account? <button onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>Log hier in</button>
            </p>
          )}

          <button
            type="button"
            onClick={() => { window.location.href = 'https://www.skillkaart.nl/'; }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mt-2"
          >
            <ArrowLeft size={14} /> Terug naar homepage
          </button>
        </motion.div>
      </Card>
    </div>
  );
};

export default ClubLogin;
