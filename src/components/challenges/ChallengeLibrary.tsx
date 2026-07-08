import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import ChallengeCard from './ChallengeCard';
import { CHALLENGES, CATEGORY_META } from '../../data/challenges';
import type { ChallengeCategory, ChallengeCompletion, Player } from '../../types';

const CATEGORIES: Array<{ id: ChallengeCategory | 'all'; label: string; emoji: string }> = [
  { id: 'all',        label: 'Alles',       emoji: '🌟' },
  { id: 'techniek',   label: 'Techniek',    emoji: '🎯' },
  { id: 'snelheid',   label: 'Snelheid',    emoji: '⚡' },
  { id: 'inzicht',    label: 'Inzicht',     emoji: '🧠' },
  { id: 'mentaliteit',label: 'Mentaliteit', emoji: '💚' },
];

interface ChallengeLibraryProps {
  player: Player;
  completions: ChallengeCompletion[];
  onComplete: (challengeId: string, reflection: string) => Promise<string | null>;
}

const ChallengeLibrary = ({ player, completions, onComplete }: ChallengeLibraryProps) => {
  const [activeCategory, setActiveCategory] = useState<ChallengeCategory | 'all'>('all');

  const playerAge = parseInt(player.age ?? '10', 10);
  const visibleChallenges = CHALLENGES.filter(c => {
    const ageOk = playerAge >= c.age_min && playerAge <= c.age_max;
    const catOk = activeCategory === 'all' || c.category === activeCategory;
    return ageOk && catOk;
  });

  const completedCount = CHALLENGES.filter(c =>
    completions.some(comp => comp.challenge_id === c.id)
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Swords size={14} className="text-yellow-500" />
          </div>
          <h3 className="text-base font-black text-gray-900">Uitdagingen</h3>
        </div>
        {completedCount > 0 && (
          <div className="text-[10px] font-bold text-gray-500">
            {completedCount}/{CHALLENGES.filter(c => playerAge >= c.age_min && playerAge <= c.age_max).length} gedaan
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {CATEGORIES.map(({ id, label, emoji }) => {
          const isActive = activeCategory === id;
          const color = id === 'all' ? '#e5e7eb' : CATEGORY_META[id as ChallengeCategory].color;
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveCategory(id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={isActive
                ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }
                : { backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb' }
              }
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Challenge cards */}
      <div className="space-y-2">
        {visibleChallenges.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-6">
            Geen uitdagingen gevonden voor deze leeftijd en categorie.
          </p>
        ) : (
          visibleChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              player={player}
              completion={completions.find(c => c.challenge_id === challenge.id)}
              onComplete={onComplete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChallengeLibrary;
