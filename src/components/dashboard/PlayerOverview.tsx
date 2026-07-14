import { useMemo, useState, useEffect } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from 'recharts';
import {
  Wand2, Loader2, TrendingUp, TrendingDown, Minus,
  Target, BookOpen, Zap, Shield,
  Crosshair, Brain, MessageSquare, CircleDot, Medal, Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import AvatarArt from '../AvatarArt';
import AvatarBuilder from '../AvatarBuilder';
import UnlockCelebration from '../UnlockCelebration';
import { skillKeys, SKILL_GROUPS, SKILL_LABELS, evaluationPeriods, COACH_COLOR } from '../../utils/constants';
import { callAI } from '../../lib/ai';
import { computeSkillMedal, findBiggestGrowth, SKILL_MEDAL_CONFIG } from '../../lib/skillMedals';
import {
  DEFAULT_AVATAR, unlockedIds, UNLOCKABLES,
  type AvatarConfig, type PlayerStats as AvatarStats, type Unlockable,
} from '../../lib/avatar/catalog';
import type { Player, Team } from '../../types';

interface PlayerOverviewProps {
  player: Player;
  players: Player[];
  teamData: Partial<Team>;
  activeTab: string;
  /** Alleen aanwezig in de speler-zelfweergave ("Ik"): maakt de avatar bewerkbaar. */
  avatarStats?: AvatarStats;
  onAvatarSave?: (config: AvatarConfig) => Promise<void>;
}

const LEVELS = [
  { min: 0,  max: 40,  name: 'Starter',  color: '#6b7280' },
  { min: 40, max: 55,  name: 'Opkomst',  color: '#84cc16' },
  { min: 55, max: 65,  name: 'Speler',   color: '#3b82f6' },
  { min: 65, max: 75,  name: 'Talent',   color: '#a78bfa' },
  { min: 75, max: 85,  name: 'Elite',    color: '#f97316' },
  { min: 85, max: 101, name: 'MVP',      color: '#FFD700' },
];

const SKILL_ICONS: Record<string, string> = {
  rechterbeen: '🦵', linkerbeen: '🦿', aannemen: '🎯', passen: '📤',
  passeerbewegingen: '💫', scoren: '⚽', aanvallend_1v1: '⚡', verdedigend_1v1: '🛡',
  snelheid: '💨', wendbaarheid: '🔄', duelkracht: '💪',
  trainingsmentaliteit: '🔥', wedstrijdmentaliteit: '🏆', leiderschap: '👑',
  concentratie: '🧠', discipline: '📐', aanwezigheid: '✅',
};

// Geeft 1–5 sterren op basis van waarde 1–10
const toStars = (value: number) => {
  const stars = Math.round(value / 2);
  return '⭐'.repeat(Math.max(1, Math.min(5, stars)));
};

const getLevel = (score: number) => LEVELS.find(l => score >= l.min && score < l.max) ?? LEVELS[0];

const CIRCLE_R = 22;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

interface SkillCircleProps {
  skill: string;
  value: number;
  previousValue?: number;
  color?: string;
  isYoung?: boolean;
}

const SkillCircle = ({ skill, value, previousValue, color = COACH_COLOR, isYoung = false }: SkillCircleProps) => {
  const progress = value / 10;
  const offset = CIRCUMFERENCE * (1 - progress);
  const valueColor = value >= 8 ? COACH_COLOR : value >= 6 ? '#111827' : value >= 4 ? '#f97316' : '#f87171';
  const { tier: medalTier, delta } = computeSkillMedal(value, previousValue);
  const medal = medalTier ? SKILL_MEDAL_CONFIG[medalTier] : null;

  if (isYoung) {
    return (
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}
          >
            {SKILL_ICONS[skill]}
          </div>
          {medal && (
            <span
              className="absolute -top-1.5 -right-1.5 text-base leading-none drop-shadow"
              title={medal.youngLabel}
            >
              {medal.emoji}
            </span>
          )}
        </div>
        <div className="text-center">
          <div className="text-[10px] leading-tight" style={{ color }}>
            {toStars(value)}
          </div>
          <span className="text-[9px] font-bold text-gray-400 block leading-tight mt-0.5">
            {SKILL_LABELS[skill]}
          </span>
          {medal && (
            <span className="text-[8px] font-black block leading-tight mt-0.5" style={{ color: medal.color }}>
              {medal.youngLabel}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
    >
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={CIRCLE_R} fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <motion.circle
            cx="28" cy="28" r={CIRCLE_R}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black leading-none" style={{ color: valueColor }}>{value}</span>
        </div>
        {medal && (
          <span
            className="absolute -top-1 -right-1 text-sm leading-none drop-shadow"
            title={`${medal.label} · ${delta! > 0 ? '+' : ''}${delta}`}
          >
            {medal.emoji}
          </span>
        )}
      </div>
      <div className="text-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
          {SKILL_ICONS[skill]} {SKILL_LABELS[skill]}
        </span>
        {medal && (
          <span className="text-[9px] font-black block leading-tight" style={{ color: medal.color }}>
            {delta! > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const PlayerOverview = ({ player, players, teamData, activeTab, avatarStats, onAvatarSave }: PlayerOverviewProps) => {
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [celebration, setCelebration] = useState<Unlockable[]>([]);

  const editable = Boolean(avatarStats && onAvatarSave);
  const unlockedKey = avatarStats ? unlockedIds(avatarStats).join(',') : '';

  // Detecteer nieuw ontgrendelde onderdelen en vier ze één keer.
  useEffect(() => {
    if (!avatarStats || !onAvatarSave) return;
    const storageKey = `avatarUnlocks_${player.id}`;
    const current = unlockedIds(avatarStats);
    const raw = localStorage.getItem(storageKey);
    if (raw === null) { localStorage.setItem(storageKey, JSON.stringify(current)); return; }
    let seen: string[] = [];
    try { seen = JSON.parse(raw) as string[]; } catch { seen = []; }
    const fresh = current.filter(id => !seen.includes(id));
    localStorage.setItem(storageKey, JSON.stringify(current));
    if (fresh.length) setCelebration(UNLOCKABLES.filter(u => fresh.includes(u.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedKey, player.id]);

  const ageNum = parseInt(player.age ?? '10', 10);
  const isYoung = !isNaN(ageNum) && ageNum <= 9;

  const assignedIds = useMemo(
    () => teamData.assigned_homework_ids ?? [],
    [teamData.assigned_homework_ids],
  );
  const currentEval = player.evaluations?.[activeTab];

  const previousEval = useMemo(() => {
    const idx = evaluationPeriods.indexOf(activeTab);
    return idx > 0 ? player.evaluations?.[evaluationPeriods[idx - 1]] : undefined;
  }, [player.evaluations, activeTab]);

  const biggestGrowth = useMemo(
    () => findBiggestGrowth(skillKeys, currentEval?.skills ?? {}, previousEval?.skills),
    [currentEval, previousEval]
  );

  const score = useMemo(() => {
    if (!currentEval) return 50;
    return Math.round(skillKeys.reduce((s, k) => s + (currentEval.skills[k] ?? 5), 0) / skillKeys.length * 10);
  }, [currentEval]);

  const level = getLevel(score);
  const levelProgress = Math.round(((score - level.min) / ((level.max === 101 ? 100 : level.max) - level.min)) * 100);

  const sortedSkills = useMemo(() => skillKeys
    .map(k => ({ key: k, value: currentEval?.skills[k] ?? 5 }))
    .sort((a, b) => b.value - a.value), [currentEval]);

  const strengths = sortedSkills.slice(0, 2);
  const improvements = sortedSkills.slice(-2).reverse();

  const teamSkillAvgs = useMemo(() => Object.fromEntries(
    skillKeys.map(k => [
      k,
      players.length
        ? players.reduce((s, p) => s + (p.evaluations?.[activeTab]?.skills[k] ?? 5), 0) / players.length
        : 5,
    ])
  ), [players, activeTab]);

  const radarData = SKILL_GROUPS.map(group => {
    const myAvg = group.skills.reduce((sum, s) => sum + (currentEval?.skills[s.key] ?? 5), 0) / group.skills.length;
    const teamAvg = group.skills.reduce((sum, s) => sum + (teamSkillAvgs[s.key] ?? 5), 0) / group.skills.length;
    return {
      subject: group.label,
      jij: parseFloat(myAvg.toFixed(1)),
      team: parseFloat(teamAvg.toFixed(1)),
      fullMark: 10,
    };
  });

  const hwDone = assignedIds.filter(id => player.completed_homework_ids?.includes(id)).length;
  const hwPct = assignedIds.length > 0 ? Math.round((hwDone / assignedIds.length) * 100) : null;

  const badges: { icon: React.ReactNode; label: string; earned: boolean }[] = useMemo(() => [
    { icon: <BookOpen size={14} />,    label: 'Huiswerk\nHeld',    earned: assignedIds.length > 0 && hwDone === assignedIds.length },
    { icon: <Medal size={14} />,       label: 'Groei-\nKnokker',   earned: improvements.every(s => s.value >= 5) },
    { icon: <CircleDot size={14} />,   label: 'All-\nRounder',     earned: sortedSkills.every(s => s.value >= 6) },
    { icon: <Zap size={14} />,         label: 'Techniek\nSter',    earned: (currentEval?.skills.scoren ?? 0) >= 8 || (currentEval?.skills.passen ?? 0) >= 8 },
    { icon: <Shield size={14} />,      label: 'Rots\nAchterin',    earned: (currentEval?.skills.verdedigend_1v1 ?? 0) >= 8 },
    { icon: <Crosshair size={14} />,   label: 'Scherp-\nschutter', earned: (currentEval?.skills.scoren ?? 0) >= 8 },
    { icon: <Brain size={14} />,       label: 'Leider',            earned: (currentEval?.skills.leiderschap ?? 0) >= 8 },
    { icon: <MessageSquare size={14} />,label: 'Open\nGeest',      earned: (player.weekly_question_responses ?? []).some(r => r.trim().length > 0) },
  ], [sortedSkills, improvements, currentEval, assignedIds, hwDone, player]);

  const skillProgress = skillKeys.map(k => ({
    key: k,
    label: SKILL_LABELS[k],
    values: evaluationPeriods.map(p => player.evaluations?.[p]?.skills[k] ?? 5),
  }));

  const handleAIInsight = async () => {
    if (!currentEval) return;
    setLoadingAI(true);
    const topSkills = strengths.map(s => SKILL_LABELS[s.key]).join(' en ');
    const weakSkills = improvements.map(s => SKILL_LABELS[s.key]).join(' en ');
    const prompt = `Geef een korte, persoonlijke en motiverende analyse in het Nederlands voor een jonge voetballer (7-12 jaar). Naam: ${player.name}. Niveau: ${level.name} (score ${score}/100). Sterkste skills: ${topSkills}. Verbeterpunten: ${weakSkills}. Wedstrijdcijfer: ${currentEval.matchRating}/10. Geef: 1) Een compliment over de sterke punten. 2) Één concrete tip voor verbetering. 3) Een motiverende afsluitzin. Houd het onder de 60 woorden, informeel en enthousiast.`;
    const result = await callAI(prompt);
    setAiInsight(result);
    setLoadingAI(false);
  };

  return (
    <div className="space-y-3 pb-2">

      {/* ── HERO CARD ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div
          className="relative rounded-2xl overflow-hidden border"
          style={{ borderColor: `${level.color}40` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #ffffff 0%, ${level.color}10 60%, ${level.color}22 100%)`,
            }}
          />
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: level.color }}
          />

          <div className="relative p-4">
            <div className="flex items-start gap-4">
              {/* Avatar with ring — tappable "Bouw je baller" in de zelfweergave */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => editable && setBuilderOpen(true)}
                  disabled={!editable}
                  className={editable ? 'block active:scale-95 transition-transform' : 'block cursor-default'}
                  aria-label={editable ? 'Bouw je baller' : undefined}
                >
                  <div
                    className="w-20 h-20 rounded-full p-0.5"
                    style={{ background: `conic-gradient(${level.color} ${levelProgress}%, #e5e7eb ${levelProgress}%)` }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-100">
                      {player.avatar_config ? (
                        <AvatarArt config={player.avatar_config} className="w-full h-full" />
                      ) : player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-400">
                          {player.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                      )}
                    </div>
                  </div>
                  {editable && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow"
                      style={{ backgroundColor: COACH_COLOR }}
                    >
                      <Pencil size={11} className="text-white" strokeWidth={2.5} />
                    </span>
                  )}
                </button>
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none"
                  style={{ backgroundColor: level.color, color: '#000' }}
                >
                  {level.name}
                </div>
              </div>

              {/* Name + info */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-2xl font-black leading-tight truncate text-gray-900">{player.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {player.position || 'Positie niet ingesteld'}
                  {player.age ? ` · ${player.age} jaar` : ''}
                </p>

                {isYoung ? (
                  /* Children: grote level-badge, geen cijfer */
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="text-2xl font-black"
                      style={{ color: level.color }}
                    >
                      {level.name}
                    </span>
                    <span className="text-lg">
                      {level.name === 'Starter' ? '🌱' : level.name === 'Opkomst' ? '🌿' : level.name === 'Speler' ? '⚽' : level.name === 'Talent' ? '🌟' : level.name === 'Elite' ? '🔥' : '👑'}
                    </span>
                  </div>
                ) : (
                  /* Tweens: voortgangsbalk + % */
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: level.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">{levelProgress}%</span>
                  </div>
                )}
              </div>

              {/* Score — alleen voor Tweens */}
              {!isYoung && (
                <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
                  <div className="text-center">
                    <div className="text-4xl font-black leading-none" style={{ color: level.color }}>
                      {score}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-0.5">score</div>
                  </div>
                </div>
              )}
            </div>

            {/* Match rating strip */}
            {currentEval?.matchRating > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Wedstrijdcijfer</span>
                {isYoung ? (
                  <span className="text-base font-black" style={{ color: currentEval.matchRating >= 7 ? COACH_COLOR : currentEval.matchRating >= 5 ? '#f97316' : '#f87171' }}>
                    {'⭐'.repeat(Math.round(currentEval.matchRating / 2))}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="w-4 h-1.5 rounded-full transition-all"
                        style={{
                          backgroundColor: i < currentEval.matchRating
                            ? (currentEval.matchRating >= 7 ? COACH_COLOR : currentEval.matchRating >= 5 ? '#f97316' : '#f87171')
                            : '#e5e7eb',
                        }}
                      />
                    ))}
                    <span className="text-sm font-black ml-1" style={{ color: currentEval.matchRating >= 7 ? COACH_COLOR : currentEval.matchRating >= 5 ? '#f97316' : '#f87171' }}>
                      {currentEval.matchRating}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── SKILL WEERGAVE ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <Card className="!p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
            {isYoung ? 'Jouw skills ⚽' : <>Skills — <span className="font-normal normal-case text-gray-600">{activeTab}</span></>}
          </p>

          {biggestGrowth && (
            <div
              className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: `${SKILL_MEDAL_CONFIG[biggestGrowth.tier].color}15`, border: `1px solid ${SKILL_MEDAL_CONFIG[biggestGrowth.tier].color}50` }}
            >
              <span className="text-lg leading-none">{SKILL_MEDAL_CONFIG[biggestGrowth.tier].emoji}</span>
              <span className="text-xs font-bold text-gray-700">
                {isYoung
                  ? `Je groeide het meest in ${SKILL_LABELS[biggestGrowth.key]}!`
                  : <>Grootste groei: <b>{SKILL_LABELS[biggestGrowth.key]}</b> ({biggestGrowth.delta > 0 ? '+' : ''}{biggestGrowth.delta})</>
                }
              </span>
            </div>
          )}

          <div className="space-y-5">
            {SKILL_GROUPS.map(group => {
              const groupAvg = group.skills.reduce((sum, s) => sum + (currentEval?.skills[s.key] ?? 5), 0) / group.skills.length;
              return (
                <div key={group.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: group.color }}>{group.label}</span>
                    <span className="text-xs font-black tabular-nums" style={{ color: group.color }}>{groupAvg.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-y-3 gap-x-2">
                    {group.skills.map(s => (
                      <SkillCircle
                        key={s.key}
                        skill={s.key}
                        value={currentEval?.skills[s.key] ?? 5}
                        previousValue={previousEval?.skills[s.key]}
                        color={group.color}
                        isYoung={isYoung}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* ── STERK IN / WERK AAN ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={12} className="text-emerald-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Sterk In</span>
          </div>
          <div className="space-y-3">
            {strengths.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{SKILL_LABELS[s.key]}</span>
                  {isYoung
                    ? <span className="font-black text-emerald-600 text-xs">{toStars(s.value)}</span>
                    : <span className="font-black text-emerald-600">{s.value}</span>
                  }
                </div>
                <div className="bg-gray-100 rounded-full h-1">
                  <motion.div
                    className="h-1 rounded-full bg-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value * 10}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4 border border-orange-200 bg-orange-50">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={12} className="text-orange-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">Werk Aan</span>
          </div>
          <div className="space-y-3">
            {improvements.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{SKILL_LABELS[s.key]}</span>
                  {isYoung
                    ? <span className="font-black text-orange-600 text-xs">{toStars(s.value)}</span>
                    : <span className="font-black text-orange-600">{s.value}</span>
                  }
                </div>
                <div className="bg-gray-100 rounded-full h-1">
                  <motion.div
                    className="h-1 rounded-full bg-orange-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value * 10}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── HUISWERK PROGRESS ── */}
      {hwPct !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
          <Card className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Huiswerk</span>
              </div>
              <span className="text-xs font-black" style={{ color: hwPct === 100 ? '#16a34a' : COACH_COLOR }}>{hwDone}/{assignedIds.length} klaar</span>
            </div>
            <div className="mt-2.5 bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-2 rounded-full"
                style={{ backgroundColor: hwPct === 100 ? '#16a34a' : COACH_COLOR }}
                initial={{ width: 0 }}
                animate={{ width: `${hwPct}%` }}
                transition={{ duration: 0.7, delay: 0.1 }}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── BADGES ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <Card className="!p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
            {isYoung ? 'Jouw badges 🏅' : 'Badges'}
          </p>
          <div className={`grid gap-2 ${isYoung ? 'grid-cols-4' : 'grid-cols-4'}`}>
            {badges.map(b => (
              <motion.div
                key={b.label}
                whileTap={{ scale: 0.92 }}
                className={`flex flex-col items-center gap-1 rounded-xl text-center transition-all ${
                  b.earned
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-gray-50 border border-gray-200 opacity-40'
                }`}
                style={{ padding: isYoung ? '10px 6px' : '8px 6px' }}
              >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: isYoung ? 32 : 28,
                    height: isYoung ? 32 : 28,
                    backgroundColor: b.earned ? `${COACH_COLOR}15` : 'transparent',
                  }}
                >
                  <span style={{ color: b.earned ? COACH_COLOR : '#9ca3af' }}>{b.icon}</span>
                </div>
                <span
                  className="leading-tight text-gray-500 whitespace-pre-line font-medium"
                  style={{ fontSize: isYoung ? 9 : 8 }}
                >
                  {b.label}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── AI COACH ANALYSE — alleen voor Tweens ── */}
      {!isYoung && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
          <Card className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COACH_COLOR}20` }}>
                  <Wand2 size={11} style={{ color: COACH_COLOR }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Coach AI Analyse</p>
              </div>
              <button
                onClick={handleAIInsight}
                disabled={loadingAI}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90 active:scale-95"
                style={{ backgroundColor: COACH_COLOR }}
              >
                {loadingAI ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                {loadingAI ? 'Laden...' : 'Genereer'}
              </button>
            </div>
            <AnimatePresence mode="wait">
              {aiInsight ? (
                <motion.p key="insight" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-gray-700 leading-relaxed">
                  {aiInsight}
                </motion.p>
              ) : (
                <motion.p key="placeholder" className="text-xs text-gray-500 italic">
                  Druk op Genereer voor een persoonlijke analyse.
                </motion.p>
              )}
            </AnimatePresence>
            {currentEval?.trainingPlan && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Persoonlijk Oefenplan</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{currentEval.trainingPlan}</p>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ── JOUW SKILL-PROFIEL (radar) ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
        <Card className="!p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
            {isYoung
              ? 'Jouw skill-profiel 🕸'
              : <>Jouw Skill-profiel <span className="font-normal normal-case text-gray-600">— {activeTab}</span></>
            }
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#6b7280', fontSize: isYoung ? 11 : 10 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name="Jij" dataKey="jij" stroke={level.color} fill={level.color} fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* ── VOORTGANG PER PERIODE — alleen voor Tweens ── */}
      {!isYoung && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
          <Card className="!p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Voortgang per Periode</p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[240px]">
                <thead>
                  <tr className="text-gray-500 text-[9px] uppercase tracking-wide border-b border-gray-200">
                    <th className="text-left pb-2 font-semibold pl-1">Skill</th>
                    {evaluationPeriods.map(p => (
                      <th key={p} className="text-center pb-2 font-semibold">{p.replace('Check-in ', 'CI')}</th>
                    ))}
                    <th className="text-center pb-2">+/-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {skillProgress.map(({ key, label, values }) => {
                    const delta = values[values.length - 1] - values[0];
                    const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                    const trendColor = delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#9ca3af';
                    return (
                      <tr key={key}>
                        <td className="py-2 text-gray-500 text-[11px] pl-1">{label}</td>
                        {values.map((v, i) => (
                          <td key={i} className="py-2 text-center font-black text-sm" style={{
                            color: v >= 7 ? COACH_COLOR : v >= 5 ? '#4b5563' : '#dc2626',
                          }}>{v}</td>
                        ))}
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <TrendIcon size={11} style={{ color: trendColor }} />
                            {delta !== 0 && <span className="text-[10px] font-black" style={{ color: trendColor }}>{delta > 0 ? `+${delta}` : delta}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Avatar builder + unlock-celebratie (alleen zelfweergave) ── */}
      {editable && avatarStats && onAvatarSave && (
        <AvatarBuilder
          isOpen={builderOpen}
          onClose={() => setBuilderOpen(false)}
          initial={player.avatar_config ?? DEFAULT_AVATAR}
          name={player.name}
          stats={avatarStats}
          onSave={onAvatarSave}
        />
      )}
      {celebration.length > 0 && (
        <UnlockCelebration
          items={celebration}
          baseConfig={player.avatar_config ?? DEFAULT_AVATAR}
          onClose={() => setCelebration([])}
          onOpenBuilder={() => setBuilderOpen(true)}
        />
      )}

    </div>
  );
};

export default PlayerOverview;
