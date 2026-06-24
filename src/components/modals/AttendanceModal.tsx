import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CalendarCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
            className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} className="text-emerald-600" />
                <h2 className="font-bold text-gray-900">Aanwezigheid Registreren</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  light
                  label="Datum"
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Type</label>
                  <div className="flex gap-2">
                    {(['training', 'wedstrijd'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSessionType(type)}
                        className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition-all capitalize ${
                          sessionType === type
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-600">Spelers</p>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => setPresence(Object.fromEntries(players.map(p => [p.id, true])))} className="text-emerald-600 font-semibold hover:underline">Allen aanwezig</button>
                    <span className="text-gray-300">·</span>
                    <button onClick={() => setPresence(Object.fromEntries(players.map(p => [p.id, false])))} className="text-red-500 font-semibold hover:underline">Allen afwezig</button>
                  </div>
                </div>
                {players.map(player => (
                  <div key={player.id} className={`rounded-xl border p-3 transition-colors ${presence[player.id] ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-3">
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <span className="flex-1 text-sm font-medium text-gray-900">{player.name}</span>
                      <button
                        onClick={() => setPresence(prev => ({ ...prev, [player.id]: !prev[player.id] }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          presence[player.id]
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-600 border-red-200'
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
                        className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 bg-emerald-600"
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
