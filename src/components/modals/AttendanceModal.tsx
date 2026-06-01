import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CalendarCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR } from '../../utils/constants';
import type { Player, AttendanceRecord } from '../../types';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface AttendanceModalProps {
  isVisible: boolean;
  onClose: () => void;
  players: Player[];
  teamId: string;
  onSaved: () => void;
}

const AttendanceModal = ({ isVisible, onClose, players, teamId, onSaved }: AttendanceModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState(today);
  const [sessionType, setSessionType] = useState<'training' | 'wedstrijd'>('training');
  const [presence, setPresence] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(players.map(p => [p.id, true]))
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = players.map(p => ({
        team_id: teamId,
        player_id: p.id,
        session_date: sessionDate,
        session_type: sessionType,
        present: presence[p.id] ?? true,
        notes: notes[p.id]?.trim() || null,
      }));
      const { error } = await supabase.from('attendance').upsert(records, {
        onConflict: 'team_id,player_id,session_date,session_type',
      });
      if (error) throw error;
      toast.success('Aanwezigheid opgeslagen.');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-lg bg-[#111318] border border-gray-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} style={{ color: NEON_COLOR }} />
                <h2 className="font-bold">Aanwezigheid Registreren</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Datum"
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                  <div className="flex gap-2">
                    {(['training', 'wedstrijd'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSessionType(type)}
                        className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition-all capitalize ${
                          sessionType === type
                            ? 'border-[--neon-color] text-white'
                            : 'border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                        style={sessionType === type ? { color: NEON_COLOR, borderColor: NEON_COLOR, backgroundColor: `${NEON_COLOR}10` } : {}}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-400">Spelers</p>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => setPresence(Object.fromEntries(players.map(p => [p.id, true])))} className="text-green-400 hover:underline">Allen aanwezig</button>
                    <span className="text-gray-700">·</span>
                    <button onClick={() => setPresence(Object.fromEntries(players.map(p => [p.id, false])))} className="text-red-400 hover:underline">Allen afwezig</button>
                  </div>
                </div>
                {players.map(player => (
                  <div key={player.id} className={`rounded-xl border p-3 transition-colors ${presence[player.id] ? 'border-gray-700 bg-gray-900/40' : 'border-red-900/40 bg-red-950/20'}`}>
                    <div className="flex items-center gap-3">
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <span className="flex-1 text-sm font-medium">{player.name}</span>
                      <button
                        onClick={() => setPresence(prev => ({ ...prev, [player.id]: !prev[player.id] }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          presence[player.id]
                            ? 'bg-green-900/40 text-green-400 border border-green-800'
                            : 'bg-red-900/40 text-red-400 border border-red-800'
                        }`}
                      >
                        {presence[player.id] ? 'Aanwezig' : 'Afwezig'}
                      </button>
                    </div>
                    {!presence[player.id] && (
                      <input
                        type="text"
                        placeholder="Reden (blessure, ziek…)"
                        value={notes[player.id] ?? ''}
                        onChange={e => setNotes(prev => ({ ...prev, [player.id]: e.target.value }))}
                        className="mt-2 w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[--neon-color]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-800 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: NEON_COLOR }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
                Aanwezigheid Opslaan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceModal;
