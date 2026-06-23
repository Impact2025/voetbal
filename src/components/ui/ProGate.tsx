import { Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { NEON_COLOR } from '../../utils/constants';

interface ProGateProps {
  feature?: string;
  description?: string;
  onUpgradeClick?: () => void;
}

const ProGate = ({
  feature = 'Seizoensprogramma',
  description = 'Het volledige KNVB-seizoensprogramma met 32 trainingen per leeftijdscategorie, wekelijks huiswerk en challenges.',
  onUpgradeClick,
}: ProGateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl border border-gray-700/60"
  >
    {/* Blurred preview background */}
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-black/80 backdrop-blur-sm z-10" />

    {/* Fake content behind blur */}
    <div className="p-6 space-y-3 select-none pointer-events-none" aria-hidden>
      {[80, 60, 90, 50, 70].map((w, i) => (
        <div key={i} className="h-3 bg-gray-700/50 rounded-full" style={{ width: `${w}%` }} />
      ))}
    </div>

    {/* Overlay */}
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${NEON_COLOR}20`, border: `1px solid ${NEON_COLOR}40` }}
      >
        <Lock size={20} style={{ color: NEON_COLOR }} />
      </div>
      <h3 className="text-lg font-black text-white mb-1">{feature}</h3>
      <p className="text-sm text-gray-400 mb-5 max-w-xs leading-relaxed">{description}</p>
      {onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90 transition-opacity"
          style={{ backgroundColor: NEON_COLOR }}
        >
          <Zap size={14} />
          Upgrade naar PRO
        </button>
      )}
      {!onUpgradeClick && (
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: `${NEON_COLOR}20`, color: NEON_COLOR }}
        >
          <Zap size={11} /> PRO feature — vraag je club om te upgraden
        </div>
      )}
    </div>
  </motion.div>
);

export default ProGate;
