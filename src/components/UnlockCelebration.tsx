import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarArt from './AvatarArt';
import { COACH_COLOR } from '../utils/constants';
import { type AvatarConfig, type Unlockable, previewConfig } from '../lib/avatar/catalog';

interface Props {
  items: Unlockable[];
  baseConfig: AvatarConfig;
  onClose: () => void;
  onOpenBuilder: () => void;
}

const CONFETTI_COLORS = ['#059669', '#5AC8FA', '#F5C542', '#EC4899', '#8B5CF6', '#F59433'];
const PIECES = Array.from({ length: 44 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 0.5,
  duration: 1.6 + Math.random() * 1.4,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + Math.random() * 6,
  rotate: Math.random() * 360,
  drift: (Math.random() - 0.5) * 80,
}));

export default function UnlockCelebration({ items, baseConfig, onClose, onOpenBuilder }: Props) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  const isLast = index >= items.length - 1;

  if (!item) return null;

  const next = () => {
    if (isLast) onClose();
    else setIndex(i => i + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center px-6 overflow-hidden"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: 'rgba(17,24,39,0.45)', backdropFilter: 'blur(4px)' }}
      >
        {PIECES.map(p => (
          <motion.span
            key={p.id}
            className="absolute top-0"
            style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: 2 }}
            initial={{ y: -40, opacity: 0, rotate: p.rotate }}
            animate={{ y: '105vh', x: p.drift, opacity: [0, 1, 1, 0.9], rotate: p.rotate + 360 }}
            transition={{ delay: p.delay, duration: p.duration, ease: 'easeIn', repeat: Infinity, repeatDelay: 0.4 }}
          />
        ))}

        <motion.div
          key={item.id}
          initial={{ scale: 0.7, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="relative w-full max-w-xs rounded-3xl p-6 text-center bg-white"
          style={{ border: `1px solid ${COACH_COLOR}25`, boxShadow: `0 20px 60px ${COACH_COLOR}30` }}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] mb-1" style={{ color: COACH_COLOR }}>Nieuw ontgrendeld!</p>
          <p className="text-[11px] text-gray-500 mb-4">Je haalde: {item.unlock.label}</p>

          <motion.div
            initial={{ rotate: -8, scale: 0.9 }}
            animate={{ rotate: [-8, 4, 0], scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-32 h-32 mx-auto rounded-3xl overflow-hidden"
            style={{ border: `2px solid ${COACH_COLOR}40`, boxShadow: `0 10px 40px ${COACH_COLOR}22` }}
          >
            <AvatarArt config={previewConfig(item, baseConfig)} className="w-full h-full" />
          </motion.div>

          <p className="text-lg font-black text-gray-900 mt-4">{item.label}</p>
          {items.length > 1 && (
            <p className="text-[11px] text-gray-400 mt-1">{index + 1} van {items.length}</p>
          )}

          <div className="mt-5 space-y-2">
            <button
              onClick={() => { onClose(); onOpenBuilder(); }}
              className="w-full py-3 rounded-2xl font-black text-white text-sm active:scale-[0.98] transition-transform"
              style={{ backgroundColor: COACH_COLOR }}
            >
              Nu gebruiken
            </button>
            <button
              onClick={next}
              className="w-full py-2.5 rounded-2xl font-semibold text-gray-500 text-sm bg-gray-100 active:scale-[0.98] transition-transform"
            >
              {isLast ? 'Sluiten' : 'Volgende'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
