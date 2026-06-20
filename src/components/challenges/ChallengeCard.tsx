import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, Wand2 } from 'lucide-react';
import { CATEGORY_META } from '../../data/challenges';
import { getChallengeAIFeedback } from '../../lib/ai';
import type { Challenge, ChallengeCompletion, Player } from '../../types';

interface ChallengeCardProps {
  challenge: Challenge;
  player: Player;
  completion: ChallengeCompletion | undefined;
  onComplete: (challengeId: string, reflection: string) => Promise<string | null>;
}

const ChallengeCard = ({ challenge, player, completion, onComplete }: ChallengeCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [reflection, setReflection] = useState('');
  const [aiFeedback, setAIFeedback] = useState(completion?.ai_feedback ?? '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(!!completion);

  const meta = CATEGORY_META[challenge.category];
  const playerAge = parseInt(player.age ?? '10', 10);
  const ageOk = playerAge >= challenge.age_min && playerAge <= challenge.age_max;
  if (!ageOk) return null;

  const handleComplete = async () => {
    if (completing || done) return;
    setCompleting(true);

    // Get AI feedback if there's a reflection
    let feedback = '';
    if (reflection.trim() && challenge.reflection_prompt) {
      setLoadingAI(true);
      feedback = await getChallengeAIFeedback({
        challengeTitle: challenge.title,
        reflection: reflection.trim(),
        playerName: player.name,
        playerAge: player.age ?? '10',
        hint: challenge.ai_feedback_hint,
      });
      setAIFeedback(feedback);
      setLoadingAI(false);
    }

    await onComplete(challenge.id, reflection.trim());
    setDone(true);
    setCompleting(false);
  };

  return (
    <motion.div
      layout
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: done ? `${meta.color}40` : 'rgba(255,255,255,0.06)',
        background: done ? meta.bg : '#0d0f14',
      }}
    >
      {/* Header row — always visible */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Category badge */}
        <div
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base"
          style={{ backgroundColor: `${meta.color}18` }}
        >
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white leading-tight">{challenge.title}</span>
            {done && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 size={14} style={{ color: meta.color }} />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-[9px] text-gray-600">{challenge.age_min}–{challenge.age_max} jaar</span>
          </div>
        </div>

        <span className="shrink-0 text-gray-600">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">

              {/* Setup */}
              <div className="pt-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Setup</p>
                <p className="text-sm text-gray-300 leading-relaxed">{challenge.setup}</p>
              </div>

              {/* Win condition */}
              <div
                className="rounded-xl p-3 border"
                style={{ backgroundColor: `${meta.color}0a`, borderColor: `${meta.color}25` }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: `${meta.color}90` }}>
                  Win-conditie
                </p>
                <p className="text-sm font-semibold text-white leading-relaxed">{challenge.win_condition}</p>
              </div>

              {/* Reflection + completion */}
              {!done ? (
                <div className="space-y-3">
                  {challenge.reflection_prompt && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1.5">
                        Reflectie <span className="font-normal normal-case text-gray-700">(optioneel)</span>
                      </p>
                      <p className="text-xs text-gray-400 mb-2 italic">"{challenge.reflection_prompt}"</p>
                      <textarea
                        value={reflection}
                        onChange={e => setReflection(e.target.value)}
                        placeholder="Schrijf hier je antwoord..."
                        rows={2}
                        className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500 transition-colors"
                      />
                    </div>
                  )}

                  <motion.button
                    onClick={handleComplete}
                    disabled={completing}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-3 rounded-xl text-sm font-black text-black flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: meta.color }}
                  >
                    {completing ? (
                      <><Loader2 size={14} className="animate-spin" /> Verwerken...</>
                    ) : (
                      <><CheckCircle2 size={14} /> Gedaan! 🎉</>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {reflection && (
                    <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Jouw reflectie</p>
                      <p className="text-sm text-gray-300 italic">"{reflection || completion?.reflection}"</p>
                    </div>
                  )}

                  {/* AI feedback */}
                  {loadingAI ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 size={12} className="animate-spin" /> AI feedback laden...
                    </div>
                  ) : aiFeedback ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-3 border"
                      style={{ backgroundColor: `${meta.color}08`, borderColor: `${meta.color}20` }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wand2 size={11} style={{ color: meta.color }} />
                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${meta.color}80` }}>
                          Coach AI
                        </p>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{aiFeedback}</p>
                    </motion.div>
                  ) : null}

                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: meta.color }}>
                    <CheckCircle2 size={13} />
                    Uitdaging voltooid — XP toegevoegd aan jouw kaart!
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChallengeCard;
