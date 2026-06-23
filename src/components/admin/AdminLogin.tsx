import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR } from '../../utils/constants';

interface Props {
  onBack: () => void;
}

export default function AdminLogin({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      // App.tsx picks up the session via onAuthStateChange — no redirect needed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${NEON_COLOR}18`, border: `1px solid ${NEON_COLOR}33` }}
          >
            <ShieldCheck className="h-7 w-7" style={{ color: NEON_COLOR }} />
          </div>
          <div className="text-xl font-black tracking-widest text-white">SKILLKAART</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: NEON_COLOR }}>
            PLATFORM ADMIN
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              E-mailadres
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[--neon-color] transition-colors"
              placeholder="admin@voorbeeld.nl"
              style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              Wachtwoord
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[--neon-color] transition-colors"
              placeholder="••••••••"
              style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-black text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: NEON_COLOR }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inloggen'}
          </button>
        </form>

        {/* Back */}
        <button
          onClick={onBack}
          className="mt-6 w-full text-center text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← Terug naar app
        </button>
      </div>
    </div>
  );
}
