import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Copy, Eye, EyeOff, Loader2, History, ShieldCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { copyToClipboard } from '../../utils/clipboard';

const ACCENT = '#16A34A';
const REVEAL_SECONDS = 60;

interface LoginCredentialsCardProps {
  playerId: string;
  teamId: string;
  playerName: string;
  demo?: boolean;
}

interface AccessLogRow {
  id: string;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'zojuist';
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u geleden`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function LoginCredentialsCard({ playerId, teamId, playerName, demo = false }: LoginCredentialsCardProps) {
  const firstName = playerName.split(' ')[0];

  const [pin, setPin]           = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]         = useState<AccessLogRow[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (hideTimer.current) clearInterval(hideTimer.current); }, []);

  const startAutoHide = () => {
    if (hideTimer.current) clearInterval(hideTimer.current);
    setSecondsLeft(REVEAL_SECONDS);
    hideTimer.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (hideTimer.current) clearInterval(hideTimer.current);
          setPin(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleReveal = async () => {
    if (revealing) return;
    setRevealing(true);
    if (demo) {
      setPin('123456');
      startAutoHide();
      setRevealing(false);
      return;
    }
    const { data, error } = await supabase.rpc('parent_reveal_player_pin', { p_player_id: playerId });
    if (error || !(data as { pin: string }[] | null)?.[0]) {
      toast.error(error?.message?.includes('geduld') ? 'Even geduld, probeer over een paar seconden opnieuw.' : 'Ophalen mislukt. Probeer opnieuw.');
    } else {
      setPin((data as { pin: string }[])[0].pin);
      startAutoHide();
      if (showHistory) void loadHistory();
    }
    setRevealing(false);
  };

  const handleHide = () => {
    if (hideTimer.current) clearInterval(hideTimer.current);
    setPin(null);
    setSecondsLeft(0);
  };

  const loadHistory = async () => {
    if (demo) { setHistory([]); return; }
    setLoadingHistory(true);
    const { data } = await supabase
      .from('parent_pin_access_log')
      .select('id, created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(5);
    setHistory((data as AccessLogRow[] | null) ?? []);
    setLoadingHistory(false);
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && history === null) void loadHistory();
  };

  const handleCopy = (value: string, label: string) => {
    void copyToClipboard(value).then(() => toast.success(`${label} gekopieerd!`));
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound size={13} className="text-gray-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inloggegevens van {firstName}</p>
      </div>
      <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
        {firstName} logt in de app in met een Team ID en een pincode — geen wachtwoord nodig.
      </p>

      {/* Team ID */}
      <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
        <div>
          <p className="text-[10px] text-gray-400">Team ID</p>
          <p className="text-sm font-mono font-bold text-gray-900 tracking-wide">{teamId}</p>
        </div>
        <button onClick={() => handleCopy(teamId, 'Team ID')}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors min-w-[36px] min-h-[36px]">
          <Copy size={14} />
        </button>
      </div>

      {/* PIN */}
      <div className="py-3">
        <p className="text-[10px] text-gray-400 mb-2">Pincode</p>

        <AnimatePresence mode="wait">
          {pin ? (
            <motion.div key="revealed" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl p-3 border" style={{ backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}30` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl font-black tracking-[0.25em] font-mono select-all" style={{ color: ACCENT }}>
                  {pin}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleCopy(pin, 'Pincode')}
                    className="p-2 rounded-xl hover:bg-white text-gray-400 hover:text-gray-700 transition-colors min-w-[36px] min-h-[36px]">
                    <Copy size={14} />
                  </button>
                  <button onClick={handleHide}
                    className="p-2 rounded-xl hover:bg-white text-gray-400 hover:text-gray-700 transition-colors min-w-[36px] min-h-[36px]">
                    <EyeOff size={14} />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={9} /> Verbergt automatisch over {secondsLeft}s · vorige pincode werkt niet meer
              </p>
            </motion.div>
          ) : (
            <motion.button key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleReveal} disabled={revealing}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border-2 border-dashed border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all disabled:opacity-60 min-h-[48px]">
              {revealing ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
              {revealing ? 'Ophalen...' : 'Toon pincode'}
            </motion.button>
          )}
        </AnimatePresence>

        <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
          We bewaren de pincode nooit leesbaar — elke keer dat je hem opvraagt, maken we een nieuwe aan zodat een oude,
          eventueel gedeelde pincode vanzelf stopt met werken.
        </p>
      </div>

      {/* History */}
      <div className="border-t border-gray-50 pt-2">
        <button onClick={toggleHistory}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors min-h-[36px]">
          <span className="flex items-center gap-1.5"><History size={12} /> Wie heeft de pincode bekeken?</span>
          <span className="text-gray-300">{showHistory ? '−' : '+'}</span>
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              {loadingHistory ? (
                <div className="py-3 flex justify-center"><Loader2 size={14} className="animate-spin text-gray-300" /></div>
              ) : !history?.length ? (
                <p className="text-[11px] text-gray-400 py-2">Nog niet eerder bekeken.</p>
              ) : (
                <div className="space-y-1.5 pb-1">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-2 text-[11px] text-gray-500 py-1">
                      <ShieldCheck size={11} className="text-gray-300 shrink-0" />
                      Door jou bekeken · {timeAgo(h.created_at)}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
