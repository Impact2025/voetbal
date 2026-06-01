import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import Input from '../ui/Input';
import { DEFAULT_EVALUATION_PERIODS } from '../../utils/constants';
import type { Team } from '../../types';

interface CoachProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamData: Partial<Team>;
  onSave: (data: { team_name: string; team_class: string; evaluation_periods: string[] }) => Promise<void>;
}

const CoachProfileModal = ({ isVisible, onClose, teamData, onSave }: CoachProfileModalProps) => {
  const [teamName, setTeamName] = useState('');
  const [teamClass, setTeamClass] = useState('');
  const [periods, setPeriods] = useState<string[]>(DEFAULT_EVALUATION_PERIODS.slice());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teamData) {
      setTeamName(teamData.team_name || '');
      setTeamClass(teamData.team_class || '');
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
    await onSave({ team_name: teamName, team_class: teamClass, evaluation_periods: cleanPeriods });
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-lg max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Coach / Team Profiel</h3>

            <div className="space-y-4 mb-6">
              <Input label="Teamnaam" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Naam van je team" />
              <Input label="Klasse" value={teamClass} onChange={e => setTeamClass(e.target.value)} placeholder="bv. JO11-2" />
            </div>

            {/* Evaluatieperioden */}
            <div className="border-t border-gray-800 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-white">Evaluatieperioden</p>
                  <p className="text-xs text-gray-500 mt-0.5">Max 6 perioden · min 1</p>
                </div>
                <button
                  onClick={handleAddPeriod}
                  disabled={periods.length >= 6}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={12} /> Toevoegen
                </button>
              </div>
              <div className="space-y-2">
                {periods.map((period, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical size={14} className="text-gray-700 shrink-0" />
                    <input
                      type="text"
                      value={period}
                      onChange={e => handleRenamePeriod(idx, e.target.value)}
                      maxLength={20}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[--neon-color]"
                      placeholder={`Periode ${idx + 1}`}
                    />
                    <button
                      onClick={() => handleRemovePeriod(idx)}
                      disabled={periods.length <= 1}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-600 mt-3">
                Let op: hernoemen van bestaande perioden kan bestaande evaluatiedata ontkoppelen als namen veranderen.
              </p>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Sluiten</button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                Opslaan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoachProfileModal;
