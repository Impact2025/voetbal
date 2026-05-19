import { useMemo, useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Wand2, Loader2, TrendingUp, TrendingDown, Minus,
  Target, Trophy, BookOpen, Zap, Shield,
  Crosshair, Brain, MessageSquare, CircleDot, Medal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import { skillKeys, evaluationPeriods, NEON_COLOR } from '../../utils/constants';
import { callAI } from '../../lib/ai';
import type { Player, Team } from '../../types';

interface PlayerOverviewProps {
  player: Player;
  players: Player[];
  teamData: Partial<Team>;
  activeTab: string;
}

const LEVELS = [
  { min: 0,  max: 40,  name: 'Starter',  color: '#6b7280' },
  { min: 40, max: 55,  name: 'Opkomst',  color: '#84cc16' },
  { min: 55, max: 65,  name: 'Speler',   color: '#3b82f6' },
  { min: 65, max: 75,  name: 'Talent',   color: '#a78bfa' },
  { min: 75, max: 85,  name: 'Elite',    color: '#f97316' },
  { min: 85, max: 101, name: 'MVP',      color: '#FFD700' },
];

const SKILL_LABELS: Record<string, string> = {
  snelheid: 'Snelheid', passing: 'Passing', techniek: 'Techniek',
  schot: 'Schot', verdedigen: 'Verdedigen', inzicht: 'Inzicht', mentaliteit: 'Mentaliteit',
};

const SKILL_ICONS: Record<string, string> = {
  snelheid: '⚡', passing: '🎯', techniek: '🔥',
  schot: '💥', verdedigen: '🛡', inzicht: '🧠', mentaliteit: '💪',
};

const getLevel = (score: number) => LEVELS.find(l => score >= l.min && score < l.max) ?? LEVELS[0];

const CIRCLE_R = 22;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

interface SkillCircleProps {
  skill: string;
  value: number;
  color?: string;
}

const SkillCircle = ({ skill, value, color = NEON_COLOR }: SkillCircleProps) => {
  const progress = value / 10;
  const offset = CIRCUMFERENCE * (1 - progress);
  const valueColor = value >= 8 ? NEON_COLOR : value >= 6 ? '#fff' : value >= 4 ? '#f97316' : '#f87171';

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
    >
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={CIRCLE_R} fill="none" stroke="#1f2937" strokeWidth="4" />
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
      </div>
      <div className="text-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
          {SKILL_ICONS[skill]} {SKILL_LABELS[skill]}
        </span>
      </div>
    </motion.div>
  );
};

const PlayerOverview = ({ player, players, teamData, activeTab }: PlayerOverviewProps) => {
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const assignedIds = teamData.assigned_homework_ids ?? [];
  const currentEval = player.evaluations?.[activeTab];

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

  const radarData = skillKeys.map(k => ({
    subject: SKILL_LABELS[k],
    jij: currentEval?.skills[k] ?? 5,
    team: parseFloat((teamSkillAvgs[k] ?? 5).toFixed(1)),
    fullMark: 10,
  }));

  const hwDone = assignedIds.filter(id => player.completed_homework_ids?.includes(id)).length;
  const hwPct = assignedIds.length > 0 ? Math.round((hwDone / assignedIds.length) * 100) : null;

  const ranking = useMemo(() => players
    .map(p => ({
      id: p.id, name: p.name, avatar: p.avatar_url,
      score: Math.round(skillKeys.reduce((s, k) => s + (p.evaluations?.[activeTab]?.skills[k] ?? 5), 0) / skillKeys.length * 10),
    }))
    .sort((a, b) => b.score - a.score), [players, activeTab]);
  const myRank = ranking.findIndex(p => p.id === player.id) + 1;

  const badges: { icon: React.ReactNode; label: string; earned: boolean }[] = useMemo(() => [
    { icon: <BookOpen size={14} />,    label: 'Huiswerk\nHeld',    earned: assignedIds.length > 0 && hwDone === assignedIds.length },
    { icon: <Trophy size={14} />,      label: 'Top 3',             earned: myRank > 0 && myRank <= 3 },
    { icon: <CircleDot size={14} />,   label: 'All-\nRounder',     earned: sortedSkills.every(s => s.value >= 6) },
    { icon: <Zap size={14} />,         label: 'Techniek\nSter',    earned: (currentEval?.skills.techniek ?? 0) >= 8 },
    { icon: <Shield size={14} />,      label: 'Rots\nAchterin',    earned: (currentEval?.skills.verdedigen ?? 0) >= 8 },
    { icon: <Crosshair size={14} />,   label: 'Scherp-\nschutter', earned: (currentEval?.skills.schot ?? 0) >= 8 },
    { icon: <Brain size={14} />,       label: 'Spel-\nbrein',      earned: (currentEval?.skills.inzicht ?? 0) >= 8 },
    { icon: <MessageSquare size={14} />,label: 'Open\nGeest',      earned: (player.weekly_question_responses ?? []).some(r => r.trim().length > 0) },
  ], [sortedSkills, currentEval, assignedIds, hwDone, myRank, player]);

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

  const rankMedalColor = myRank === 1 ? '#FFD700' : myRank === 2 ? '#C0C0C0' : myRank === 3 ? '#CD7F32' : '#4b5563';

  return (
    <div className="space-y-3 pb-2">

      {/* ── HERO CARD ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div
          className="relative rounded-2xl overflow-hidden border"
          style={{ borderColor: `${level.color}40` }}
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #0d0f14 0%, ${level.color}18 60%, ${level.color}30 100%)`,
            }}
          />
          {/* Glowing orb */}
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: level.color }}
          />

          <div className="relative p-4">
            <div className="flex items-start gap-4">
              {/* Avatar with ring */}
              <div className="relative shrink-0">
                <div
                  className="w-20 h-20 rounded-full p-0.5"
                  style={{ background: `conic-gradient(${level.color} ${levelProgress}%, #1f2937 ${levelProgress}%)` }}
                >
                  <img
                    src={player.avatar_url}
                    alt={player.name}
                    className="w-full h-full rounded-full object-cover border-2 border-[#0d0f14]"
                  />
                </div>
                {/* Level % badge */}
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: level.color, color: '#000' }}
                >
                  {level.name}
                </div>
              </div>

              {/* Name + info */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-2xl font-black leading-tight truncate text-white">{player.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {player.position || 'Positie niet ingesteld'}
                  {player.age ? ` · ${player.age} jaar` : ''}
                </p>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
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
              </div>

              {/* Score + rank */}
              <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
                <div className="text-center">
                  <div className="text-4xl font-black leading-none" style={{ color: level.color, textShadow: `0 0 20px ${level.color}60` }}>
                    {score}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-0.5">score</div>
                </div>
                {players.length > 1 && (
                  <div
                    className="px-2 py-0.5 rounded-full text-xs font-black"
                    style={{ backgroundColor: `${rankMedalColor}20`, color: rankMedalColor, border: `1px solid ${rankMedalColor}40` }}
                  >
                    #{myRank}
                  </div>
                )}
              </div>
            </div>

            {/* Match rating strip */}
            {currentEval?.matchRating > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Wedstrijdcijfer</span>
                <div className="flex items-center gap-1.5">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-1.5 rounded-full transition-all"
                      style={{
                        backgroundColor: i < currentEval.matchRating
                          ? (currentEval.matchRating >= 7 ? NEON_COLOR : currentEval.matchRating >= 5 ? '#f97316' : '#f87171')
                          : '#1f2937',
                      }}
                    />
                  ))}
                  <span className="text-sm font-black ml-1" style={{ color: currentEval.matchRating >= 7 ? NEON_COLOR : currentEval.matchRating >= 5 ? '#f97316' : '#f87171' }}>
                    {currentEval.matchRating}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── SKILL CIRCLES GRID ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <Card className="!p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
            Skills — <span className="font-normal normal-case text-gray-600">{activeTab}</span>
          </p>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {skillKeys.slice(0, 4).map(k => (
              <SkillCircle
                key={k}
                skill={k}
                value={currentEval?.skills[k] ?? 5}
                color={level.color}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-y-4 gap-x-2 mt-4 max-w-[calc(100%-2rem)] mx-auto">
            {skillKeys.slice(4).map(k => (
              <SkillCircle
                key={k}
                skill={k}
                value={currentEval?.skills[k] ?? 5}
                color={level.color}
              />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── STERK IN / WERK AAN ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-2xl p-4 border border-emerald-900/50 bg-emerald-950/20">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Sterk In</span>
          </div>
          <div className="space-y-3">
            {strengths.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">{SKILL_LABELS[s.key]}</span>
                  <span className="font-black text-emerald-400">{s.value}</span>
                </div>
                <div className="bg-gray-800/60 rounded-full h-1">
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

        <div className="rounded-2xl p-4 border border-orange-900/50 bg-orange-950/20">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={12} className="text-orange-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Werk Aan</span>
          </div>
          <div className="space-y-3">
            {improvements.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">{SKILL_LABELS[s.key]}</span>
                  <span className="font-black text-orange-400">{s.value}</span>
                </div>
                <div className="bg-gray-800/60 rounded-full h-1">
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

      {/* ── HUISWERK PROGRESS (indien aanwezig) ── */}
      {hwPct !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
          <Card className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Huiswerk</span>
              </div>
              <span className="text-xs font-black" style={{ color: hwPct === 100 ? '#4ade80' : NEON_COLOR }}>{hwDone}/{assignedIds.length} klaar</span>
            </div>
            <div className="mt-2.5 bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-2 rounded-full"
                style={{ backgroundColor: hwPct === 100 ? '#4ade80' : NEON_COLOR }}
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
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Badges</p>
          <div className="grid grid-cols-4 gap-2">
            {badges.map(b => (
              <motion.div
                key={b.label}
                whileTap={{ scale: 0.92 }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all ${
                  b.earned
                    ? 'bg-gray-800/80 border border-gray-600/80'
                    : 'bg-gray-900/30 border border-gray-800/40 opacity-25'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: b.earned ? `${NEON_COLOR}15` : 'transparent' }}
                >
                  <span style={{ color: b.earned ? NEON_COLOR : '#6b7280' }}>{b.icon}</span>
                </div>
                <span className="text-[8px] leading-tight text-gray-400 whitespace-pre-line font-medium">{b.label}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── AI COACH ANALYSE ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${NEON_COLOR}20` }}>
                <Wand2 size={11} style={{ color: NEON_COLOR }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Coach AI Analyse</p>
            </div>
            <button
              onClick={handleAIInsight}
              disabled={loadingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black disabled:opacity-50 transition-opacity hover:opacity-90 active:scale-95"
              style={{ backgroundColor: NEON_COLOR }}
            >
              {loadingAI ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
              {loadingAI ? 'Laden...' : 'Genereer'}
            </button>
          </div>
          <AnimatePresence mode="wait">
            {aiInsight ? (
              <motion.p key="insight" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-gray-200 leading-relaxed">
                {aiInsight}
              </motion.p>
            ) : (
              <motion.p key="placeholder" className="text-xs text-gray-600 italic">
                Druk op Genereer voor een persoonlijke analyse.
              </motion.p>
            )}
          </AnimatePresence>
          {currentEval?.trainingPlan && (
            <div className="mt-3 pt-3 border-t border-gray-800/60">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Persoonlijk Oefenplan</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{currentEval.trainingPlan}</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── JIJ VS TEAM RADAR ── */}
      {players.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
          <Card className="!p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
              Jij vs Team <span className="font-normal normal-case text-gray-600">— {activeTab}</span>
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#1f2937" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Jij" dataKey="jij" stroke={NEON_COLOR} fill={NEON_COLOR} fillOpacity={0.35} />
                  <Radar name="Team gem." dataKey="team" stroke="#374151" fill="#374151" fillOpacity={0.15} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── VOORTGANG PER PERIODE ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
        <Card className="!p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Voortgang per Periode</p>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[240px]">
              <thead>
                <tr className="text-gray-600 text-[9px] uppercase tracking-wide border-b border-gray-800/60">
                  <th className="text-left pb-2 font-semibold pl-1">Skill</th>
                  {evaluationPeriods.map(p => (
                    <th key={p} className="text-center pb-2 font-semibold">{p.replace('Check-in ', 'CI')}</th>
                  ))}
                  <th className="text-center pb-2">+/-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {skillProgress.map(({ key, label, values }) => {
                  const delta = values[values.length - 1] - values[0];
                  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                  const trendColor = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#374151';
                  return (
                    <tr key={key}>
                      <td className="py-2 text-gray-400 text-[11px] pl-1">{label}</td>
                      {values.map((v, i) => (
                        <td key={i} className="py-2 text-center font-black text-sm" style={{
                          color: v >= 7 ? NEON_COLOR : v >= 5 ? '#e5e7eb' : '#f87171',
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

      {/* ── TEAM RANGLIJST ── */}
      {players.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.35 }}>
          <Card className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Team Ranglijst</p>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Medal size={11} />
                <span>#{myRank} van {players.length}</span>
              </div>
            </div>
            <div className="space-y-1">
              {ranking.map(({ id, name, avatar, score: s }, idx) => {
                const isMe = id === player.id;
                const medal = idx === 0 ? '#FFD700' : idx === 1 ? '#9ca3af' : idx === 2 ? '#CD7F32' : null;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all ${
                      isMe ? 'border' : 'border border-transparent'
                    }`}
                    style={isMe ? { backgroundColor: `${NEON_COLOR}08`, borderColor: `${NEON_COLOR}25` } : {}}
                  >
                    <span
                      className="text-xs font-black w-5 text-center shrink-0"
                      style={{ color: isMe ? NEON_COLOR : medal ?? '#374151' }}
                    >
                      {idx + 1}
                    </span>
                    <img src={avatar} className="w-7 h-7 rounded-full shrink-0 border border-gray-700/40" alt={name} />
                    <span className={`flex-1 text-sm min-w-0 truncate ${isMe ? 'font-bold text-white' : 'text-gray-400'}`}>
                      {name}
                      {isMe && <span className="text-[10px] ml-1.5 font-normal" style={{ color: NEON_COLOR }}>← jij</span>}
                    </span>
                    <span className="font-black text-sm shrink-0" style={{ color: isMe ? NEON_COLOR : 'white' }}>
                      {s}<span className="text-gray-700 font-normal text-xs">/100</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

    </div>
  );
};

export default PlayerOverview;
