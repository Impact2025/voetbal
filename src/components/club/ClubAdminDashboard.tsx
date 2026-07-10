import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Trophy, Copy, CheckCircle2, LogOut, Building2, Shield,
  TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronDown, CalendarCheck,
  ClipboardList, BarChart2, AlertTriangle, Star, Loader2,
  LayoutDashboard, UserSquare, Bell, UserCog, BookOpen, MessageSquare, Heart, Download,
  GitCompareArrows, Lock, X as XIcon,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR, skillKeys, SKILL_GROUPS } from '../../utils/constants';
import { copyToClipboard } from '../../utils/clipboard';
import { fetchClubSubscriptionTier } from '../../lib/trainingLibrary';
import Card from '../ui/Card';
import ParentLinkModal from '../parent/ParentLinkModal';
import TrainersTab from './TrainersTab';
import ClubTrainingTab from './ClubTrainingTab';
import TeamManagementTab from './TeamManagementTab';
import MessagingInbox from '../messaging/MessagingInbox';
import { usePWA } from '../../lib/usePWA';
import InstallModal from '../modals/InstallModal';
import PlayerDetailModal from './PlayerDetailModal';
import ComparePlayersModal from './ComparePlayersModal';
import ProGate from '../ui/ProGate';
import type { UserData, Player } from '../../types';

const ACCENT = '#16A34A';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlayerRow = Player;

export interface AttendanceRow {
  player_id: string;
  team_id: string;
  session_date: string;
  present: boolean;
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

type SectionId = 'overzicht' | 'spelers' | 'signalen' | 'trainers' | 'teams' | 'trainingen' | 'berichten';

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
  score >= 70 ? '#16A34A' : score >= 55 ? '#7c3aed' : score >= 40 ? '#d97706' : '#dc2626';

const pctColor = (pct: number) =>
  pct >= 80 ? '#16A34A' : pct >= 60 ? '#7c3aed' : pct >= 40 ? '#d97706' : '#dc2626';

// Leidt een leeftijdscategorie (bv. "O12") af uit de KNVB-teamnaam (bv. "JO12-2").
// Groepeert op de categorie waarin het team uitkomt, niet op de eigen leeftijd van de speler —
// zo blijft een speler die in een hogere categorie speelt zichtbaar bij die categorie.
const deriveAgeCategory = (teamClass: string): string => {
  const match = (teamClass || '').match(/(?:JO|O)?\s*(\d{1,2})/i);
  if (match) return `O${match[1]}`;
  return teamClass?.trim() || 'Overig';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5">
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
  if (trend === 'new') return <span className="text-[10px] text-gray-400">nieuw</span>;
  if (trend === 'up') return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: ACCENT }}>
      <TrendingUp size={10} />+{Math.abs(Math.round(delta * 10))}
    </span>
  );
  if (trend === 'down') return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
      <TrendingDown size={10} />-{Math.abs(Math.round(delta * 10))}
    </span>
  );
  return <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Minus size={10} />stabiel</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ClubAdminDashboard = ({ userData, onLogout }: ClubAdminDashboardProps) => {
  const [clubName, setClubName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [teams, setTeams] = useState<TeamEnriched[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [section, setSection] = useState<SectionId>('overzicht');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [parentLinkTarget, setParentLinkTarget] = useState<{ id: string; teamId: string; name: string } | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [expandedAges, setExpandedAges] = useState<Set<string>>(new Set());
  const [isPro, setIsPro] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareProGate, setShowCompareProGate] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const { canInstall, showInstallPrompt } = usePWA();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setSenderEmail(user.email);
    });
  }, []);

  useEffect(() => {
    if (!userData.clubId) return;
    void fetchClubSubscriptionTier(userData.clubId).then(tier => setIsPro(tier === 'pro'));
  }, [userData.clubId]);

  const loadClubData = useCallback(async () => {
    if (!userData.clubId) return;
    setLoading(true);
    try {
      const [{ data: club }, { data: rawTeams }] = await Promise.all([
        supabase.from('clubs').select('name').eq('id', userData.clubId).single(),
        supabase.from('teams').select('*').eq('club_id', userData.clubId).is('archived_at', null),
      ]);
        if (club) setClubName(club.name);
        if (!rawTeams?.length) { setLoading(false); return; }

        const teamIds = rawTeams.map((t: { id: string }) => t.id);
        const [{ data: playersData }, { data: attendanceData }] = await Promise.all([
          supabase.from('players').select('*').in('team_id', teamIds),
          supabase.from('attendance').select('player_id,team_id,session_date,present').in('team_id', teamIds),
        ]);

        const players = (playersData || []) as PlayerRow[];
        const attendance = (attendanceData || []) as AttendanceRow[];
        setAllPlayers(players);
        setAttendanceRecords(attendance);

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
  }, [userData.clubId]);

  useEffect(() => { void loadClubData(); }, [loadClubData]);

  const clubStats = useMemo(() => {
    const tw = teams.filter(t => t.players.length > 0);
    const avgScore = tw.length ? toScore(tw.reduce((s, t) => s + t.avgScore, 0) / tw.length) : 0;
    const at = teams.filter(t => t.attendanceRate !== null);
    const avgAtt = at.length ? at.reduce((s, t) => s + t.attendanceRate!, 0) / at.length : null;
    const hw = teams.filter(t => t.hwRate !== null);
    const avgHw = hw.length ? hw.reduce((s, t) => s + t.hwRate!, 0) / hw.length : null;
    return { avgScore, avgAtt, avgHw };
  }, [teams]);

  const clubRadarData = useMemo(() => SKILL_GROUPS.map(group => {
    const avg = group.skills.reduce((sum, s) => {
      const keyAvg = allPlayers.length
        ? allPlayers.reduce((ps, p) => {
            const team = teams.find(t => t.id === p.team_id);
            const period = team?.evaluation_periods.at(-1) ?? 'Check-in 1';
            return ps + (p.evaluations?.[period]?.skills?.[s.key] ?? 5);
          }, 0) / allPlayers.length
        : 5;
      return sum + keyAvg;
    }, 0) / group.skills.length;
    return { subject: group.label, value: +avg.toFixed(1), fullMark: 10 };
  }), [allPlayers, teams]);

  const playersByAge = useMemo(() => {
    const groups = new Map<string, { catNum: number | null; rows: { player: PlayerRow; team: TeamEnriched; score: number }[] }>();
    allPlayers.forEach(p => {
      const team = teams.find(t => t.id === p.team_id);
      if (!team) return;
      const score = toScore(calcSkillAvg(p, team.evaluation_periods.at(-1)!));
      const category = deriveAgeCategory(team.team_class);
      if (!groups.has(category)) {
        const m = category.match(/^O(\d{1,2})$/);
        groups.set(category, { catNum: m ? Number(m[1]) : null, rows: [] });
      }
      groups.get(category)!.rows.push({ player: p, team, score });
    });
    return [...groups.entries()]
      .sort(([catA, a], [catB, b]) => {
        if (a.catNum !== null && b.catNum !== null) return a.catNum - b.catNum;
        if (a.catNum !== null) return -1;
        if (b.catNum !== null) return 1;
        return catA.localeCompare(catB);
      })
      .map(([category, { catNum, rows }]) => ({
        category,
        catNum,
        rows: rows.sort((a, b) => b.score - a.score),
        avgScore: Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length),
      }));
  }, [allPlayers, teams]);

  const toggleAgeGroup = (category: string) => {
    setExpandedAges(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  };

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
    { id: 'overzicht',  label: 'Overzicht',  icon: LayoutDashboard },
    { id: 'spelers',    label: 'Spelers',    icon: UserSquare },
    { id: 'trainingen', label: 'Trainingen', icon: BookOpen },
    { id: 'trainers',   label: 'Trainers',   icon: UserCog },
    { id: 'teams',      label: 'Teams',      icon: Shield },
  ];

  const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null;

  const detailPlayer = detailPlayerId ? allPlayers.find(p => p.id === detailPlayerId) ?? null : null;
  const detailTeam = detailPlayer ? teams.find(t => t.id === detailPlayer.team_id) ?? null : null;

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

    const radarData = SKILL_GROUPS.map(group => {
      const teamAvg = group.skills.reduce((sum, s) => {
        const a = selectedTeam.players.length
          ? selectedTeam.players.reduce((ps, p) => ps + (p.evaluations?.[latestPeriod]?.skills?.[s.key] ?? 5), 0) / selectedTeam.players.length
          : 5;
        return sum + a;
      }, 0) / group.skills.length;
      const clubAvg = group.skills.reduce((sum, s) => {
        const a = allPlayers.length
          ? allPlayers.reduce((ps, p) => {
              const t = teams.find(t2 => t2.id === p.team_id);
              const period = t?.evaluation_periods.at(-1) ?? 'Check-in 1';
              return ps + (p.evaluations?.[period]?.skills?.[s.key] ?? 5);
            }, 0) / allPlayers.length
          : 5;
        return sum + a;
      }, 0) / group.skills.length;
      return { subject: group.label, team: +teamAvg.toFixed(1), club: +clubAvg.toFixed(1) };
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

  const handleToggleCompareMode = () => {
    if (!isPro) { setShowCompareProGate(true); return; }
    setCompareMode(m => !m);
    setCompareIds([]);
  };

  const handlePlayerRowClick = (playerId: string) => {
    if (!compareMode) { setDetailPlayerId(playerId); return; }
    setCompareIds(prev => {
      if (prev.includes(playerId)) return prev.filter(id => id !== playerId);
      if (prev.length >= 3) { toast.error('Je kunt maximaal 3 spelers vergelijken.'); return prev; }
      return [...prev, playerId];
    });
  };

  const compareEntries = compareIds
    .map(id => {
      const player = allPlayers.find(p => p.id === id);
      const team = player ? teams.find(t => t.id === player.team_id) : null;
      return player && team ? { player, team } : null;
    })
    .filter(Boolean) as { player: Player; team: TeamEnriched }[];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#fff', color: '#111827', border: '1px solid #e5e7eb' }, success: { iconTheme: { primary: ACCENT, secondary: '#fff' } } }} />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 size={18} style={{ color: ACCENT }} className="shrink-0" />
            <h1 className="text-lg font-black tracking-wide truncate text-gray-900">
              {clubName || 'Club Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleCopyClubId} className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
              <span className="text-gray-500">Club ID:</span>
              <span className="font-mono font-bold text-gray-900">{userData.clubId}</span>
              {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} className="text-gray-400" />}
            </button>
            <button
              onClick={() => setSection('berichten')}
              title="Berichten"
              className="relative flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 text-xs font-bold"
            >
              <MessageSquare size={14} /> <span className="hidden sm:inline">Berichten</span>
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">
                  {unreadMessages}
                </span>
              )}
            </button>
            <button
              onClick={() => setSection('signalen')}
              title="Signalen"
              className="relative flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 text-xs font-bold"
            >
              <Bell size={14} /> <span className="hidden sm:inline">Signalen</span>
              {signals.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">
                  {signals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => canInstall ? showInstallPrompt() : setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs font-bold border transition-colors"
              style={{ borderColor: `${ACCENT}40`, color: ACCENT, backgroundColor: `${ACCENT}10` }}
            >
              <Download size={14} /> <span className="hidden sm:inline">App</span>
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); onLogout(); }} className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-red-50 transition-colors text-red-500">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <InstallModal
        open={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        role="club_admin"
      />

      {/* Desktop section tabs */}
      {!selectedTeam && (
        <nav className="hidden sm:block border-b border-gray-100 bg-white px-4">
          <div className="max-w-5xl mx-auto flex">
            {SECTIONS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                  section === id ? 'border-green-700 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'
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
            <Loader2 className="animate-spin h-10 w-10" style={{ color: ACCENT }} />
            <p className="text-gray-500 text-sm">Club data laden...</p>
          </div>

        ) : selectedTeam && drilldownData ? (
          /* ── Team drill-down ── */
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <button onClick={() => setSelectedTeamId(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronLeft size={16} /> Terug naar overzicht
            </button>

            {/* Team header card */}
            <Card light>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#f0fdf4' }}>
                  <Users size={24} style={{ color: ACCENT }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black truncate text-gray-900">{selectedTeam.team_name}</h2>
                  <p className="text-sm text-gray-500">{selectedTeam.team_class} · {selectedTeam.players.length} spelers</p>
                </div>
                <div className="flex gap-5 flex-wrap shrink-0">
                  <div className="text-center">
                    <div className="text-2xl font-black" style={{ color: scoreColor(toScore(selectedTeam.avgScore)) }}>{toScore(selectedTeam.avgScore)}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">score</div>
                  </div>
                  {selectedTeam.attendanceRate !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-black" style={{ color: pctColor(selectedTeam.attendanceRate) }}>{Math.round(selectedTeam.attendanceRate)}%</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">aanwezig</div>
                    </div>
                  )}
                  {selectedTeam.hwRate !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-black" style={{ color: pctColor(selectedTeam.hwRate) }}>{Math.round(selectedTeam.hwRate)}%</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">huiswerk</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="flex justify-center pt-1"><TrendBadge trend={selectedTeam.trend} delta={selectedTeam.trendDelta} /></div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">trend</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Player list */}
            <Card light>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
                Spelers — {selectedTeam.evaluation_periods.at(-1)}
              </p>
              <div className="space-y-2">
                {drilldownData.playerRows.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Geen spelers in dit team.</p>
                )}
                {drilldownData.playerRows.map(({ player, score }, idx) => (
                  <div
                    key={player.id}
                    onClick={() => setDetailPlayerId(player.id)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <span className={`text-xs font-black w-5 text-center shrink-0 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                      {idx + 1}
                    </span>
                    <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{player.name}</p>
                      <p className="text-[10px] text-gray-400">{player.position || '—'}{player.age ? ` · ${player.age}jr` : ''}</p>
                    </div>
                    <div className="text-xl font-black shrink-0" style={{ color: scoreColor(score) }}>{score}</div>
                    <button
                      onClick={e => { e.stopPropagation(); setParentLinkTarget({ id: player.id, teamId: player.team_id, name: player.name }); }}
                      title="Ouder koppelen"
                      className="shrink-0 p-1.5 rounded-lg hover:bg-green-100 text-gray-300 hover:text-green-600 transition-colors"
                    >
                      <Heart size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {drilldownData.trendLine.length > 1 && (
                <Card light>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                    <TrendingUp size={11} style={{ color: ACCENT }} /> Prestatie Trend
                  </p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={drilldownData.trendLine}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} stroke="#9ca3af" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' }} />
                        <Line type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2.5} dot={{ r: 4, fill: ACCENT }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
              <Card light>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                  <BarChart2 size={11} style={{ color: ACCENT }} /> Team vs Club Gemiddelde
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={drilldownData.radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 9 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar name="Team" dataKey="team" stroke={ACCENT} fill={ACCENT} fillOpacity={0.25} />
                      <Radar name="Club" dataKey="club" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.10} />
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
                { icon: Building2, label: 'Teams', value: String(teams.length), color: ACCENT },
                { icon: Users, label: 'Spelers', value: String(allPlayers.length), color: ACCENT },
                { icon: Trophy, label: 'Club Score', value: clubStats.avgScore > 0 ? String(clubStats.avgScore) : '—', color: scoreColor(clubStats.avgScore) },
                { icon: CalendarCheck, label: 'Aanwezigheid', value: clubStats.avgAtt !== null ? `${Math.round(clubStats.avgAtt)}%` : '—', color: clubStats.avgAtt !== null ? pctColor(clubStats.avgAtt) : '#9ca3af' },
              ] as const).map(({ icon: Icon, label, value, color }) => (
                <Card key={label} light className="text-center py-4">
                  <Icon size={16} className="mx-auto mb-1.5" style={{ color }} />
                  <div className="text-2xl font-black" style={{ color }}>{value}</div>
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{label}</div>
                </Card>
              ))}
            </div>

            {/* Club skill radar */}
            {allPlayers.length > 0 && (
              <Card light>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                  <BarChart2 size={11} style={{ color: ACCENT }} /> Club Skill Profiel — gemiddeld alle teams
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={clubRadarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar name="Club" dataKey="value" stroke={ACCENT} fill={ACCENT} fillOpacity={0.30} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Team cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-gray-900">Teams</h2>
                {teams.length > 0 && <span className="text-xs text-gray-400">Klik voor details →</span>}
              </div>

              {teams.length === 0 ? (
                <Card light>
                  <div className="text-center py-12 text-gray-400">
                    <Users size={36} className="mx-auto mb-3 text-gray-300" />
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
                          <Card light className="hover:border-gray-300 transition-all cursor-pointer group-hover:bg-gray-50 h-full">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors">{team.team_name}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{team.team_class} · {team.players.length} spelers</p>
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
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><CalendarCheck size={9} /> Aanwezigheid</span>
                                    <span className="text-[10px] font-bold" style={{ color: pctColor(team.attendanceRate) }}>{Math.round(team.attendanceRate)}%</span>
                                  </div>
                                  <StatBar value={team.attendanceRate} color={pctColor(team.attendanceRate)} />
                                </div>
                              )}
                              {team.hwRate !== null && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><ClipboardList size={9} /> Huiswerk</span>
                                    <span className="text-[10px] font-bold" style={{ color: pctColor(team.hwRate) }}>{Math.round(team.hwRate)}%</span>
                                  </div>
                                  <StatBar value={team.hwRate} color={pctColor(team.hwRate)} />
                                </div>
                              )}
                              {team.attendanceRate === null && team.hwRate === null && (
                                <p className="text-[10px] text-gray-300 italic">Nog geen aanwezigheid of huiswerk geregistreerd.</p>
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

            {/* Invite card */}
            <Card light>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: '#f0fdf4' }}>
                  <Shield size={16} style={{ color: ACCENT }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900 mb-1">Coaches uitnodigen</h3>
                  <p className="text-xs text-gray-500 mb-3">Deel je Club ID zodat coaches hun team aan deze club koppelen bij registratie.</p>
                  <button onClick={handleCopyClubId} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-sm">
                    <span className="font-mono font-bold text-gray-900">{userData.clubId}</span>
                    {copied ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

        ) : section === 'spelers' ? (
          /* ── Spelers ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Spelers</h2>
                {compareMode && <p className="text-xs text-gray-500 mt-0.5">Selecteer 2 of 3 spelers om te vergelijken.</p>}
              </div>
              <button
                onClick={handleToggleCompareMode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors"
                style={compareMode
                  ? { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT }
                  : { borderColor: `${ACCENT}40`, color: ACCENT, backgroundColor: `${ACCENT}10` }}
              >
                {compareMode ? <XIcon size={13} /> : isPro ? <GitCompareArrows size={13} /> : <Lock size={13} />}
                {compareMode ? 'Annuleren' : 'Vergelijk spelers'}
              </button>
            </div>

            <Card light>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                <Users size={11} style={{ color: ACCENT }} /> Spelers per leeftijdscategorie
              </p>
              {playersByAge.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nog geen spelers.</p>
              ) : (
                <div className="space-y-2">
                  {playersByAge.map(({ category, catNum, rows, avgScore }) => {
                    const isOpen = expandedAges.has(category);
                    return (
                      <div key={category} className="rounded-xl bg-gray-50 overflow-hidden">
                        <button onClick={() => toggleAgeGroup(category)} className="w-full flex items-center gap-3 p-3 text-left">
                          <span className="text-sm font-black text-gray-900 shrink-0 w-16">{category}</span>
                          <span className="text-xs text-gray-400 flex-1">
                            {rows.length} speler{rows.length === 1 ? '' : 's'}
                          </span>
                          <span className="text-sm font-black shrink-0" style={{ color: scoreColor(avgScore) }}>{avgScore}</span>
                          <ChevronDown size={14} className={`text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 space-y-1.5">
                            {rows.map(({ player, team, score }) => {
                              const playerAgeNum = parseInt((player.age || '').trim(), 10);
                              const playsUp = catNum !== null && Number.isFinite(playerAgeNum) && playerAgeNum < catNum;
                              const isSelected = compareMode && compareIds.includes(player.id);
                              return (
                                <div
                                  key={player.id}
                                  onClick={() => handlePlayerRowClick(player.id)}
                                  className={`flex items-center gap-3 p-2 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                                >
                                  <img src={player.avatar_url} alt={player.name} className="w-7 h-7 rounded-full shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{player.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{team.team_name}{player.position ? ` · ${player.position}` : ''}</p>
                                  </div>
                                  {Number.isFinite(playerAgeNum) && (
                                    <span
                                      className="flex items-center gap-0.5 text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md"
                                      style={playsUp ? { color: ACCENT, backgroundColor: `${ACCENT}15` } : { color: '#9ca3af' }}
                                      title={playsUp ? 'Speelt boven zijn leeftijd' : undefined}
                                    >
                                      {playsUp && <TrendingUp size={10} />}{playerAgeNum} jr
                                    </span>
                                  )}
                                  <div className="text-base font-black shrink-0" style={{ color: scoreColor(score) }}>{score}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card light>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                <Star size={11} style={{ color: ACCENT }} /> Top Performers
              </p>
              {topPerformers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nog geen evaluaties beschikbaar.</p>
              ) : (
                <div className="space-y-2">
                  {topPerformers.map(({ player, team, score }, idx) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerRowClick(player.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${compareMode && compareIds.includes(player.id) ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                    >
                      <span className={`text-sm font-black w-5 text-center shrink-0 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                        {idx + 1}
                      </span>
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{player.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{team.team_name}{player.position ? ` · ${player.position}` : ''}</p>
                      </div>
                      <div className="text-xl font-black shrink-0" style={{ color: scoreColor(score) }}>{score}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {mostImproved.length > 0 && (
              <Card light>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                  <TrendingUp size={11} style={{ color: ACCENT }} /> Meeste Groei
                </p>
                <div className="space-y-2">
                  {mostImproved.map(({ player, team, delta, score }) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerRowClick(player.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${compareMode && compareIds.includes(player.id) ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                    >
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{player.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{team.team_name}</p>
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: ACCENT }}>
                        +{Math.round(delta * 10)} pnt
                      </span>
                      <div className="text-base font-black shrink-0 text-gray-400">{score}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {needAttention.length > 0 && (
              <Card light>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                  <AlertTriangle size={11} className="text-yellow-500" /> Aandacht Nodig
                </p>
                <div className="space-y-2">
                  {needAttention.map(({ player, team, score }) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerRowClick(player.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${compareMode && compareIds.includes(player.id) ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                    >
                      <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{player.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{team.team_name}</p>
                      </div>
                      <div className="text-xl font-black shrink-0" style={{ color: scoreColor(score) }}>{score}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>

        ) : section === 'trainingen' ? (
          /* ── Trainingen ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-lg font-black text-gray-900">Seizoensprogramma</h2>
              <p className="text-sm text-gray-500 mt-0.5">Beheer het KNVB-jaarprogramma per leeftijdscategorie.</p>
            </div>
            <ClubTrainingTab clubId={userData.clubId!} isSuperAdmin={userData.role === 'superadmin'} />
          </motion.div>

        ) : section === 'trainers' ? (
          /* ── Trainers ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-lg font-black text-gray-900">Trainers</h2>
              <p className="text-sm text-gray-500 mt-0.5">Overzicht en communicatie met gekoppelde coaches.</p>
            </div>
            <TrainersTab
              clubId={userData.clubId!}
              clubName={clubName}
              senderEmail={senderEmail}
              teams={teams}
            />
          </motion.div>

        ) : section === 'teams' ? (
          /* ── Teams & Coaches ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-lg font-black text-gray-900">Teams &amp; Coaches</h2>
              <p className="text-sm text-gray-500 mt-0.5">Maak teams aan en wijs coaches (incl. assistenten) toe.</p>
            </div>
            <TeamManagementTab
              clubId={userData.clubId!}
              clubName={clubName}
              senderEmail={senderEmail}
              isSuperAdmin={userData.role === 'superadmin'}
              onTeamsChanged={() => void loadClubData()}
              onViewStats={setSelectedTeamId}
            />
          </motion.div>

        ) : section === 'berichten' ? (
          /* ── Berichten ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-lg font-black text-gray-900">Berichten</h2>
              <p className="text-sm text-gray-500 mt-0.5">Communiceer direct met trainers en ouders via de app.</p>
            </div>
            <MessagingInbox
              currentUserId={userData.uid}
              currentUserName={clubName || 'Club Admin'}
              currentUserRole="club_admin"
              clubId={userData.clubId}
              onUnreadChange={setUnreadMessages}
            />
          </motion.div>

        ) : (
          /* ── Signalen ── */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-1">Signalen</h2>
              <p className="text-sm text-gray-500">Teams die aandacht verdienen.</p>
            </div>
            {signals.length === 0 ? (
              <Card light>
                <div className="text-center py-14">
                  <CheckCircle2 size={36} className="mx-auto mb-3 text-green-600" />
                  <p className="text-gray-900 font-bold">Alles ziet er goed uit!</p>
                  <p className="text-sm text-gray-500 mt-1">Geen signalen gevonden.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {signals.map((s, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <button onClick={() => { setSelectedTeamId(s.teamId); }} className="w-full text-left">
                      <Card light className="hover:border-yellow-200 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-yellow-50 shrink-0">
                            <AlertTriangle size={16} className="text-yellow-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">{s.teamName}</p>
                            <p className="text-xs text-gray-500">{s.message}</p>
                          </div>
                          <ChevronLeft size={14} className="text-gray-300 rotate-180 shrink-0" />
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

      {/* Compare floating bar */}
      <AnimatePresence>
        {compareMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 sm:bottom-4 left-0 right-0 z-40 flex justify-center px-4"
          >
            <div className="bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex -space-x-2">
                {compareEntries.map(e => (
                  <img key={e.player.id} src={e.player.avatar_url} alt={e.player.name} className="w-8 h-8 rounded-full border-2 border-white" />
                ))}
                {compareIds.length === 0 && <span className="text-xs text-gray-400">Nog geen spelers geselecteerd</span>}
              </div>
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={compareIds.length < 2}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: ACCENT }}
              >
                Vergelijk ({compareIds.length}/3)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      {!selectedTeam && (
        <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-30" style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid #e5e7eb', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex">
            {SECTIONS.map(({ id, label, icon: Icon, badge }) => {
              const isActive = section === id;
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative active:opacity-60 transition-opacity"
                  style={{ color: isActive ? ACCENT : '#9ca3af' }}
                >
                  {isActive && (
                    <span className="absolute top-0 left-5 right-5 h-[2px] rounded-b-full" style={{ background: ACCENT }} />
                  )}
                  <Icon size={20} />
                  <span className="text-[9px] font-bold tracking-wide uppercase">{label}</span>
                  {badge ? (
                    <span className="absolute top-1.5 right-1/4 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">{badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <ParentLinkModal
        isVisible={!!parentLinkTarget}
        onClose={() => setParentLinkTarget(null)}
        playerId={parentLinkTarget?.id ?? ''}
        teamId={parentLinkTarget?.teamId ?? ''}
        playerName={parentLinkTarget?.name ?? ''}
      />

      <PlayerDetailModal
        isVisible={!!detailPlayerId}
        onClose={() => setDetailPlayerId(null)}
        player={detailPlayer}
        team={detailTeam}
        attendanceRecords={attendanceRecords}
        onLinkParent={target => { setDetailPlayerId(null); setParentLinkTarget(target); }}
      />

      <ComparePlayersModal
        isVisible={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        entries={compareEntries}
        attendanceRecords={attendanceRecords}
      />

      <AnimatePresence>
        {showCompareProGate && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCompareProGate(false)}
          >
            <motion.div
              className="max-w-sm w-full"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <ProGate
                feature="Speler Vergelijker"
                description="Vergelijk 2 of 3 spelers naast elkaar op score, aanwezigheid, huiswerk en skill-profiel."
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClubAdminDashboard;
