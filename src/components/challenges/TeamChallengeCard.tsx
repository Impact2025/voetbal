import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { getTeamChallengeProgressWithPlayer } from '../../lib/teamChallenge';
import type { TeamChallenge } from '../../types';

interface TeamChallengeCardProps {
  challenge: TeamChallenge;
  playerId: string;
}

const TeamChallengeCard = ({ challenge, playerId }: TeamChallengeCardProps) => {
  const [progress, setProgress] = useState<{ total: number; mine: number } | null>(null);

  useEffect(() => {
    getTeamChallengeProgressWithPlayer(challenge.team_id, challenge.week_start, playerId)
      .then(setProgress);
  }, [challenge, playerId]);

  const total = progress?.total ?? 0;
  const mine = progress?.mine ?? 0;
  const pct = Math.min(100, Math.round((total / challenge.target_count) * 100));
  const done = total >= challenge.target_count;

  const accentColor = done ? '#4ade80' : '#a78bfa';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border p-4"
      style={{
        background: done
          ? 'linear-gradient(135deg, #052e16 0%, #0f2e1a 100%)'
          : 'linear-gradient(135deg, #0d0f14 0%, #1a1040 100%)',
        borderColor: `${accentColor}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
        >
          {challenge.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Users size={11} style={{ color: accentColor }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
              Team uitdaging
            </span>
          </div>
          <h4 className="text-base font-black text-white leading-snug">{challenge.title}</h4>
          {challenge.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{challenge.description}</p>
          )}
        </div>
      </div>

      {/* Voortgangsbalk */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            <span className="font-black text-white">{total}</span> van {challenge.target_count} acties
          </span>
          <span className="text-xs font-black" style={{ color: accentColor }}>{pct}%</span>
        </div>
        <div className="h-3 bg-gray-800/80 rounded-full overflow-hidden">
          <motion.div
            className="h-3 rounded-full"
            style={{ backgroundColor: accentColor, boxShadow: done ? `0 0 10px ${accentColor}60` : 'none' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
      </div>

      {/* Jouw bijdrage + status */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          Jij deed{' '}
          <span className="font-black text-white">{mine}</span>{' '}
          {mine === 1 ? 'actie' : 'acties'} mee
        </p>
        {done ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-xs font-black px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            Doel behaald! 🎉
          </motion.span>
        ) : (
          <span className="text-[11px] text-gray-600">
            Nog {challenge.target_count - total} te gaan
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TeamChallengeCard;
