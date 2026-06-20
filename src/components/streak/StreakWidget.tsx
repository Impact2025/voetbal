import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import type { Streak } from '../../types';

interface StreakWidgetProps {
  streak: Streak | null;
}

const StreakWidget = ({ streak }: StreakWidgetProps) => {
  const count   = streak?.activities_count ?? 0;
  const goal    = streak?.week_goal ?? 2;
  const best    = streak?.best_week_count ?? 0;
  const state   = streak?.flame_state ?? 'active';
  const isComplete = state === 'complete';
  const isSleep    = state === 'sleep';

  const flameColor = isComplete ? '#4ade80' : isSleep ? '#4b5563' : '#f97316';
  const dots = Array.from({ length: goal }, (_, i) => i < count);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border p-4 flex items-center gap-4"
      style={{
        background: isComplete
          ? 'linear-gradient(135deg, #052e16 0%, #0f2e1a 100%)'
          : isSleep
          ? 'linear-gradient(135deg, #111827 0%, #1f2937 100%)'
          : 'linear-gradient(135deg, #1c0f00 0%, #2e1a0c 100%)',
        borderColor: isComplete ? '#4ade8030' : isSleep ? '#374151' : '#f9731630',
      }}
    >
      {/* Flame */}
      <motion.div
        animate={isComplete
          ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }
          : isSleep
          ? {}
          : { scale: [1, 1.08, 1] }
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="shrink-0"
      >
        <Flame
          size={32}
          style={{ color: flameColor, filter: isComplete ? `drop-shadow(0 0 8px ${flameColor}80)` : 'none' }}
          fill={isComplete || (!isSleep) ? flameColor : 'none'}
        />
      </motion.div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {/* Progress dots */}
          <div className="flex gap-1">
            {dots.map((filled, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: filled ? flameColor : '#374151' }}
                initial={false}
                animate={{ scale: filled ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              />
            ))}
          </div>
          <span className="text-xs font-black" style={{ color: flameColor }}>
            {isComplete ? 'Week doel behaald! 🎉' : isSleep ? 'Recovery mode 💤' : `${count}/${goal} deze week`}
          </span>
        </div>

        <p className="text-[10px] text-gray-500 leading-tight">
          {isComplete
            ? 'Jij bent consistent — dat is het echte talent.'
            : isSleep
            ? 'Doe vandaag nog iets en je bent weer terug op schema.'
            : `Nog ${goal - count} actie${goal - count !== 1 ? 's' : ''} voor je weekdoel.`}
        </p>
      </div>

      {/* Best week record */}
      <AnimatePresence>
        {best > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="shrink-0 flex flex-col items-center"
          >
            <Trophy size={12} className="text-yellow-500 mb-0.5" />
            <span className="text-[9px] font-black text-yellow-500">{best}</span>
            <span className="text-[8px] text-gray-600 uppercase tracking-wide">record</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StreakWidget;
