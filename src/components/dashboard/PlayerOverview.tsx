import { useMemo, useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Wand2, Loader2, TrendingUp, TrendingDown, Minus,
  ArrowUp, Target, Trophy, BookOpen, Zap, Shield,
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

const getLevel = (score: number) => LEVELS.find(l => score >= l.min && score < l.max) ?? LEVELS[0];

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
    { icon: <BookOpen size={16} />,    label: 'Huiswerk\nHeld',    earned: assignedIds.length > 0 && hwDone === assignedIds.length },
    { icon: <Trophy size={16} />,      label: 'Top 3',             earned: myRank > 0 && myRank <= 3 },
    { icon: <CircleDot size={16} />,   label: 'All-\nRounder',     earned: sortedSkills.every(s => s.value >= 6) },
    { icon: <Zap size={16} />,         label: 'Techniek\nSter',    earned: (currentEval?.skills.techniek ?? 0) >= 8 },
    { icon: <Shield size={16} />,      label: 'Rots\nAchterin',    earned: (currentEval?.skills.verdedigen ?? 0) >= 8 },
    { icon: <Crosshair size={16} />,   label: 'Scherp-\nschutter', earned: (currentEval?.skills.schot ?? 0) >= 8 },
    { icon: <Brain size={16} />,       label: 'Spel-\nbrein',      earned: (currentEval?.skills.inzicht ?? 0) >= 8 },
    { icon: <MessageSquare size={16} />,label: 'Open\nGeest',      earned: (player.weekly_question_responses ?? []).some(r => r.trim().length > 0) },
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

  return (
    <div className="space-y-4 pb-2">

      {/* Level Hero Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ background: `radial-gradient(circle at 85% 50%, ${level.color}, transparent 65%)` }} />
          <div className="relative flex items-center gap-4">
            <img src={player.avatar_url} alt={player.name} className="w-14 h-14 rounded-full border-2 shrink-0" style={{ borderColor: level.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: `${level.color}20`, color: level.color }}>{level.name}</span>
              </div>
              <h2 className="text-lg font-black truncate leading-tight">{player.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <motion.div
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: level.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums text-gray-300">{score}<span className="text-gray-500 font-normal">/100</span></span>
              </div>
            </div>
            {players.length > 1 && (
              <div className="shrink-0 text-center pl-2 border-l border-gray-700">
                <div className="text-2xl font-black" style={{ color: myRank <= 3 ? '#FFD700' : 'white' }}>#{myRank}</div>
                <div className="text-[10px] uppercase text-gray-500 tracking-wide">team</div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Krachten vs Verbeterpunten */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="border border-emerald-900/40 bg-emerald-950/20">
          <div className="flex items-center gap-1.5 mb-3">
            <ArrowUp size={13} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sterk In</span>
          </div>
          <div className="space-y-2.5">
            {strengths.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-200">{SKILL_LABELS[s.key]}</span>
                  <span className="font-black text-emerald-400">{s.value}</span>
                </div>
                <div className="bg-gray-700/60 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-emerald-400 transition-all" style={{ width: `${s.value * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="border border-orange-900/40 bg-orange-950/20">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={13} className="text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Werk Aan</span>
          </div>
          <div className="space-y-2.5">
            {improvements.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-200">{SKILL_LABELS[s.key]}</span>
                  <span className="font-black text-orange-400">{s.value}</span>
                </div>
                <div className="bg-gray-700/60 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-orange-400 transition-all" style={{ width: `${s.value * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Badges</p>
          <div className="grid grid-cols-4 gap-2">
            {badges.map(b => (
              <div
                key={b.label}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-center transition-all ${
                  b.earned
                    ? 'bg-gray-800 border border-gray-600'
                    : 'bg-gray-900/40 border border-gray-800 opacity-30'
                }`}
              >
                <div style={{ color: b.earned ? NEON_COLOR : '#6b7280' }}>{b.icon}</div>
                <span className="text-[9px] leading-tight text-gray-300 whitespace-pre-line">{b.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* AI Coach Inzicht */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Coach AI Analyse</p>
            <button
              onClick={handleAIInsight}
              disabled={loadingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black disabled:opacity-50 transition-opacity hover:opacity-90"
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
              <motion.p key="placeholder" className="text-sm text-gray-500">
                Druk op Genereer voor een persoonlijke analyse.
              </motion.p>
            )}
          </AnimatePresence>
          {currentEval?.trainingPlan && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Persoonlijk Oefenplan</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{currentEval.trainingPlan}</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Jij vs Team radar */}
      {players.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
          <Card>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Jij vs Team <span className="font-normal normal-case text-gray-600">— {activeTab}</span>
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Jij" dataKey="jij" stroke={NEON_COLOR} fill={NEON_COLOR} fillOpacity={0.4} />
                  <Radar name="Team gem." dataKey="team" stroke="#4b5563" fill="#4b5563" fillOpacity={0.15} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Skill voortgang */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Voortgang per Periode</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600 text-[10px] uppercase tracking-wide border-b border-gray-800">
                <th className="text-left pb-2 font-medium">Skill</th>
                {evaluationPeriods.map(p => (
                  <th key={p} className="text-center pb-2 font-medium">{p.replace('Check-in ', 'CI')}</th>
                ))}
                <th className="text-center pb-2">+/-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {skillProgress.map(({ key, label, values }) => {
                const delta = values[values.length - 1] - values[0];
                const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                const trendColor = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#4b5563';
                return (
                  <tr key={key}>
                    <td className="py-2 text-gray-400 text-xs">{label}</td>
                    {values.map((v, i) => (
                      <td key={i} className="py-2 text-center font-bold text-sm" style={{
                        color: v >= 7 ? NEON_COLOR : v >= 5 ? 'white' : '#f87171',
                      }}>{v}</td>
                    ))}
                    <td className="py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <TrendIcon size={12} style={{ color: trendColor }} />
                        {delta !== 0 && <span className="text-[10px] font-bold" style={{ color: trendColor }}>{delta > 0 ? `+${delta}` : delta}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </motion.div>

      {/* Team ranglijst */}
      {players.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Team Ranglijst</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Medal size={12} />
                <span>#{myRank} van {players.length}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-800/50">
              {ranking.map(({ id, name, avatar, score: s }, idx) => {
                const isMe = id === player.id;
                const medalColor = idx === 0 ? '#FFD700' : idx === 1 ? '#9ca3af' : idx === 2 ? '#CD7F32' : '#374151';
                return (
                  <div key={id} className={`flex items-center gap-3 py-2.5 px-2 rounded-lg ${isMe ? 'bg-[#00FF9D]/8 border border-[#00FF9D]/20' : ''}`}>
                    <span className="text-xs font-black w-4 text-center shrink-0" style={{ color: isMe ? NEON_COLOR : medalColor }}>{idx + 1}</span>
                    <img src={avatar} className="w-7 h-7 rounded-full border border-gray-700/60 shrink-0" alt={name} />
                    <span className={`flex-1 text-sm ${isMe ? 'font-semibold text-white' : 'text-gray-400'}`}>
                      {name}{isMe && <span className="text-xs ml-1.5 font-normal" style={{ color: NEON_COLOR }}>← jij</span>}
                    </span>
                    <span className="font-black text-sm shrink-0" style={{ color: isMe ? NEON_COLOR : 'white' }}>
                      {s}<span className="text-gray-600 font-normal text-xs">/100</span>
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
