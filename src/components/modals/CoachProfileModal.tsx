import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Trash2, GripVertical, Settings2, X, AlertTriangle, User, Shield, Calendar } from 'lucide-react';
import { DEFAULT_EVALUATION_PERIODS, COACH_COLOR } from '../../utils/constants';
import type { Team } from '../../types';

interface CoachProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamData: Partial<Team>;
  onSave: (data: { team_name: string; team_class: string; evaluation_periods: string[]; coach_name: string }) => Promise<void>;
}

function FieldGroup({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} style={{ color: COACH_COLOR }} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      {children}
    </div>
  );
}

const inputClass =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 ' +
  'focus:outline-none focus:ring-2 focus:border-emerald-500 transition-colors';

const CoachProfileModal = ({ isVisible, onClose, teamData, onSave }: CoachProfileModalProps) => {
  const [teamName, setTeamName] = useState('');
  const [teamClass, setTeamClass] = useState('');
  const [coachName, setCoachName] = useState('');
  const [periods, setPeriods] = useState<string[]>(DEFAULT_EVALUATION_PERIODS.slice());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teamData) {
      setTeamName(teamData.team_name || '');
      setTeamClass(teamData.team_class || '');
      setCoachName(teamData.coach_name || '');
      setPeriods(
        Array.isArray(teamData.evaluation_periods) && teamData.evaluation_periods.length > 0
          ? teamData.evaluation_periods.slice()
          : DEFAULT_EVALUATION_PERIODS.slice()
      );
    }
  }, [teamData, isVisible]);

  if (!isVisible) return null;

  const handleAddPeriod = () => {
    if (periods.length >= 6) return;
    setPeriods(prev => [...prev, `Periode ${prev.length + 1}`]);
  };

  const handleRemovePeriod = (idx: number) => {
    if (periods.length <= 1) return;
    setPeriods(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRenamePeriod = (idx: number, value: string) => {
    setPeriods(prev => prev.map((p, i) => i === idx ? value : p));
  };

  const handleSave = async () => {
    const cleanPeriods = periods.map(p => p.trim()).filter(Boolean);
    if (cleanPeriods.length === 0) return;
    setLoading(true);
    await onSave({ team_name: teamName, team_class: teamClass, evaluation_periods: cleanPeriods, coach_name: coachName.trim() });
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{
              background: '#ffffff',
              borderRadius: 24,
              border: '1px solid #e5e7eb',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            }}
            initial={{ scale: 0.93, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.93, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${COACH_COLOR}15` }}>
                  <Settings2 size={17} style={{ color: COACH_COLOR }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-gray-900 leading-tight">Instellingen Team</h3>
                  <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Beheer je teamgegevens</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Coach naam */}
              <FieldGroup icon={User} label="Coach">
                <input
                  className={inputClass}
                  style={{ '--tw-ring-color': `${COACH_COLOR}30` } as React.CSSProperties}
                  value={coachName}
                  onChange={e => setCoachName(e.target.value)}
                  placeholder="Jouw naam"
                />
              </FieldGroup>

              {/* Team info */}
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup icon={Shield} label="Teamnaam">
                  <input
                    className={inputClass}
                    style={{ '--tw-ring-color': `${COACH_COLOR}30` } as React.CSSProperties}
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="Impact JO10-1"
                  />
                </FieldGroup>
                <FieldGroup icon={Shield} label="Klasse">
                  <input
                    className={inputClass}
                    style={{ '--tw-ring-color': `${COACH_COLOR}30` } as React.CSSProperties}
                    value={teamClass}
                    onChange={e => setTeamClass(e.target.value)}
                    placeholder="JO10-1"
                  />
                </FieldGroup>
              </div>
            </div>

            {/* Evaluatieperioden */}
            <div className="px-6 pb-5" style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                    <Calendar size={13} style={{ color: COACH_COLOR }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Evaluatieperioden</p>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {periods.length} van 6 · min 1
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={handleAddPeriod}
                  disabled={periods.length >= 6}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: `${COACH_COLOR}12`, color: COACH_COLOR }}
                  whileHover={{ scale: periods.length < 6 ? 1.03 : 1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus size={12} /> Toevoegen
                </motion.button>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {periods.map((period, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white transition-all group"
                    >
                      <GripVertical size={13} className="text-gray-300 shrink-0 cursor-grab" />
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                        style={{ background: `${COACH_COLOR}15`, color: COACH_COLOR }}
                      >
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={period}
                        onChange={e => handleRenamePeriod(idx, e.target.value)}
                        maxLength={20}
                        className="flex-1 bg-transparent border-none text-sm text-gray-900 font-medium focus:outline-none placeholder-gray-400 min-w-0"
                        placeholder={`Periode ${idx + 1}`}
                      />
                      <button
                        onClick={() => handleRemovePeriod(idx)}
                        disabled={periods.length <= 1}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-0 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Warning */}
              <div className="flex gap-2.5 mt-4 p-3 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                <p className="text-[11px] leading-relaxed" style={{ color: '#92400e' }}>
                  Hernoemen van bestaande perioden kan evaluatiedata ontkoppelen als de naam verandert.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 pb-5" style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Annuleren
              </button>
              <motion.button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity"
                style={{ background: COACH_COLOR }}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : null}
                Wijzigingen opslaan
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoachProfileModal;
