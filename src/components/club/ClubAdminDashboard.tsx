import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Trophy, Copy, CheckCircle2, LogOut, Building2, Shield,
  TrendingUp, TrendingDown, Minus, ChevronLeft, CalendarCheck,
  ClipboardList, BarChart2, AlertTriangle, Star, Loader2,
  LayoutDashboard, UserSquare, Bell, UserCog,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR, skillKeys } from '../../utils/constants';
import { copyToClipboard } from '../../utils/clipboard';
import Card from '../ui/Card';
import TrainersTab from './TrainersTab';
import type { UserData } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerRow {
  id: string;
  name: string;
  position: string;
  age: string;
  avatar_url: string;
  team_id: string;
  evaluations: Record<string, { skills: Record<string, number>; matchRating: number }>;
  completed_homework_ids: string[];
}

interface TeamEnriched {
  id: string;
  team_name: string;
  team_class: string;
  evaluation_periods: string[];
  assigned_homework_ids: string[];
  players: PlayerRow[];
  avgScore: number;
  firstScore: number;
  attendanceRate: number | null;
  hwRate: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
  trendDelta: number;
}

export type { TeamEnriched };

interface ClubAdminDashboardProps {
  userData: UserData;
  onLogout: () => void;
}

type SectionId = 'overzicht' | 'spelers' | 'signalen' | 'trainers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcSkillAvg = (player: PlayerRow, period: string): number => {
  const ev = player.evaluations?.[period];
  if (!ev?.skills) return 5;
  return skillKeys.reduce((s, k) => s + (ev.skills[k] ?? 5), 0) / skillKeys.length;
};

const calcTeamAvg = (players: PlayerRow[], period: string): number => {
  if (!players.length) return 0;
  return players.reduce((s, p) => s + calcSkillAvg(p, period), 0) / players.length;
};

const toScore = (avg: number) => Math.round(avg * 10);

const scoreColor = (score: number) =>
  score >= 70 ? NEON_COLOR : score >= 55 ? '#a78bfa' : score >= 40 ? '#fbbf24' : '#f87171';

const pctColor = (pct: number) =>
  pct >= 80 ? NEON_COLOR : pct >= 60 ? '#a78bfa' : pct >= 40 ? '#fbbf24' : '#f87171';

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full bg-gray-800 rounded-full h-1.5">
    <motion.div
      className="h-1.5 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, value)}%` }}
      transition={{ duration: 0.6 }}
    />
  </div>
);

const TrendBadge = ({ trend, delta }: { trend: TeamEnriched['trend']; delta: number }) => {
  if (trend === 'new') return <span className="text-[10px] text-gray-600">nieuw</span>;
  if (trend === 'up') return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: NEON_COLOR }}>
      <TrendingUp size={10} />+{Math.abs(Math.round(delta * 10))}
    </span>
  );
  if (trend === 'down') return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400">
      <TrendingDown size={10} />-{Math.abs(Math.round(delta * 10))}
    </span>
  );
  return <span className="flex items-center gap-0.5 text-[10px] text-gray-500"><Minus size={10} />stabiel</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ClubAdminDashboard = ({ userData, onLogout }: ClubAdminDashboardProps) => {
  const [clubName, setClubName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [teams, setTeams] = useState<TeamEnriched[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [section, setSection] = useState<SectionId>('overzicht');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setSenderEmail(user.email);
    });
  }, []);

  useEffect(() => {
    if (!userData.clubId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: club }, { data: rawTeams }] = await Promise.all([
          supabase.from('clubs').select('name').eq('id', userData.clubId).single(),
          supabase.from('teams').select('*').eq('club_id', userData.clubId),
        ]);
        if (club) setClubName(club.name);
        if (!rawTeams?.length) { setLoading(false); return; }

        const teamIds = rawTeams.map((t: { id: string }) => t.id);
        const [{ data: playersData }, { data: attendanceData }] = await Promise.all([
          supabase.from('players').select('*').in('team_id', teamIds),
          supabase.from('attendance').select('player_id,team_id,session_date,present').in('team_id', teamIds),
        ]);

        const players = (playersData || []) as PlayerRow[];
        const attendance = (attendanceData || []) as { player_id: string; team_id: string; session_date: string; present: boolean }[];
        setAllPlayers(players);

        const enriched: TeamEnriched[] = rawTeams.map((team: Record<string, unknown>) => {
          const tp = players.filter(p => p.team_id === team.id);
          const periods: string[] = Array.isArray(team.evaluation_periods) && (team.evaluation_periods as string[]).length
            ? (team.evaluation_periods as string[])
            : ['Check-in 1', 'Check-in 2', 'Check-in 3'];
          const assigned: string[] = Array.isArray(team.assigned_homework_ids) ? (team.assigned_homework_ids as string[]) : [];

          const latestPeriod = periods[periods.length - 1];
          const avgScore = calcTeamAvg(tp, latestPeriod);
          const firstScore = periods.length > 1 ? calcTeamAvg(tp, periods[0]) : avgScore;
          const trendDelta = avgScore - firstScore;
          const trend: TeamEnriched['trend'] =
            periods.length < 2 ? 'new'
            : Math.abs(trendDelta) < 0.2 ? 'stable'
            : trendDelta > 0 ? 'up' : 'down';

          const ta = attendance.filter(a => a.team_id === team.id);
          const sessions = [...new Set(ta.map(a => a.session_date))];
          const attendanceRate = sessions.length && tp.length
            ? (ta.filter(a => a.present).length / (sessions.length * tp.length)) * 100
            : null;

          const hwRate = assigned.length && tp.length
            ? tp.reduce((s, p) =>
                s + p.completed_homework_ids.filter(id => assigned.includes(id)).length, 0
              ) / (assigned.length * tp.length) * 100
            : null;

          return {
            id: team.id as string,
            team_name: team.team_name as string,
            team_class: (team.team_class as string) || '',
            evaluation_periods: periods,
            assigned_homework_ids: assigned,
            players: tp,
            avgScore, firstScore, attendanceRate, hwRate, trend, trendDelta,
          };
        });

        setTeams(enriched);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [userData.clubId]);

  const clubStats = useMemo(() => {
    const tw = teams.filter(t => t.players.length > 0);
    const avgScore = tw.length ? toScore(tw.reduce((s, t) => s + t.avgScore, 0) / tw.length) : 0;
    const at = teams.filter(t => t.attendanceRate !== null);
    const avgAtt = at.length ? at.reduce((s, t) => s + t.attendanceRate!, 0) / at.length : null;
    const hw = teams.filter(t => t.hwRate !== null);
    const avgHw = hw.length ? hw.reduce((s, t) => s + t.hwRate!, 0) / hw.length : null;
    return { avgScore, avgAtt, avgHw };
  }, [teams]);

  const clubRadarData = useMemo(() => skillKeys.map(key => {
    const avg = allPlayers.length
      ? allPlayers.reduce((s, p) => {
          const team = teams.find(t => t.id === p.team_id);
          const period = team?.evaluation_periods.at(-1) ?? 'Check-in 1';
          return s + (p.evaluations?.[period]?.skills?.[key] ?? 5);
        }, 0) / allPlayers.length
      : 5;
    return { subject: key.charAt(0).toUpperCase() + key.slice(1), value: +avg.toFixed(1), fullMark: 10 };
  }), [allPlayers, teams]);

  const topPerformers = useMemo(() =>
    allPlayers.map(p => {
      const team = teams.find(t => t.id === p.team_id);
      if (!team) return null;
      const score = toScore(calcSkillAvg(p, team.evaluation_periods.at(-1)!));
      return { player: p, team, score };
    }).filter(Boolean).sort((a, b) => b!.score - a!.score).slice(0, 8) as { player: PlayerRow; team: TeamEnriched; score: number }[]
  , [allPlayers, teams]);

  const mostImproved = useMemo(() =>
    allPlayers.map(p => {
      const team = teams.find(t => t.id === p.team_id);
      if (!team || team.evaluation_periods.length < 2) return null;
      const delta = calcSkillAvg(p, team.evaluation_periods.at(-1)!) - calcSkillAvg(p, team.evaluation_periods[0]);
      const score = toScore(calcSkillAvg(p, team.evaluation_periods.at(-1)!));
      return { player: p, team, delta, score };
    }).filter(Boolean).sort((a, b) => b!.delta - a!.delta).slice(0, 5) as { player: PlayerRow; team: TeamEnriched; delta: number; score: number }[]
  , [allPlayers, teams]);

  const needAttention = useMemo(() =>
    allPlayers.map(p => {
      const team = teams.find(t => t.id === p.team_id);
      if (!team) return null;
      const score = toScore(calcSkillAvg(p, team.evaluation_periods.at(-1)!));
      return { player: p, team, score };
    }).filter(Boolean).sort((a, b) => a!.score - b!.score).slice(0, 5) as { player: PlayerRow; team: TeamEnriched; score: number }[]
  , [allPlayers, teams]);

  const signals = useMemo(() => {
    const items: { message: string; teamName: string; teamId: string }[] = [];
    teams.forEach(t => {
      if (t.attendanceRate !== null && t.attendanceRate < 70)
        items.push({ message: `Lage aanwezigheid: ${Math.round(t.attendanceRate)}%`, teamName: t.team_name, teamId: t.id });
      if (t.hwRate !== null && t.hwRate < 50)
        items.push({ message: `Lage huiswerk-inlevering: ${Math.round(t.hwRate)}%`, teamName: t.team_name, teamId: t.id });
      if (t.trend === 'down')
        items.push({ message: `Dalende skill-trend (${Math.round(Math.abs(t.trendDelta) * 10)} pnt)`, teamName: t.team_name, teamId: t.id });
    });
    return items;
  }, [teams]);

  const SECTIONS: { id: SectionId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overzicht', label: 'Overzicht', icon: LayoutDashboard },
    { id: 'spelers',   label: 'Spelers',   icon: UserSquare },
    { id: 'trainers',  label: 'Trainers',  icon: UserCog },
    { id: 'signalen',  label: 'Signalen',  icon: Bell, badge: signals.length || undefined },
  ];

  const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null;

  const drilldownData = useMemo(() => {
    if (!selectedTeam) return null;
    const latestPeriod = selectedTeam.evaluation_periods.at(-1)!;

    const playerRows = selectedTeam.players
      .map(p => ({ player: p, score: toScore(calcSkillAvg(p, latestPeriod)) }))
      .sort((a, b) => b.score - a.score);

    const trendLine = selectedTeam.evaluation_periods.map(period => ({
      name: period,
      score: toScore(calcTeamAvg(selectedTeam.players, period)),
    }));

    const radarData = skillKeys.map(key => {
      const teamAvg = selectedTeam.players.length
        ? selectedTeam.players.reduce((s, p) => s + (p.evaluations?.[latestPeriod]?.skills?.[key] ?? 5), 0) / selectedTeam.players.length
        : 5;
      const clubAvg = allPlayers.length
        ? allPlayers.reduce((s, p) => {
            const t = teams.find(t2 => t2.id === p.team_id);
            const period = t?.evaluation_periods.at(-1) ?? 'Check-in 1';
            return s + (p.evaluations?.[period]?.skills?.[key] ?? 5);
          }, 0) / allPlayers.length
        : 5;
      return { subject: key.charAt(0).toUpperCase() + key.slice(1), team: +teamAvg.toFixed(1), club: +clubAvg.toFixed(1) };
    });

    return { playerRows, trendLine, radarData };
  }, [selectedTeam, allPlayers, teams]);

  const handleCopyClubId = async () => {
    if (userData.clubId) {
      await copyToClipboard(userData.clubId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#090B0F]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 size={18} style={{ color: NEON_COLOR }} className="shrink-0" />
            <h1 className="text-lg font-black tracking-wide truncate" style={{ color: NEON_COLOR }}>
              {clubName || 'Club Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleCopyClubId} className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700 hover:bg-gray-700 transition-colors">
              <span className="text-gray-400">Club ID:</span>
              <span className="font-mono font-bold text-white">{userData.clubId}</span>
              {copied ? <CheckCircle2 size={13} className="text-green-400" /> : <Copy size={13} className="text-gray-500" />}
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); onLogout(); }} className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 hover:bg-red-900/40 transition-colors text-red-400">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop section tabs */}
      {!selectedTeam && (
        <nav className="border-b border-white/[0.06] bg-[#090B0F]/60 px-4">
          <div className="max-w-5xl mx-auto flex">
            {SECTIONS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                  section === id ? 'border-[--neon-color] text-white' : 'border-transparent text-gray-500 hover:text-gray-200'
                }`}
              >
                <Icon size={15} />
                {label}
                {badge ? (
                  <span className="absolute top-2 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">
                    {badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 sm:pb-10">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin h-10 w-10" style={{ color: NEON_COLOR }} />
            <p className="text-gray-400 text-sm">Club data laden...</p>
          </div>

        ) : selectedTeam && drilldownData ? (
          /* ── Team drill-down ── */
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <button onClick={() => setSelectedTeamId(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={16} /> Terug naar overzicht
            </button>

            {/* Team header card */}
            <Card>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${NEON_COLOR}15` }}>
                  <Users size={24} style={{ color: NEON_COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black truncate">{selectedTeam.team_name}</h2>
                  <p className="text-sm text-gray-400">{selectedTeam.team_class} · {selectedTeam.players.length} spelers</p>
                </div>
                <div className="flex gap-5 flex-wrap shrink-0">
                  <div className="text-center">
                    <div className="text-2xl font-black" style={{ color: scoreColor(toScore(selectedTeam.avgScore)) }}>{toScore(selectedTeam.avgScore)}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">score</div>
                  </div>
                  {selectedTeam.attendanceRate !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-black" style={{ color: pctColor(selectedTeam.attendanceRate) }}>{Math.round(selectedTeam.attendanceRate)}%</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">aanwezig</div>
                    </div>
                  )}
                  {selectedTeam.hwRate !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-black" style={{ color: pctColor(selectedTeam.hwRate) }}>{Math.round(selectedTeam.hwRate)}%</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">huiswerk</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="flex justify-center pt-1"><TrendBadge trend={selectedTeam.trend} delta={selectedTeam.trendDelta} /></div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">trend</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Player list */}
            <Card>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                Spelers — {selectedTeam.evaluation_periods.at(-1)}
              </p>
              <div className="space-y-2">
                {drilldownData.playerRows.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">Geen spelers in dit team.</p>
                )}
                {drilldownData.playerRows.map(({ player, score }, idx) => (
                  <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40">
                    <span className={`text-xs font-black w-5 text-center shrink-0 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {idx + 1}
                    </span>
                    <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                      <p className="text-[10px] text-gray-500">{player.position || '—'}{player.age ? ` · ${player.age}jr` : ''}</p>
                    </div>
                    <div className="text-xl font-black shrink-0" style={{ color: scoreColor(score) }}>{score}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {drilldownData.trendLine.length > 1 && (
                <Card>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                    <TrendingUp size={11} style={{ color: NEON_COLOR }} /> Prestatie Trend
                  </p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={drilldownData.trendLine}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                        <Line type="monotone" dataKey="score" stroke={NEON_COLOR} strokeWidth={2.5} dot={{ r: 4, fill: NEON_COLOR }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
              <Card>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                  <BarChart2 size={11} style={{ color: NEON_COLOR }} /> Team vs Club Gemiddelde
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={drilldownData.radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar name="Team" dataKey="team" stroke={NEON_COLOR} fill={NEON_COLOR} fillOpacity={0.35} />
                      <Radar name="Club" dataKey="club" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </motion.div>

        ) : section === 'overzicht' ? (
          /* ── Overzicht ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Top stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { icon: Building2, label: 'Teams', value: String(teams.length), color: NEON_COLOR },
                { icon: Users, label: 'Spelers', value: String(allPlayers.length), color: NEON_COLOR },
                { icon: Trophy, label: 'Club Score', value: clubStats.avgScore > 0 ? String(clubStats.avgScore) : '—', color: scoreColor(clubStats.avgScore) },
                { icon: CalendarCheck, label: 'Aanwezigheid', value: clubStats.avgAtt !== null ? `${Math.round(clubStats.avgAtt)}%` : '—', color: clubStats.avgAtt !== null ? pctColor(clubStats.avgAtt) : '#6b7280' },
              ] as const).map(({ icon: Icon, label, value, color }) => (
                <Card key={label} className="text-center py-4">
                  <Icon size={16} className="mx-auto mb-1.5" style={{ color }} />
                  <div className="text-2xl font-black" style={{ color }}>{value}</div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mt-0.5">{label}</div>
                </Card>
              ))}
            </div>

            {/* Team cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black">Teams</h2>
                {teams.length > 0 && <span className="text-xs text-gray-500">Klik voor details →</span>}
              </div>

              {teams.length === 0 ? (
                <Card>
                  <div className="text-center py-12 text-gray-500">
                    <Users size={36} className="mx-auto mb-3 text-gray-700" />
                    <p className="font-medium">Nog geen teams gekoppeld.</p>
                    <p className="text-xs mt-1">Deel je Club ID met coaches bij registratie.</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teams.map((team, idx) => {
                    const score = toScore(team.avgScore);
                    return (
                      <motion.div key={team.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                        <button onClick={() => setSelectedTeamId(team.id)} className="w-full text-left group">
                          <Card className="hover:border-gray-600 transition-all cursor-pointer group-hover:bg-gray-800/60 h-full">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="min-w-0">
                                <h3 className="font-bold text-white truncate group-hover:text-[--neon-color] transition-colors">{team.team_name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{team.team_class} · {team.players.length} spelers</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-2xl font-black" style={{ color: scoreColor(score) }}>{score}</div>
                                <TrendBadge trend={team.trend} delta={team.trendDelta} />
                              </div>
                            </div>
                            <div className="space-y-2.5">
                              {team.attendanceRate !== null && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><CalendarCheck size={9} /> Aanwezigheid</span>
                                    <span className="text-[10px] font-bold" style={{ color: pctColor(team.attendanceRate) }}>{Math.round(team.attendanceRate)}%</span>
                                  </div>
                                  <StatBar value={team.attendanceRate} color={pctColor(team.attendanceRate)} />
                                </div>
                              )}
                              {team.hwRate !== null && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><ClipboardList size={9} /> Huiswerk</span>
                                    <span className="text-[10px] font-bold" style={{ color: pctColor(team.hwRate) }}>{Math.round(team.hwRate)}%</span>
                                  </div>
                                  <StatBar value={team.hwRate} color={pctColor(team.hwRate)} />
                                </div>
                              )}
                              {team.attendanceRate === null && team.hwRate === null && (
                                <p className="text-[10px] text-gray-700 italic">Nog geen aanwezigheid of huiswerk geregistreerd.</p>
                              )}
                            </div>
                          </Card>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Club skill radar */}
            {allPlayers.length > 0 && (
              <Card>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                  <BarChart2 size={11} style={{ color: NEON_COLOR }} /> Club Skill Profiel — gemiddeld alle teams
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={clubRadarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar name="Club" dataKey="value" stroke={NEON_COLOR} fill={NEON_COLOR} fillOpacity={0.45} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Invite card */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${NEON_COLOR}15` }}>
                  <Shield size={16} style={{ color: NEON_COLOR }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">Coaches uitnodigen</h3>
                  <p className="text-xs text-gray-400 mb-3">Deel je Club ID zodat coaches hun team aan deze club koppelen bij registratie.</p>
                  <button onClick={handleCopyClubId} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors text-sm">
                    <span className="font-mono font-bold text-white">{userData.clubId}</span>
                    {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

        ) : section === 'spelers' ? (
          /* ── Spelers ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            <Card>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                <Star size={11} style={{ color: NEON_COLOR }} /> Top Performers
              </p>
              {topPerformers.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">Nog geen evaluaties beschikbaar.</p>
              ) : (
                <div className="space-y-2">
                  {topPerformers.map(({ player, team, score }, idx) => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40">
                      <span className={`text-sm font-black w-5 text-center shrink-0 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {idx + 1}
                      </span>
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{team.team_name}{player.position ? ` · ${player.position}` : ''}</p>
                      </div>
                      <div className="text-xl font-black shrink-0" style={{ color: scoreColor(score) }}>{score}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {mostImproved.length > 0 && (
              <Card>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                  <TrendingUp size={11} style={{ color: NEON_COLOR }} /> Meeste Groei
                </p>
                <div className="space-y-2">
                  {mostImproved.map(({ player, team, delta, score }) => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40">
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{team.team_name}</p>
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: NEON_COLOR }}>
                        +{Math.round(delta * 10)} pnt
                      </span>
                      <div className="text-base font-black shrink-0 text-gray-400">{score}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {needAttention.length > 0 && (
              <Card>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                  <AlertTriangle size={11} className="text-yellow-400" /> Aandacht Nodig
                </p>
                <div className="space-y-2">
                  {needAttention.map(({ player, team, score }) => (
                    <div key={player.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/40">
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{team.team_name}</p>
                      </div>
                      <div className="text-xl font-black shrink-0" style={{ color: scoreColor(score) }}>{score}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>

        ) : section === 'trainers' ? (
          /* ── Trainers ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-lg font-black">Trainers</h2>
              <p className="text-sm text-gray-500 mt-0.5">Overzicht en communicatie met gekoppelde coaches.</p>
            </div>
            <TrainersTab
              clubId={userData.clubId!}
              clubName={clubName}
              senderEmail={senderEmail}
              teams={teams}
            />
          </motion.div>

        ) : (
          /* ── Signalen ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-black mb-1">Signalen</h2>
              <p className="text-sm text-gray-500">Teams die aandacht verdienen.</p>
            </div>
            {signals.length === 0 ? (
              <Card>
                <div className="text-center py-14">
                  <CheckCircle2 size={36} className="mx-auto mb-3 text-green-400" />
                  <p className="text-white font-bold">Alles ziet er goed uit!</p>
                  <p className="text-sm text-gray-500 mt-1">Geen signalen gevonden.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {signals.map((s, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <button onClick={() => { setSelectedTeamId(s.teamId); }} className="w-full text-left">
                      <Card className="hover:border-yellow-900/60 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-yellow-500/10 shrink-0">
                            <AlertTriangle size={16} className="text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{s.teamName}</p>
                            <p className="text-xs text-gray-400">{s.message}</p>
                          </div>
                          <ChevronLeft size={14} className="text-gray-600 rotate-180 shrink-0" />
                        </div>
                      </Card>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Mobile bottom nav */}
      {!selectedTeam && (
        <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-30" style={{ background: 'rgba(9,11,15,0.97)', backdropFilter: 'blur(20px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex">
            {SECTIONS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative active:opacity-70 transition-opacity"
                style={{ color: section === id ? NEON_COLOR : '#6b7280' }}
              >
                <Icon size={19} />
                <span className="text-[9px] font-bold tracking-wider uppercase">{label}</span>
                {badge ? (
                  <span className="absolute top-1.5 right-1/4 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">{badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default ClubAdminDashboard;
