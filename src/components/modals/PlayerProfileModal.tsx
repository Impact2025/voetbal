import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy, Camera, RefreshCw, User, X } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { copyToClipboard } from '../../utils/clipboard';
import { uploadAvatar } from '../../lib/storage';
import { COACH_COLOR } from '../../utils/constants';
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <User size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">Profiel van {player.name}</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={currentAvatar}
                    alt={player.name}
                    className="w-20 h-20 rounded-full border-2 border-emerald-200 object-cover"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white transition-colors"
                    style={{ backgroundColor: COACH_COLOR }}
                    title="Foto wijzigen"
                  >
                    <Camera size={13} className="text-white" />
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <p className="text-xs text-gray-400 mt-2">Klik op het camera-icoontje voor een foto (max 2 MB)</p>
              </div>

              <div className="space-y-4">
                <Input light label="Leeftijd" value={age} onChange={e => setAge(e.target.value)} placeholder="bv. 10" />
                <Select light label="Voorkeursbeen" value={preferredFoot} onChange={e => setPreferredFoot(e.target.value)}>
                  <option>Rechts</option>
                  <option>Links</option>
                  <option>Beide</option>
                </Select>
                <Input light label="Positie" value={position} onChange={e => setPosition(e.target.value)} placeholder="bv. Spits" />
              </div>

              {/* Inloggegevens */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Inloggegevens</p>
                <div className="space-y-2">
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-400 font-medium mb-1">Team ID</p>
                    <div className="flex justify-between items-center">
                      <strong className="text-gray-900 font-mono text-sm">{teamId}</strong>
                      <button onClick={() => void copyToClipboard(teamId)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700 font-medium mb-1">Pincode</p>
                    {newPin ? (
                      <div>
                        <p className="text-xs text-emerald-600 mb-1">Nieuwe pincode aangemaakt:</p>
                        <div className="flex justify-between items-center">
                          <strong className="text-gray-900 font-mono text-2xl tracking-widest">{newPin}</strong>
                          <button onClick={() => void copyToClipboard(newPin)} className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors text-amber-600">
                            <Copy size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-amber-600 mt-1">Sla de code op. Wordt eenmalig getoond.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-amber-600">Versleuteld opgeslagen en niet zichtbaar.</p>
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
                            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 disabled:opacity-50 hover:underline"
                          >
                            {resettingPin ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            Pincode Resetten
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium">Sluiten</button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 text-sm"
                  style={{ backgroundColor: COACH_COLOR }}
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : null}
                  Opslaan
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlayerProfileModal;
