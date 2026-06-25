import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';
import { upsertTeamChallenge, deleteTeamChallenge } from '../../lib/teamChallenge';
import type { TeamChallenge } from '../../types';

const EMOJI_OPTIONS = ['🏆', '⚽', '🔥', '💪', '🚀', '⭐', '🎯', '🤝'];

interface TeamChallengeSetterProps {
  teamId: string;
  current: TeamChallenge | null;
  onChange: (c: TeamChallenge | null) => void;
}

const TeamChallengeSetter = ({ teamId, current, onChange }: TeamChallengeSetterProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState(current?.title ?? '');
  const [description, setDescription] = useState(current?.description ?? '');
  const [emoji, setEmoji] = useState(current?.emoji ?? '🏆');
  const [target, setTarget] = useState(current?.target_count ?? 10);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const result = await upsertTeamChallenge(teamId, {
      title: title.trim(),
      description: description.trim(),
      emoji,
      target_count: target,
    });
    setSaving(false);
    if (result) {
      onChange(result);
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteTeamChallenge(teamId);
    setDeleting(false);
    onChange(null);
    setTitle('');
    setDescription('');
    setEmoji('🏆');
    setTarget(10);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header — toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
            <Users size={15} className="text-violet-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-gray-900">Team uitdaging</p>
            <p className="text-xs text-gray-400">
              {current ? `${current.emoji} ${current.title}` : 'Geen actieve uitdaging deze week'}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">

              {/* Emoji picker */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Emoji</p>
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className="w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: emoji === e ? '#ede9fe' : '#f9fafb',
                        border: emoji === e ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titel */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Titel</p>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="bijv. Samen 20 oefeningen deze week"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 transition-colors"
                />
              </div>

              {/* Beschrijving */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Beschrijving <span className="font-normal normal-case text-gray-400">(optioneel)</span></p>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Korte uitleg voor de spelers"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 transition-colors"
                />
              </div>

              {/* Target */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Doel (acties)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={target}
                    onChange={e => setTarget(Number(e.target.value))}
                    className="flex-1 accent-violet-500"
                  />
                  <span className="text-sm font-black text-gray-900 w-8 text-right">{target}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Elke huiswerk- of challenge-voltooiing telt als 1 actie</p>
              </div>

              {/* Knoppen */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: '#8b5cf6' }}
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Opslaan...' : current ? 'Bijwerken' : 'Instellen'}
                </button>
                {current && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamChallengeSetter;
