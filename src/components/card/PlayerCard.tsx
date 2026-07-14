import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Zap, Eye, Users } from 'lucide-react';
import { detectAgeGroup } from '../../lib/trainingAI';
import { TIER_CONFIG, tierProgress, nextTierXP } from '../../lib/cardTier';
import Avatar from '../Avatar';
import type { Player, PlayerStats, StatAxis } from '../../types';

interface PlayerCardProps {
  player: Player;
  stats: PlayerStats | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const AXIS_META: Record<StatAxis, { label: string; icon: React.ReactNode; color: string }> = {
  consistentie: { label: 'Consistentie', icon: <Flame size={13} />,  color: '#f97316' },
  werkethiek:   { label: 'Werkethiek',   icon: <Zap size={13} />,    color: '#facc15' },
  techniek:     { label: 'Techniek',     icon: <Star size={13} />,   color: '#38bdf8' },
  focus:        { label: 'Focus',        icon: <Eye size={13} />,    color: '#a78bfa' },
  team_spirit:  { label: 'Team Spirit',  icon: <Users size={13} />,  color: '#4ade80' },
};

const AXIS_ORDER: StatAxis[] = ['consistentie', 'werkethiek', 'techniek', 'focus', 'team_spirit'];

function softLabel(value: number): { text: string; emoji: string } {
  if (value >= 67) return { text: 'Sterk',      emoji: '⭐' };
  if (value >= 34) return { text: 'Stevig',     emoji: '💪' };
  return               { text: 'In Opbouw',  emoji: '🌱' };
}

const POSITION_ROLES: { match: string[]; role: string; emoji: string }[] = [
  { match: ['keeper', 'doelman'],                            role: 'Keeper',          emoji: '🧤' },
  { match: ['verdediger', 'centrale verdediger', 'back'],    role: 'Rots Achterin',   emoji: '🛡' },
  { match: ['middenvelder', 'vleugelspeler', 'spelmaker'],   role: 'Spelmaker',       emoji: '🎯' },
  { match: ['aanvaller', 'spits', 'winger'],                 role: 'Doelpuntenmaker', emoji: '⚡' },
];

function getRoleLabel(position: string): { role: string; emoji: string } {
  const lower = (position ?? '').toLowerCase();
  for (const { match, role, emoji } of POSITION_ROLES) {
    if (match.some(m => lower.includes(m))) return { role, emoji };
  }
  return { role: 'Allrounder', emoji: '🌟' };
}

// ── Component ─────────────────────────────────────────────────────────────────

const PlayerCard = ({ player, stats }: PlayerCardProps) => {
  const ageGroup = detectAgeGroup(player.age ?? '10');
  const isNumericMode = ageGroup === 'U12' || ageGroup === 'U14' || ageGroup === 'U16';

  const tier       = stats?.tier ?? 'brons';
  const totalXP    = stats?.total_xp ?? 0;
  const tierCfg    = TIER_CONFIG[tier];
  const progress   = tierProgress(totalXP, tier);
  const nextXP     = nextTierXP(tier);
  const { role, emoji: roleEmoji } = useMemo(() => getRoleLabel(player.position ?? ''), [player.position]);

  const axes = useMemo(() => AXIS_ORDER.map(axis => ({
    axis,
    value: stats?.[axis] ?? 0,
    ...AXIS_META[axis],
  })), [stats]);

  // Trend delta vs prev_snapshot (only in numeric mode)
  const hasTrend = isNumericMode && stats?.prev_snapshot != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, type: 'spring', stiffness: 200 }}
      className="space-y-3 pb-4"
    >

      {/* ── Identity Card ── */}
      <div
        className="relative rounded-3xl overflow-hidden border"
        style={{
          borderColor: `${tierCfg.color}50`,
          background: `linear-gradient(145deg, ${tierCfg.bgFrom} 0%, ${tierCfg.bgTo} 100%)`,
          boxShadow: `0 0 40px ${tierCfg.glow}, inset 0 1px 0 ${tierCfg.color}20`,
        }}
      >
        {/* Tier shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 70% 20%, ${tierCfg.color}12 0%, transparent 65%)`,
          }}
        />

        <div className="relative p-5">
          {/* Top row: tier badge + role */}
          <div className="flex items-center justify-between mb-4">
            <div
              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ backgroundColor: `${tierCfg.color}20`, color: tierCfg.color, border: `1px solid ${tierCfg.color}40` }}
            >
              {tierCfg.label}
            </div>
            <div className="text-right">
              <span className="text-xs font-bold" style={{ color: `${tierCfg.color}cc` }}>
                {roleEmoji} {role}
              </span>
            </div>
          </div>

          {/* Avatar + name row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl p-0.5"
                style={{ background: `linear-gradient(135deg, ${tierCfg.color}, ${tierCfg.color}60)` }}
              >
                <Avatar
                  config={player.avatar_config}
                  avatarUrl={player.avatar_url}
                  name={player.name}
                  size={76}
                  className="w-full h-full rounded-2xl"
                />
              </div>
              {/* XP badge */}
              <div
                className="absolute -bottom-1.5 -right-1.5 text-[9px] font-black px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: tierCfg.bgFrom, color: tierCfg.color, borderColor: `${tierCfg.color}50` }}
              >
                {totalXP} XP
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black leading-tight text-white truncate">{player.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {player.position || 'Positie'}
                {player.age ? ` · ${player.age} jaar` : ''}
              </p>

              {/* XP progress to next tier */}
              {tier !== 'legendary' && (
                <div className="mt-3">
                  <div className="flex justify-between text-[9px] font-semibold mb-1" style={{ color: `${tierCfg.color}80` }}>
                    <span>{TIER_CONFIG[tier].label}</span>
                    <span>{totalXP} / {nextXP} XP</span>
                  </div>
                  <div className="bg-black/40 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: tierCfg.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
              {tier === 'legendary' && (
                <div className="mt-3 text-[10px] font-black" style={{ color: tierCfg.color }}>
                  ✦ MAX TIER BEREIKT
                </div>
              )}
            </div>
          </div>

          {/* ── Inzet-DNA ── */}
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-widest mb-3"
              style={{ color: `${tierCfg.color}80` }}
            >
              Inzet-DNA
            </p>

            <div className="space-y-2.5">
              {axes.map(({ axis, value, label, icon, color }, i) => {
                const soft = softLabel(value);
                const delta = hasTrend ? value - (stats!.prev_snapshot![axis] ?? 0) : null;

                return (
                  <motion.div
                    key={axis}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                    className="flex items-center gap-2.5"
                  >
                    {/* Icon */}
                    <div
                      className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {icon}
                    </div>

                    {/* Label */}
                    <span className="text-[11px] text-gray-400 w-[78px] shrink-0 leading-none">{label}</span>

                    {/* Bar */}
                    <div className="flex-1 bg-black/40 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: 'easeOut' }}
                      />
                    </div>

                    {/* Value / soft label */}
                    {isNumericMode ? (
                      <div className="flex items-center gap-1 shrink-0 min-w-[42px] justify-end">
                        <span className="text-xs font-black" style={{ color }}>{value}</span>
                        {delta !== null && delta !== 0 && (
                          <span
                            className="text-[9px] font-bold"
                            style={{ color: delta > 0 ? '#4ade80' : '#f87171' }}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="shrink-0 min-w-[58px] text-right">
                        <span className="text-[10px] font-bold text-gray-300">
                          {soft.emoji} {soft.text}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Geen data staat ── */}
      {totalXP === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center"
        >
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-sm font-bold text-gray-300 mb-1">Bouw je Inzet-DNA op!</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Verdien XP door huiswerk te doen en video's in te sturen.<br />
            Elke actie telt mee voor jouw unieke kaart.
          </p>
        </motion.div>
      )}

      {/* ── Legenda (alleen voor 7-9 jaar) ── */}
      {!isNumericMode && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-3">Wat betekenen de levels?</p>
          <div className="space-y-2">
            {[
              { emoji: '🌱', label: 'In Opbouw', desc: 'Je bent net begonnen — elke stap telt!' },
              { emoji: '💪', label: 'Stevig',     desc: 'Je laat het zien op de training.' },
              { emoji: '⭐', label: 'Sterk',      desc: 'Jij bent een voorbeeld voor anderen.' },
            ].map(({ emoji, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5">{emoji}</span>
                <div>
                  <span className="text-xs font-bold text-gray-300">{label}</span>
                  <span className="text-[10px] text-gray-600 ml-1.5">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default PlayerCard;
