import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { copyToClipboard } from '../../utils/clipboard';
import type { Player } from '../../types';

interface PlayerProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  player: Player | null;
  teamId: string;
  onSave: (playerId: string, data: { age: string; preferred_foot: string; position: string }) => Promise<void>;
}

const PlayerProfileModal = ({ isVisible, onClose, player, teamId, onSave }: PlayerProfileModalProps) => {
  const [age, setAge] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('Rechts');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (player) {
      setAge(player.age || '');
      setPreferredFoot(player.preferred_foot || 'Rechts');
      setPosition(player.position || '');
    }
  }, [player]);

  if (!isVisible || !player) return null;

  const handleSave = async () => {
    setLoading(true);
    await onSave(player.id, { age, preferred_foot: preferredFoot, position });
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
            <h3 className="text-lg font-bold text-white mb-4">Profiel van {player.name}</h3>
            <div className="space-y-4">
              <Input label="Leeftijd" value={age} onChange={e => setAge(e.target.value)} placeholder="bv. 10" />
              <Select label="Voorkeursbeen" value={preferredFoot} onChange={e => setPreferredFoot(e.target.value)}>
                <option>Rechts</option>
                <option>Links</option>
                <option>Beide</option>
              </Select>
              <Input label="Positie" value={position} onChange={e => setPosition(e.target.value)} placeholder="bv. Spits" />
            </div>
            <h4 className="text-md font-bold text-white mt-6 mb-2">Inloggegevens</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Team ID</p>
                <div className="flex justify-between items-center">
                  <strong className="text-white font-mono">{teamId}</strong>
                  <button onClick={() => copyToClipboard(teamId)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16} /></button>
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Pincode</p>
                <div className="flex justify-between items-center">
                  <strong className="text-white font-mono">{player.pin}</strong>
                  <button onClick={() => copyToClipboard(player.pin)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16} /></button>
                </div>
              </div>
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

export default PlayerProfileModal;
