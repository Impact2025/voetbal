import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Users, Trophy, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, Minus, TrendingUp, ArrowUpDown, ChevronRight,
} from 'lucide-react';
import Card from '../ui/Card';
import { skillKeys, SKILL_GROUPS, COACH_COLOR } from '../../utils/constants';
import type { Player, Team, AttendanceRecord } from '../../types';

interface PlayersDashboardProps {
  players: Player[];
  teamData: Partial<Team>;
  activeTab: string;
  teamPeriods: string[];
  attendanceRecords: AttendanceRecord[];
  onSelectPlayer: (id: string) => void;
  onAddPlayer: () => void;
}

type SortKey = 'score' | 'name' | 'attention' | 'rating';

interface PlayerRow {
  player: Player;
  score: number;          // 0–100
  avgSkill: number;       // 0–10
  matchRating: number;
  trend: number | null;   // score-delta vs previous period (0–100), null if no prior data
  hwDone: number;
  hwTotal: number;
  attendancePct: number | null;
  attendanceCount: number;
  groupAverages: { key: string; label: string; color: string; value: number }[];
  weakest: { label: string; value: number } | null;
  needsAttention: boolean;
}

const scoreColor = (score: number) =>
  score >= 70 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626';

const StatChip = ({ label, value, sub, icon, warn = false }: {
  label: string; value: string; sub: string; icon: React.ReactNode; warn?: boolean;
}) => (
  <Card light className="text-center py-4">
    <div className="flex flex-col items-center gap-1">
      <div style={{ color: warn && value !== '0' ? '#dc2626' : COACH_COLOR }}>{icon}</div>
      <div className="text-2xl font-black" style={{ color: warn && value !== '0' ? '#dc2626' : COACH_COLOR }}>{value}</div>
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{sub}</div>
    </div>
  </Card>
);

const TrendBadge = ({ trend }: { trend: number | null }) => {
  if (trend === null) {
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-300"><Minus size={12} /></span>;
  }
  if (Math.abs(trend) < 0.5) {
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-400"><Minus size={12} /> 0</span>;
  }
  const up = trend > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(Math.round(trend))}
    </span>
  );
};

const PlayersDashboard = ({
  players, teamData, activeTab, teamPeriods, attendanceRecords, onSelectPlayer, onAddPlayer,
}: PlayersDashboardProps) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');

  const assignedIds = useMemo(
    () => teamData.assigned_homework_ids ?? [],
    [teamData.assigned_homework_ids],
  );
  const prevPeriod = useMemo(() => {
    const idx = teamPeriods.indexOf(activeTab);
    return idx > 0 ? teamPeriods[idx - 1] : null;
  }, [teamPeriods, activeTab]);

  const rows = useMemo<PlayerRow[]>(() => players.map(p => {
    const ev = p.evaluations?.[activeTab];
    const avgSkill = ev ? skillKeys.reduce((s, k) => s + (ev.skills[k] ?? 5), 0) / skillKeys.length : 5;
    const score = Math.round(avgSkill * 10);

    let trend: number | null = null;
    if (prevPeriod) {
      const prevEv = p.evaluations?.[prevPeriod];
      if (prevEv) {
        const prevAvg = skillKeys.reduce((s, k) => s + (prevEv.skills[k] ?? 5), 0) / skillKeys.length;
        trend = (avgSkill - prevAvg) * 10;
      }
    }

    const hwDone = assignedIds.filter(id => p.completed_homework_ids?.includes(id)).length;

    const attRecords = attendanceRecords.filter(a => a.player_id === p.id);
    const attendancePct = attRecords.length > 0
      ? Math.round((attRecords.filter(a => a.present).length / attRecords.length) * 100)
      : null;

    const groupAverages = SKILL_GROUPS.map(g => ({
      key: g.key,
      label: g.label,
      color: g.color,
      value: ev ? g.skills.reduce((s, sk) => s + (ev.skills[sk.key] ?? 5), 0) / g.skills.length : 5,
    }));

    let weakest: { label: string; value: number } | null = null;
    if (ev) {
      for (const g of SKILL_GROUPS) {
        for (const sk of g.skills) {
          const v = ev.skills[sk.key] ?? 5;
          if (!weakest || v < weakest.value) weakest = { label: sk.label, value: v };
        }
      }
    }

    return {
      player: p,
      score,
      avgSkill,
      matchRating: ev?.matchRating ?? 0,
      trend,
      hwDone,
      hwTotal: assignedIds.length,
      attendancePct,
      attendanceCount: attRecords.length,
      groupAverages,
      weakest,
      needsAttention: avgSkill < 5,
    };
  }), [players, activeTab, prevPeriod, assignedIds, attendanceRecords]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? rows.filter(r => r.player.name.toLowerCase().includes(q)) : rows;
    const sorted = [...base];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.player.name.localeCompare(b.player.name);
        case 'rating': return b.matchRating - a.matchRating;
        case 'attention': return (a.avgSkill - b.avgSkill); // lowest first
        case 'score':
        default: return b.score - a.score;
      }
    });
    return sorted;
  }, [rows, search, sortKey]);

  const teamAvg = rows.length ? rows.reduce((s, r) => s + r.avgSkill, 0) / rows.length : 0;
  const hwComplete = assignedIds.length > 0 ? rows.filter(r => r.hwDone === assignedIds.length).length : 0;
  const needsAttention = rows.filter(r => r.needsAttention);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'score', label: 'Score' },
    { key: 'attention', label: 'Aandacht' },
    { key: 'rating', label: 'Rating' },
    { key: 'name', label: 'Naam' },
  ];

  if (players.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
        <Users size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-400 font-medium mb-3">Nog geen spelers in het team</p>
        <button onClick={onAddPlayer} className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: COACH_COLOR }}>
          Eerste speler toevoegen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="Team Score" value={`${(teamAvg * 10).toFixed(0)}`} sub="/ 100" icon={<Trophy size={18} />} />
        <StatChip label="Spelers" value={`${players.length}`} sub="in team" icon={<Users size={18} />} />
        <StatChip
          label="HW Voltooid"
          value={assignedIds.length > 0 ? `${hwComplete}/${players.length}` : '—'}
          sub={assignedIds.length > 0 ? 'spelers' : 'geen HW'}
          icon={<CheckCircle2 size={18} />}
        />
        <StatChip label="Let Op" value={`${needsAttention.length}`} sub="spelers < 5" icon={<AlertTriangle size={18} />} warn />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek speler..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-400">
            <ArrowUpDown size={14} />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {sortOptions.map(opt => {
              const active = sortKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  style={active ? { backgroundColor: COACH_COLOR } : {}}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Player cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(row => {
          const { player, score, matchRating, trend, hwDone, hwTotal, attendancePct, groupAverages, weakest, needsAttention: attn } = row;
          const sc = scoreColor(score);
          return (
            <motion.button
              key={player.id}
              onClick={() => onSelectPlayer(player.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="group text-left"
            >
              <Card light className="h-full hover:shadow-md hover:border-green-200 transition-all">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img src={player.avatar_url} alt={player.name} className="w-11 h-11 rounded-full border border-gray-200" />
                    {attn && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                        <AlertTriangle size={9} className="text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-gray-900 truncate leading-tight">{player.name}</div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {player.position || 'Geen positie'}{player.age ? ` · ${player.age} jr` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black tabular-nums leading-none" style={{ color: sc }}>{score}</div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <TrendBadge trend={trend} />
                    </div>
                  </div>
                </div>

                {/* Skill-group mini bars */}
                <div className="mt-3 space-y-1.5">
                  {groupAverages.map(g => (
                    <div key={g.key} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-16 shrink-0" style={{ color: g.color }}>{g.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: g.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${g.value * 10}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-gray-500 w-6 text-right">{g.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer metrics */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-sm font-black text-gray-900 tabular-nums">{matchRating || '—'}</div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wide">Rating</div>
                  </div>
                  <div>
                    <div className={`text-sm font-black tabular-nums ${hwTotal > 0 && hwDone === hwTotal ? 'text-green-600' : 'text-gray-900'}`}>
                      {hwTotal > 0 ? `${hwDone}/${hwTotal}` : '—'}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wide">Huiswerk</div>
                  </div>
                  <div>
                    <div className={`text-sm font-black tabular-nums ${attendancePct !== null && attendancePct < 70 ? 'text-red-500' : 'text-gray-900'}`}>
                      {attendancePct !== null ? `${attendancePct}%` : '—'}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wide">Aanwezig</div>
                  </div>
                </div>

                {/* Focus point */}
                {weakest && weakest.value < 5 && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-500 bg-amber-50 rounded-lg px-2 py-1.5">
                    <TrendingUp size={12} className="text-amber-500 shrink-0" />
                    <span className="truncate">Focus: <span className="font-semibold text-gray-700">{weakest.label}</span> ({weakest.value})</span>
                    <ChevronRight size={13} className="ml-auto text-gray-300 group-hover:text-green-500 transition-colors shrink-0" />
                  </div>
                )}
              </Card>
            </motion.button>
          );
        })}

        {/* Add player card */}
        <button
          onClick={onAddPlayer}
          className="min-h-[160px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-400 text-gray-400 hover:text-green-600 transition-colors"
        >
          <Plus size={22} />
          <span className="text-sm font-bold">Speler toevoegen</span>
        </button>
      </div>
    </div>
  );
};

export default PlayersDashboard;
