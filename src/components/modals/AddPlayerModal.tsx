import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, CheckCircle2, Copy } from 'lucide-react';
import Input from '../ui/Input';
import { copyToClipboard } from '../../utils/clipboard';

interface AddPlayerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<{ id: string; pin: string }>;
  teamId: string;
}

interface NewPlayerInfo {
  name: string;
  id: string;
  pin: string;
}

const AddPlayerModal = ({ isVisible, onClose, onAdd, teamId }: AddPlayerModalProps) => {
  const [playerName, setPlayerName] = useState('');
  const [newPlayerInfo, setNewPlayerInfo] = useState<NewPlayerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPlayerName('');
    setNewPlayerInfo(null);
    setLoading(false);
    setError('');
  }, [isVisible]);

  const handleAdd = async () => {
    if (!playerName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const newPlayerData = await onAdd(playerName.trim());
      setNewPlayerInfo({ name: playerName.trim(), id: newPlayerData.id, pin: newPlayerData.pin });
    } catch (err) {
      setError((err as Error).message || 'Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
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
            {!newPlayerInfo ? (
              <>
                <h3 className="text-lg font-bold text-white mb-4">Nieuwe Speler Toevoegen</h3>
                <Input
                  label="Naam van de speler"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="bv. Johan Cruijff"
                />
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                <div className="flex justify-end gap-4 mt-6">
                  <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Annuleren</button>
                  <button
                    onClick={handleAdd}
                    disabled={loading || !playerName.trim()}
                    className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" size={16} />}
                    Aanmaken
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-green-400" />Speler Aangemaakt!
                </h3>
                <p className="text-gray-400 mb-4">
                  Deel de volgende inloggegevens met <strong className="text-white">{newPlayerInfo.name}</strong>:
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400">Team ID</p>
                    <div className="flex justify-between items-center">
                      <strong className="text-white font-mono">{teamId}</strong>
                      <button onClick={() => void copyToClipboard(teamId)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16} /></button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400">Pincode</p>
                    <div className="flex justify-between items-center">
                      <strong className="text-white font-mono text-2xl tracking-widest">{newPlayerInfo.pin}</strong>
                      <button onClick={() => void copyToClipboard(newPlayerInfo.pin)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16} /></button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">De pincode wordt eenmalig getoond. Sla hem op voor de speler.</p>
                <div className="flex justify-end mt-5">
                  <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity">Sluiten</button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPlayerModal;
