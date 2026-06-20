import { motion, AnimatePresence } from 'framer-motion';
import { STAT_XP } from '../../lib/stats';
import type { StatAxis, StatEvent } from '../../types';

const AXIS_LABELS: Record<StatAxis, string> = {
  consistentie: 'Consistentie',
  werkethiek:   'Werkethiek',
  techniek:     'Techniek',
  focus:        'Focus',
  team_spirit:  'Team Spirit',
};

interface XPFloaterProps {
  visible: boolean;
  eventType: StatEvent['event_type'] | null;
}

const XPFloater = ({ visible, eventType }: XPFloaterProps) => {
  const contributions = eventType ? (STAT_XP[eventType] ?? []) : [];
  const totalXP = contributions.reduce((s, c) => s + c.xp, 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 pointer-events-none"
          initial={{ opacity: 0, y: 4, scale: 0.75 }}
          animate={{ opacity: 1, y: -8, scale: 1 }}
          exit={{ opacity: 0, y: -28, scale: 0.85 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="px-3.5 py-1.5 rounded-2xl text-sm font-black shadow-lg whitespace-nowrap"
              style={{ backgroundColor: '#00FF9D', color: '#000', boxShadow: '0 4px 20px #00FF9D50' }}
            >
              +{totalXP} XP
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {contributions.map(({ axis, xp }) => (
                <span
                  key={axis}
                  className="text-[9px] font-bold text-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
                >
                  +{xp} {AXIS_LABELS[axis]}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPFloater;
