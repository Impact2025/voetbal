import { Lock, Zap } from 'lucide-react';
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
  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto"
      style={{ backgroundColor: `${NEON_COLOR}15`, border: `1px solid ${NEON_COLOR}40` }}
    >
      <Lock size={20} style={{ color: '#16a34a' }} />
    </div>
    <h3 className="text-lg font-black text-gray-900 mb-1">{feature}</h3>
    <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">{description}</p>
    {onUpgradeClick ? (
      <button
        onClick={onUpgradeClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90 transition-opacity"
        style={{ backgroundColor: NEON_COLOR }}
      >
        <Zap size={14} />
        Upgrade naar PRO
      </button>
    ) : (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
        style={{ backgroundColor: `${NEON_COLOR}10`, color: '#16a34a', borderColor: `${NEON_COLOR}30` }}
      >
        <Zap size={11} /> PRO feature — vraag je club-admin om te upgraden
      </div>
    )}
  </div>
);

export default ProGate;
