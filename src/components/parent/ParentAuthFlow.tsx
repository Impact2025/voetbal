import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Heart, LogIn, UserPlus, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Input from '../ui/Input';

interface ParentAuthFlowProps {
  onBack: () => void;
  /** Opent het ouder-dashboard in demo-modus (voorbeelddata, geen account). */
  onDemo?: () => void;
}

type View = 'choice' | 'login' | 'magic_sent' | 'register';

const ParentAuthFlow = ({ onBack, onDemo }: ParentAuthFlowProps) => {
  const [view, setView]         = useState<View>('choice');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  /** Gezet wanneer een 2e/3e koppelcode via een bestaand account geclaimd moet worden. */
  const [claimCode, setClaimCode] = useState('');

  const handleLogin = async (codeToClaim?: string) => {
    if (!email.includes('@')) { setError('Vul een geldig e-mailadres in.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/send-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), linkCode: codeToClaim || undefined }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Versturen mislukt. Probeer het opnieuw.');
      } else {
        setView('magic_sent');
      }
    } catch {
      setError('Verbinding mislukt. Probeer het opnieuw.');
    }
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
      const msg = signUpErr?.message ?? '';
      if (msg.toLowerCase().includes('security purposes') || msg.toLowerCase().includes('after')) {
        setError('Even geduld — wacht een minuutje en probeer het opnieuw.');
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        // Bestaand account: dit is waarschijnlijk een 2e/3e kind — bied direct
        // een "inloggen en koppelen"-pad via de magic-linkflow.
        setClaimCode(code);
        setError('Dit e-mailadres heeft al een account. Log in om dit kind te koppelen.');
      } else if (msg.toLowerCase().includes('rate limit')) {
        setError('Te veel pogingen. Wacht even en probeer het opnieuw.');
      } else {
        setError(msg || 'Account aanmaken mislukt. Controleer je gegevens.');
      }
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

  const ACCENT = '#16A34A';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={14} /> Terug
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
            <Heart size={24} style={{ color: ACCENT }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Ouder-portaal</h1>
          <p className="text-sm text-gray-500 mt-1">Volg de groei van jouw kind</p>
        </div>

        {/* Choice view */}
        {view === 'choice' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button
              onClick={() => setView('login')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <LogIn size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Inloggen</p>
                <p className="text-xs text-gray-400">Ik heb al een account</p>
              </div>
            </button>
            <button
              onClick={() => setView('register')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors text-left"
              style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
            >
              <UserPlus size={18} style={{ color: ACCENT }} className="shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Account aanmaken</p>
                <p className="text-xs text-gray-500">Ik heb een koppelcode van de coach of club</p>
              </div>
            </button>
            {onDemo && (
              <button
                onClick={onDemo}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-lg shrink-0">🧪</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Demo bekijken</p>
                  <p className="text-xs text-gray-400">Voorbeeld-dashboard met fictieve data</p>
                </div>
              </button>
            )}
          </motion.div>
        )}

        {/* Login view — wachtwoordloos via magic link */}
        {view === 'login' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500 leading-relaxed">
              Je ontvangt een inloglink per e-mail — geen wachtwoord nodig.
            </div>
            <Input label="E-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ouder@email.nl" />
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
            <button
              onClick={() => void handleLogin()}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              {loading ? 'Versturen...' : 'Stuur inloglink'}
            </button>
            <button onClick={() => { setView('choice'); setError(''); }} className="w-full text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Terug naar keuze
            </button>
          </motion.div>
        )}

        {/* Magic sent confirmation */}
        {view === 'magic_sent' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
              <CheckCircle2 size={26} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-base font-black text-gray-900 mb-1">Check je e-mail</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                We hebben een inloglink gestuurd naar<br />
                <strong className="text-gray-800">{email}</strong>.<br />
                Klik op de link om in te loggen.
              </p>
            </div>
            <p className="text-xs text-gray-400">Geen e-mail ontvangen? Check je spamfolder of wacht een minuutje.</p>
            <button onClick={() => { setView('login'); setError(''); }} className="w-full text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ander e-mailadres gebruiken
            </button>
          </motion.div>
        )}

        {/* Register view */}
        {view === 'register' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Koppelcode</p>
              <input
                className="w-full bg-transparent text-2xl font-black text-gray-900 tracking-[0.3em] text-center uppercase placeholder:text-gray-300 focus:outline-none"
                placeholder="ABC123"
                maxLength={6}
                value={linkCode}
                onChange={e => setLinkCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              />
              <p className="text-[9px] text-gray-400 text-center mt-1">Vraag de coach of club om jouw koppelcode</p>
            </div>
            <Input label="Jouw e-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ouder@email.nl" />
            <Input label="Kies een wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimaal 6 tekens" />
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
            {claimCode ? (
              <button
                onClick={() => { setError(''); void handleLogin(claimCode); }}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                Inloggen en dit kind koppelen
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                Account aanmaken
              </button>
            )}
            <button onClick={() => { setView('choice'); setError(''); setClaimCode(''); }} className="w-full text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Terug naar keuze
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ParentAuthFlow;
