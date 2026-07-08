import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Bell, BellOff, CheckCircle2, Smartphone } from 'lucide-react';
import { COACH_COLOR } from '../../utils/constants';
import { usePWA } from '../../lib/usePWA';

type InstallRole = 'player' | 'coach' | 'parent' | 'club_admin';

const ROLE_COPY: Record<InstallRole, { title: string; subtitle: string }> = {
  player:     { title: 'Skillkaart App',        subtitle: 'Installeer op je telefoon' },
  coach:      { title: 'Skillkaart Coach',       subtitle: 'Beheer je team vanaf je telefoon' },
  parent:     { title: 'Skillkaart voor Ouders', subtitle: 'Volg je kind vanaf je telefoon' },
  club_admin: { title: 'Skillkaart Club',        subtitle: 'Beheer je club vanaf je telefoon' },
};

interface InstallModalProps {
  playerId?: string;
  open: boolean;
  onClose: () => void;
  role?: InstallRole;
}

export default function InstallModal({ playerId, open, onClose, role = 'player' }: InstallModalProps) {
  const { title, subtitle } = ROLE_COPY[role];
  const {
    canInstall,
    showInstallPrompt,
    pushSubscribed,
    subscribePush,
    unsubscribePush,
  } = usePWA();

  const [pushState, setPushState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [installDone, setInstallDone] = useState(false);

  // Reset bij openen
  useEffect(() => { if (open) { setPushState('idle'); setInstallDone(false); } }, [open]);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (accepted) setInstallDone(true);
  };

  const handleEnablePush = async () => {
    if (!playerId) return;
    setPushState('loading');
    const ok = await subscribePush(playerId);
    setPushState(ok ? 'done' : 'idle');
  };

  const handleDisablePush = async () => {
    if (!playerId) return;
    await unsubscribePush(playerId);
    setPushState('idle');
  };

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-sm rounded-3xl p-6 space-y-5"
            style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${COACH_COLOR}15`, border: `1px solid ${COACH_COLOR}30` }}>
                  <Download size={22} style={{ color: COACH_COLOR }} />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900">{title}</h2>
                  <p className="text-xs text-gray-500">{subtitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors text-xl leading-none">✕</button>
            </div>

            {/* ── Installatie knop (Android) ── */}
            {!isStandalone && canInstall && (
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.98]"
                style={{ backgroundColor: COACH_COLOR, boxShadow: `0 4px 0 ${COACH_COLOR}90` }}
              >
                <Smartphone size={18} />
                {installDone ? 'Installatie gestart!' : 'Installeer de app'}
              </button>
            )}

            {!isStandalone && !canInstall && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">iPhone (Safari)</p>
                  <ol className="text-sm text-gray-600 space-y-1.5 list-none">
                    <li><span className="font-bold" style={{ color: COACH_COLOR }}>1.</span> Open de link in Safari</li>
                    <li><span className="font-bold" style={{ color: COACH_COLOR }}>2.</span> Tik op <span className="font-semibold text-gray-900">Delen</span></li>
                    <li><span className="font-bold" style={{ color: COACH_COLOR }}>3.</span> Kies <span className="font-semibold text-gray-900">Zet op beginscherm</span></li>
                  </ol>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Android (Chrome)</p>
                  <ol className="text-sm text-gray-600 space-y-1.5 list-none">
                    <li><span className="font-bold" style={{ color: COACH_COLOR }}>1.</span> Open in Chrome</li>
                    <li><span className="font-bold" style={{ color: COACH_COLOR }}>2.</span> Tik op <span className="font-semibold text-gray-900">⋮</span> rechtsboven</li>
                    <li><span className="font-bold" style={{ color: COACH_COLOR }}>3.</span> Kies <span className="font-semibold text-gray-900">App installeren</span></li>
                  </ol>
                </div>
              </div>
            )}

            {isStandalone && (
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: `${COACH_COLOR}0d`, border: `1px solid ${COACH_COLOR}30` }}>
                <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: COACH_COLOR }} />
                <p className="text-sm font-bold text-gray-900">App is geïnstalleerd ✓</p>
                <p className="text-xs text-gray-500 mt-1">Je gebruikt de Skillkaart app.</p>
              </div>
            )}

            {/* ── Push notificaties (alleen spelers) ── */}
            {playerId && (
            <>
            <hr className="border-gray-200" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {pushSubscribed ? <Bell size={14} style={{ color: COACH_COLOR }} /> : <BellOff size={14} className="text-gray-400" />}
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {pushSubscribed ? 'Push notificaties AAN' : 'Push notificaties'}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {pushSubscribed
                  ? 'Je ontvangt meldingen van je coach.'
                  : 'Zet aan om meldingen te krijgen als je coach iets stuurt.'}
              </p>
              {pushSubscribed ? (
                <button
                  onClick={handleDisablePush}
                  className="w-full py-3 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Zet uit
                </button>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={pushState === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                  style={{ backgroundColor: COACH_COLOR }}
                >
                  {pushState === 'loading' ? 'Bezig...' : pushState === 'done' ? 'Aangezet ✓' : 'Zet aan'}
                </button>
              )}
            </div>
            </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
