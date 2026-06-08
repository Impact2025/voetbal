import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy, Camera, RefreshCw } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { copyToClipboard } from '../../utils/clipboard';
import { uploadAvatar } from '../../lib/storage';
import { NEON_COLOR } from '../../utils/constants';
import type { Player } from '../../types';
import toast from 'react-hot-toast';

interface PlayerProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  player: Player | null;
  teamId: string;
  onSave: (playerId: string, data: { age: string; preferred_foot: string; position: string; avatar_url?: string }) => Promise<void>;
  onResetPin?: (playerId: string) => Promise<string>;
}

const PlayerProfileModal = ({ isVisible, onClose, player, teamId, onSave, onResetPin }: PlayerProfileModalProps) => {
  const [age, setAge] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('Rechts');
  const [position, setPosition] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resettingPin, setResettingPin] = useState(false);
  const [newPin, setNewPin] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setAge(player.age || '');
      setPreferredFoot(player.preferred_foot || 'Rechts');
      setPosition(player.position || '');
      setAvatarPreview(null);
      setAvatarFile(null);
      setNewPin(null);
    }
  }, [player]);

  if (!isVisible || !player) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Afbeelding mag maximaal 2 MB zijn.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatar_url: string | undefined;
      if (avatarFile) {
        avatar_url = await uploadAvatar(avatarFile, teamId, player.name);
      }
      await onSave(player.id, { age, preferred_foot: preferredFoot, position, ...(avatar_url ? { avatar_url } : {}) });
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Opslaan mislukt.');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = avatarPreview || player.avatar_url;

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
            <h3 className="text-lg font-bold text-white mb-5">Profiel van {player.name}</h3>

            {/* Avatar upload */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <img
                  src={currentAvatar}
                  alt={player.name}
                  className="w-20 h-20 rounded-full border-2 object-cover"
                  style={{ borderColor: NEON_COLOR }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-gray-900 transition-colors"
                  style={{ backgroundColor: NEON_COLOR }}
                  title="Foto wijzigen"
                >
                  <Camera size={13} className="text-black" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500 mt-2">Klik op het camera-icoontje om een foto te uploaden (max 2 MB)</p>
            </div>

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
                  <button onClick={() => void copyToClipboard(teamId)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16} /></button>
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg border border-yellow-900/40">
                <p className="text-sm text-gray-400">Pincode</p>
                {newPin ? (
                  <div className="mt-2">
                    <p className="text-xs text-green-400 mb-1">Nieuwe pincode aangemaakt:</p>
                    <div className="flex justify-between items-center">
                      <strong className="text-white font-mono text-2xl tracking-widest">{newPin}</strong>
                      <button onClick={() => void copyToClipboard(newPin)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16} /></button>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">Sla de code op voor de speler. Deze wordt eenmalig getoond.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-yellow-600 mt-0.5">Versleuteld opgeslagen en niet zichtbaar.</p>
                    {onResetPin && (
                      <button
                        onClick={async () => {
                          setResettingPin(true);
                          try {
                            const pin = await onResetPin(player.id);
                            setNewPin(pin);
                          } catch {
                            toast.error('Pincode resetten mislukt.');
                          } finally {
                            setResettingPin(false);
                          }
                        }}
                        disabled={resettingPin}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50 hover:underline"
                        style={{ color: NEON_COLOR }}
                      >
                        {resettingPin ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                        Pincode Resetten
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Sluiten</button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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
