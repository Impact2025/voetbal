import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, CheckCircle2, Copy, UserPlus, X } from 'lucide-react';
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {!newPlayerInfo ? (
              <>
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <UserPlus size={18} className="text-emerald-600" />
                    <h3 className="text-base font-bold text-gray-900">Speler Toevoegen</h3>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-6">
                  <Input
                    light
                    label="Naam van de speler"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="bv. Johan Cruijff"
                  />
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium">Annuleren</button>
                    <button
                      onClick={handleAdd}
                      disabled={loading || !playerName.trim()}
                      className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {loading ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
                      Aanmaken
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h3 className="text-base font-bold text-gray-900">Speler Aangemaakt!</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-500 text-sm mb-4">
                    Deel de volgende inloggegevens met <strong className="text-gray-900">{newPlayerInfo.name}</strong>:
                  </p>
                  <div className="space-y-3">
                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-xs text-gray-400 font-medium mb-1">Team ID</p>
                      <div className="flex justify-between items-center">
                        <strong className="text-gray-900 font-mono text-sm">{teamId}</strong>
                        <button onClick={() => void copyToClipboard(teamId)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400">
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-xs text-emerald-700 font-medium mb-1">Pincode</p>
                      <div className="flex justify-between items-center">
                        <strong className="text-gray-900 font-mono text-3xl tracking-widest">{newPlayerInfo.pin}</strong>
                        <button onClick={() => void copyToClipboard(newPlayerInfo.pin)} className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-3">De pincode wordt eenmalig getoond. Sla hem op voor de speler.</p>
                  <div className="flex justify-end mt-5">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity text-sm">Sluiten</button>
                  </div>
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
