import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Heart, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR } from '../../utils/constants';
import Input from '../ui/Input';

interface ParentAuthFlowProps {
  onBack: () => void;
}

type View = 'choice' | 'login' | 'register';

const ParentAuthFlow = ({ onBack }: ParentAuthFlowProps) => {
  const [view, setView]         = useState<View>('choice');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Vul e-mail en wachtwoord in.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError('Inloggen mislukt: ' + err.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !linkCode) { setError('Vul alle velden in.'); return; }
    if (password.length < 6) { setError('Wachtwoord moet minimaal 6 tekens zijn.'); return; }

    setError(''); setLoading(true);

    // Check if link code exists and is unclaimed
    const code = linkCode.trim().toUpperCase();
    const { data: link } = await supabase
      .from('parent_links').select('*')
      .eq('link_code', code).maybeSingle();

    if (!link) { setError('Koppelcode niet gevonden. Vraag de coach om een nieuwe code.'); setLoading(false); return; }
    if (link.verified) { setError('Deze code is al gebruikt. Vraag de coach om een nieuwe code.'); setLoading(false); return; }

    // Create Supabase account
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr || !authData.user) {
      setError(signUpErr?.message ?? 'Account aanmaken mislukt.');
      setLoading(false); return;
    }

    const uid = authData.user.id;

    // Create profile with role 'parent'
    await supabase.from('profiles').insert({
      id:   uid,
      role: 'parent',
      team_id: link.team_id,
    });

    // Link parent to player
    await supabase.from('parent_links')
      .update({ parent_id: uid, verified: true })
      .eq('link_code', code);

    // Create default notification prefs
    await supabase.from('notification_prefs').insert({
      parent_id:      uid,
      weekly_digest:  true,
      critical_alerts: true,
      channel:        'email',
      detail_level:   'light',
    });

    setLoading(false);
    // Auth state change will handle routing
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(to bottom, #0D0D0D, #1A1A1A)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={14} /> Terug
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${NEON_COLOR}15` }}>
            <Heart size={24} style={{ color: NEON_COLOR }} />
          </div>
          <h1 className="text-2xl font-black text-white">Ouder-portaal</h1>
          <p className="text-sm text-gray-500 mt-1">Volg de groei van jouw kind</p>
        </div>

        {/* Choice view */}
        {view === 'choice' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button
              onClick={() => setView('login')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-colors text-left"
            >
              <LogIn size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Inloggen</p>
                <p className="text-xs text-gray-500">Ik heb al een account</p>
              </div>
            </button>
            <button
              onClick={() => setView('register')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors text-left"
              style={{ borderColor: `${NEON_COLOR}40`, backgroundColor: `${NEON_COLOR}08` }}
            >
              <UserPlus size={18} style={{ color: NEON_COLOR }} className="shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Account aanmaken</p>
                <p className="text-xs text-gray-500">Ik heb een koppelcode van de coach</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Login view */}
        {view === 'login' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Input label="E-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ouder@email.nl" />
            <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-black flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: NEON_COLOR }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              Inloggen
            </button>
            <button onClick={() => { setView('choice'); setError(''); }} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Terug naar keuze
            </button>
          </motion.div>
        )}

        {/* Register view */}
        {view === 'register' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Koppelcode</p>
              <input
                className="w-full bg-transparent text-2xl font-black text-white tracking-[0.3em] text-center uppercase placeholder:text-gray-700 focus:outline-none"
                placeholder="ABC123"
                maxLength={6}
                value={linkCode}
                onChange={e => setLinkCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              />
              <p className="text-[9px] text-gray-600 text-center mt-1">Vraag de coach om jouw 6-cijferige koppelcode</p>
            </div>
            <Input label="Jouw e-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ouder@email.nl" />
            <Input label="Kies een wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimaal 6 tekens" />
            {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-black flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: NEON_COLOR }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              Account aanmaken
            </button>
            <button onClick={() => { setView('choice'); setError(''); }} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Terug naar keuze
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ParentAuthFlow;
