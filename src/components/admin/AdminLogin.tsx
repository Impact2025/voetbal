import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR } from '../../utils/constants';

interface Props {
  onBack: () => void;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

export default function AdminLogin({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [slowHint, setSlowHint] = useState(false);

  // Pre-warm GoTrue so cold-start delay hits while the user types, not after submit.
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    fetch(`${url}/auth/v1/health`).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSlowHint(false);
    setLoading(true);
    const slowTimer = setTimeout(() => setSlowHint(true), 6000);
    try {
      let lastErr: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { error: authError } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            20000
          );
          if (authError) throw authError;
          return;
        } catch (err) {
          lastErr = err as Error;
          if ((err as Error).message !== 'timeout') throw err; // real auth error, don't retry
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        }
      }
      throw lastErr;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Inloggen mislukt';
      const translated = msg === 'Email not confirmed'
        ? 'Je e-mailadres is nog niet bevestigd. Controleer je inbox (en spammap) voor de bevestigingslink, of vraag hieronder een nieuwe link aan.'
        : msg === 'timeout'
          ? 'Server reageert niet. Probeer het opnieuw.'
          : msg;
      setError(translated);
    } finally {
      clearTimeout(slowTimer);
      setSlowHint(false);
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) { setError('Vul eerst je e-mailadres in.'); return; }
    setResending(true); setError(''); setSuccess('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSuccess('Bevestigingsmail opnieuw verstuurd! Check je inbox (en spammap).');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setError('Te veel mails verstuurd. Wacht een uur en probeer het opnieuw.');
      } else {
        setError(msg || 'Kon de bevestigingsmail niet versturen. Probeer het later opnieuw.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${NEON_COLOR}18`, border: `1px solid ${NEON_COLOR}40` }}
          >
            <ShieldCheck className="h-7 w-7" style={{ color: NEON_COLOR }} />
          </div>
          <div className="text-xl font-black tracking-widest text-gray-900">SKILLKAART</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: NEON_COLOR }}>
            PLATFORM ADMIN
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1.5">
              E-mailadres
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[--neon-color] transition-colors"
              placeholder="admin@voorbeeld.nl"
              style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 uppercase tracking-wider mb-1.5">
              Wachtwoord
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[--neon-color] transition-colors"
              placeholder="••••••••"
              style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          {error && error.includes('nog niet bevestigd') && (
            <button
              type="button"
              disabled={resending}
              onClick={() => void handleResendConfirmation()}
              className="w-full py-2.5 rounded-xl font-black text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: NEON_COLOR, color: 'black' }}
            >
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bevestigingsmail opnieuw versturen'}
            </button>
          )}

          {success && (
            <p className="text-green-600 text-sm text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-black text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: NEON_COLOR }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inloggen'}
          </button>
          {slowHint && <p className="text-xs text-gray-500 text-center mt-2">Server start op, even geduld...</p>}
        </form>

        <button
          onClick={onBack}
          className="mt-6 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Terug naar app
        </button>
      </div>
    </div>
  );
}
