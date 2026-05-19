import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Input from '../ui/Input';
import type { Team } from '../../types';

interface CoachProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  teamData: Partial<Team>;
  onSave: (data: { team_name: string; team_class: string }) => Promise<void>;
}

const CoachProfileModal = ({ isVisible, onClose, teamData, onSave }: CoachProfileModalProps) => {
  const [teamName, setTeamName] = useState('');
  const [teamClass, setTeamClass] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teamData) {
      setTeamName(teamData.team_name || '');
      setTeamClass(teamData.team_class || '');
    }
  }, [teamData, isVisible]);

  if (!isVisible) return null;

  const handleSave = async () => {
    setLoading(true);
    await onSave({ team_name: teamName, team_class: teamClass });
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
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-lg"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Coach / Team Profiel</h3>
            <div className="space-y-4">
              <Input label="Teamnaam" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Naam van je team" />
              <Input label="Klasse" value={teamClass} onChange={e => setTeamClass(e.target.value)} placeholder="bv. JO11-2" />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Sluiten</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
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
