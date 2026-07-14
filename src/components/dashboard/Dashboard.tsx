import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { Player, Team, CustomHomework, UserData, SessionUser, AttendanceRecord, HomeworkSubmission, ChallengeCompletion, WeekChallengeCompletion, Streak, SeasonWeekPlan } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, User, LogOut, ShieldCheck, UserSquare, ClipboardList, CheckCircle2, ListPlus, Wand2, Loader2, FileText, Copy, Settings2, TrendingUp, LayoutDashboard, Target, CalendarCheck, Download, Trophy, Link2, Flame, BookOpen, Zap, MessageSquare, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callAI } from '../../lib/ai';
import { generateIndividualPlan } from '../../lib/trainingAI';
import { NEON_COLOR, COACH_COLOR, skillKeys, SKILL_GROUPS, DEFAULT_EVALUATION_PERIODS, DEFAULT_WEEKLY_QUESTIONS, createInitialEvaluations, makeEvaluation } from '../../utils/constants';
import { copyToClipboard } from '../../utils/clipboard';
import { hashPin } from '../../utils/crypto';
import type { TeamSession } from '../../types';
import Card from '../ui/Card';
import ToolButton from '../ui/ToolButton';
import Slider from '../ui/Slider';
import SkillRater from '../ui/SkillRater';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import ConfirmModal from '../modals/ConfirmModal';
import AttendanceCard from '../attendance/AttendanceCard';
import TrainingPlanCard from '../training/TrainingPlanCard';
const HomeworkCreatorModal = lazy(() => import('../modals/HomeworkCreatorModal'));
const AddPlayerModal = lazy(() => import('../modals/AddPlayerModal'));
const PlayerProfileModal = lazy(() => import('../modals/PlayerProfileModal'));
const CoachProfileModal = lazy(() => import('../modals/CoachProfileModal'));
const TestsModal = lazy(() => import('../modals/TestsModal'));
const AttendanceModal = lazy(() => import('../modals/AttendanceModal'));
const TeamSessionModal = lazy(() => import('../training/TeamSessionModal'));
const ParentLinkModal  = lazy(() => import('../parent/ParentLinkModal'));
import PlayerHomeworkCard from '../players/PlayerHomeworkCard';
import TestResultsCard from '../evaluation/TestResultsCard';
import TeamOverview from './TeamOverview';
import CoachCharts from './CoachCharts';
import PlayerOverview from './PlayerOverview';
import PlayersDashboard from './PlayersDashboard';
import CoachWeekAgenda from './CoachWeekAgenda';
import TodayScreen from './TodayScreen';
import QuestionPager from './QuestionPager';
import PlayerCard from '../card/PlayerCard';
import TierUpModal from '../feedback/TierUpModal';
import StreakWidget from '../streak/StreakWidget';
import ChallengeLibrary from '../challenges/ChallengeLibrary';
import TeamChallengeCard from '../challenges/TeamChallengeCard';
import TeamChallengeSetter from '../challenges/TeamChallengeSetter';
import { CHALLENGES } from '../../data/challenges';
import OnboardingTour from '../OnboardingTour';
import ProGate from '../ui/ProGate';
const SeasonTrainingView = lazy(() => import('../training/SeasonTrainingView'));
const MessagingInbox = lazy(() => import('../messaging/MessagingInbox'));
const TeamChatLazy = lazy(() => import('../chat/TeamChat'));
const PlayerNotificationsInbox = lazy(() => import('../notifications/PlayerNotificationsInbox'));
import PushNotificationSender from '../notifications/PushNotificationSender';
import InstallModal from '../modals/InstallModal';
import { usePWA } from '../../lib/usePWA';
import { type AvatarConfig, type PlayerStats as AvatarStats } from '../../lib/avatar/catalog';
import { insertStatEvents, insertChallengeEvents, fetchAndRecomputeStats } from '../../lib/stats';
import { getOrCreateStreak, incrementStreak } from '../../lib/streaks';
import { getActiveTeamChallenge } from '../../lib/teamChallenge';
import { ageToAgeGroup, fetchCurrentWeekChallenge } from '../../lib/trainingLibrary';
import type { PlayerStats, CardTier, TeamChallenge } from '../../types';

interface DashboardProps {
  user: SessionUser;
  userData: UserData;
  onPlayerLogout: () => void;
}

const COACH_SECTIONS = [
  { id: 'overzicht',  label: 'Overzicht',  icon: LayoutDashboard },
  { id: 'spelers',    label: 'Spelers',    icon: UserSquare },
  { id: 'trainingen', label: 'Trainingen', icon: Target },
  { id: 'huiswerk',   label: 'Huiswerk',   icon: ClipboardList },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
] as const;

const PLAYER_SECTIONS = [
  { id: 'vandaag',  label: 'Vandaag',     icon: Flame },
  { id: 'kaart',    label: 'Mijn Kaart',  icon: Trophy },
  { id: 'ik',       label: 'Ik',          icon: User },
] as const;

const Dashboard = ({ user, userData, onPlayerLogout }: DashboardProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [customHomework, setCustomHomework] = useState<CustomHomework[]>([]);
  const [teamData, setTeamData] = useState<Partial<Team>>({});
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_EVALUATION_PERIODS[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isAttendanceVisible, setIsAttendanceVisible] = useState(false);
  const [isHomeworkVisible, setIsHomeworkVisible] = useState(false);
  const [isTestsVisible, setIsTestsVisible] = useState(false);
  const [confirmAssign, setConfirmAssign] = useState<{ isVisible: boolean; homeworkIds: string[] | null }>({ isVisible: false, homeworkIds: null });
  const [confirmRemove, setConfirmRemove] = useState<{ isVisible: boolean; playerId: string | null }>({ isVisible: false, playerId: null });
  const [isGenerating, setIsGenerating] = useState({ plan: false, comments: false });
  const [generatingPlanForPlayer, setGeneratingPlanForPlayer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [parentLinkTarget, setParentLinkTarget] = useState<Player | null>(null);
  const [isCoachProfileVisible, setIsCoachProfileVisible] = useState(false);
  const [isTeamSessionModalVisible, setIsTeamSessionModalVisible] = useState(false);
  const [teamSessions, setTeamSessions] = useState<TeamSession[]>(() => {
    try {
      const raw = localStorage.getItem(`team_sessions_${userData.teamId}`);
      return raw ? (JSON.parse(raw) as TeamSession[]) : [];
    } catch { return []; }
  });
  const [questionDrafts, setQuestionDrafts] = useState(['', '', '']);
  const [responseDrafts, setResponseDrafts] = useState(['', '', '']);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [savingResponses, setSavingResponses] = useState(false);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [pendingTierUp, setPendingTierUp] = useState<CardTier | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [teamChallenge, setTeamChallenge] = useState<TeamChallenge | null>(null);
  const [challengeCompletions, setChallengeCompletions] = useState<ChallengeCompletion[]>([]);
  const [teamChallengeCompletions, setTeamChallengeCompletions] = useState<ChallengeCompletion[]>([]);
  const [weekChallenge, setWeekChallenge] = useState<SeasonWeekPlan | null>(null);
  const [weekChallengeCompletions, setWeekChallengeCompletions] = useState<WeekChallengeCompletion[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [mobileSection, setMobileSection] = useState(() => userData.role === 'player' ? 'vandaag' : 'overzicht');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { canInstall, showInstallPrompt } = usePWA();
  const [isClubPro, setIsClubPro] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadPlayerNotifications, setUnreadPlayerNotifications] = useState(0);
  // Eigen schrijfacties zetten dit venster; realtime-events daarbinnen worden genegeerd
  // zodat een fetchData() de nog niet doorgekomen update niet terugdraait.
  const suppressRealtimeUntilRef = useRef(0);
  const pendingEvalRef = useRef<{ playerId: string; evaluations: Player['evaluations']; snapshot: Player['evaluations'] } | null>(null);
  const evalSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userData.teamId) return;

    const fetchData = async () => {
      const [
        { data: playersData },
        { data: teamRecord },
        { data: homeworkData },
        { data: attendanceData },
        { data: submissionsData },
        { data: teamCompletionsData },
      ] = await Promise.all([
        supabase.from('players').select('*').eq('team_id', userData.teamId),
        supabase.from('teams').select('*').eq('id', userData.teamId).single(),
        supabase.from('custom_homework').select('*').eq('team_id', userData.teamId),
        supabase.from('attendance').select('*').eq('team_id', userData.teamId),
        supabase.from('homework_submissions').select('*').eq('team_id', userData.teamId).order('created_at', { ascending: false }),
        supabase.from('challenge_completions').select('*').eq('team_id', userData.teamId).order('completed_at', { ascending: false }),
      ]);

      setSubmissions((submissionsData || []) as HomeworkSubmission[]);
      setTeamChallengeCompletions((teamCompletionsData || []) as ChallengeCompletion[]);

      const normalizedPlayers = (playersData || []).map(player => ({
        ...player,
        weekly_question_responses: Array.from({ length: 3 }, (_, idx) => player.weekly_question_responses?.[idx] || ''),
      }));

      const baseQuestions = Array.isArray(teamRecord?.weekly_questions) && teamRecord.weekly_questions.length > 0
        ? teamRecord.weekly_questions
        : DEFAULT_WEEKLY_QUESTIONS;
      const basePeriods = Array.isArray(teamRecord?.evaluation_periods) && teamRecord.evaluation_periods.length > 0
        ? teamRecord.evaluation_periods
        : DEFAULT_EVALUATION_PERIODS;
      const normalizedTeam = teamRecord
        ? { ...teamRecord, weekly_questions: Array.from({ length: 3 }, (_, idx) => baseQuestions[idx] || ''), evaluation_periods: basePeriods }
        : { weekly_questions: DEFAULT_WEEKLY_QUESTIONS.slice(), evaluation_periods: DEFAULT_EVALUATION_PERIODS.slice() };

      setPlayers(normalizedPlayers);
      setTeamData(normalizedTeam);
      setCustomHomework(homeworkData || []);
      getActiveTeamChallenge(userData.teamId!).then(c => setTeamChallenge(c)).catch(() => {});
      setAttendanceRecords((attendanceData || []) as AttendanceRecord[]);

      // Set default activeTab from team's periods
      const periods = Array.isArray(teamRecord?.evaluation_periods) && teamRecord.evaluation_periods.length > 0
        ? teamRecord.evaluation_periods
        : DEFAULT_EVALUATION_PERIODS;
      setActiveTab(prev => (periods.includes(prev) ? prev : periods[0]));

      if (userData.role === 'player') {
        setActivePlayerId(user.id);
      }
      // Coach/club_admin: geen auto-selectie — start op het spelers-overzicht
      // (PlayersDashboard). De coach klikt zelf een speler om diens dashboard te openen.
      setDataLoaded(true);
    };

    setFetchError(false);
    setDataLoaded(false);
    fetchData().catch(err => { console.error('fetchData fout:', err); setFetchError(true); setDataLoaded(true); });

    supabase.channel(`public:players:team_id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        if (Date.now() < suppressRealtimeUntilRef.current) return;
        fetchData();
      })
      .subscribe();

    supabase.channel(`public:teams:id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, payload => setTeamData(payload.new))
      .subscribe();

    supabase.channel(`public:custom_homework:team_id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_homework' }, () => fetchData())
      .subscribe();

    supabase.channel(`public:attendance:team_id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData())
      .subscribe();

    supabase.channel(`public:homework_submissions:team_id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework_submissions' }, payload => {
        if (payload.eventType === 'INSERT') {
          setSubmissions(prev => [payload.new as HomeworkSubmission, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setSubmissions(prev => prev.map(s => s.id === (payload.new as HomeworkSubmission).id ? payload.new as HomeworkSubmission : s));
        }
      })
      .subscribe();

    // Realtime voor stat_events (XP updates live)
    supabase.channel(`public:stat_events:team_id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stat_events' }, () => {
        // Herbereken stats voor alle spelers — 1 query, geen race condition
        setDataLoaded(false);
        fetchData().catch(() => setDataLoaded(true));
      })
      .subscribe();

    // Realtime voor challenge_completions (team challenge voortgang + coach-overzicht live)
    if (userData.role !== 'player') {
      supabase.channel(`public:challenge_completions:team_id=eq.${userData.teamId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_completions' }, payload => {
          getActiveTeamChallenge(userData.teamId!).then(setTeamChallenge);
          if (payload.eventType === 'INSERT') {
            setTeamChallengeCompletions(prev => [payload.new as ChallengeCompletion, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTeamChallengeCompletions(prev => prev.map(c => c.id === (payload.new as ChallengeCompletion).id ? payload.new as ChallengeCompletion : c));
          }
        })
        .subscribe();
    }

    return () => supabase.removeAllChannels();
  }, [userData, user.id]);

  // Load club PRO status — voor spelers komt club_id pas binnen via teamData, niet via userData
  const clubId = userData.clubId ?? teamData.club_id;
  useEffect(() => {
    if (!clubId) return;
    supabase.from('clubs').select('subscription_tier').eq('id', clubId).single()
      .then(({ data }) => setIsClubPro(data?.subscription_tier === 'pro'))
      .catch(() => {/* clubs table may not have this column yet */});
  }, [clubId]);

  // Load player stats, streak en challenge completions for the player role
  useEffect(() => {
    if (userData.role !== 'player' || !userData.teamId) return;
    const pid = user.id;
    const tid = userData.teamId;

    Promise.allSettled([
      fetchAndRecomputeStats(pid, tid),
      getOrCreateStreak(pid),
      supabase.from('challenge_completions').select('*').eq('player_id', pid),
      supabase.from('week_challenge_completions').select('*').eq('player_id', pid),
      getActiveTeamChallenge(tid),
    ]).then(([statsResult, streakResult, completionsResult, weekCompletionsResult, challengeResult]) => {
      if (statsResult.status === 'fulfilled' && statsResult.value) setPlayerStats(statsResult.value);
      if (streakResult.status === 'fulfilled' && streakResult.value) setStreak(streakResult.value);
      if (completionsResult.status === 'fulfilled' && completionsResult.value.data) {
        setChallengeCompletions(completionsResult.value.data as ChallengeCompletion[]);
      }
      if (weekCompletionsResult.status === 'fulfilled' && weekCompletionsResult.value.data) {
        setWeekChallengeCompletions(weekCompletionsResult.value.data as WeekChallengeCompletion[]);
      }
      if (challengeResult.status === 'fulfilled') setTeamChallenge(challengeResult.value);
    }).catch(() => {/* silently skip if tables not migrated yet */});
  }, [userData.role, userData.teamId, user.id]);

  const teamPeriods = useMemo(
    () => Array.isArray(teamData.evaluation_periods) && teamData.evaluation_periods.length > 0
      ? teamData.evaluation_periods
      : DEFAULT_EVALUATION_PERIODS,
    [teamData.evaluation_periods]
  );

  const activePlayer = useMemo(() => {
    if (userData.role === 'player') return players.find(p => p.id === user.id);
    return players.find(p => p.id === activePlayerId);
  }, [players, activePlayerId, user.id, userData.role]);

  // Avatar-stats + opslaan (alleen relevant voor de speler-zelfweergave)
  const avatarStats = useMemo<AvatarStats | undefined>(() => {
    if (userData.role !== 'player' || !activePlayer) return undefined;
    const mine = attendanceRecords.filter(a => a.player_id === activePlayer.id).slice(0, 20);
    const present = mine.filter(a => a.present).length;
    const evals = Object.values(activePlayer.evaluations ?? {});
    const lastSkills = evals.length ? evals[evals.length - 1]?.skills : undefined;
    const avgSkill = lastSkills
      ? skillKeys.reduce((s, k) => s + (lastSkills[k] ?? 0), 0) / skillKeys.length
      : 0;
    return {
      attendanceCount: mine.length,
      presentCount: present,
      attendancePct: mine.length ? Math.round((present / mine.length) * 100) : null,
      avgSkill,
      homeworkDone: activePlayer.completed_homework_ids?.length ?? 0,
    };
  }, [userData.role, activePlayer, attendanceRecords]);

  const handleSaveAvatar = async (config: AvatarConfig) => {
    await supabase.from('players').update({ avatar_config: config }).eq('id', user.id);
    setPlayers(prev => prev.map(p => p.id === user.id ? { ...p, avatar_config: config } : p));
  };

  // Basis-weekchallenge (gratis, uit het seizoensprogramma van deze week) voor de speler
  useEffect(() => {
    if (userData.role !== 'player' || !activePlayer || !clubId) { setWeekChallenge(null); return; }
    const ageGroup = ageToAgeGroup(activePlayer.age);
    fetchCurrentWeekChallenge(clubId, ageGroup)
      .then(setWeekChallenge)
      .catch(() => setWeekChallenge(null));
  }, [userData.role, activePlayer, clubId]);

  const activeWeekChallengeText = useMemo(() => {
    if (!weekChallenge?.challenge) return null;
    const alreadyDone = weekChallengeCompletions.some(c => c.week_plan_id === weekChallenge.id);
    return alreadyDone ? null : weekChallenge.challenge;
  }, [weekChallenge, weekChallengeCompletions]);

  const focusedHomeworkId = useMemo(() => {
    if (!activePlayer) return undefined;
    const assigned = customHomework.filter(hw => (teamData.assigned_homework_ids || []).includes(hw.id));
    return assigned.find(hw => !activePlayer.completed_homework_ids?.includes(hw.id))?.id;
  }, [customHomework, teamData.assigned_homework_ids, activePlayer]);

  const normalizedQuestions = useMemo(
    () => Array.from({ length: 3 }, (_, idx) => teamData?.weekly_questions?.[idx] || ''),
    [teamData?.weekly_questions]
  );
  const visibleQuestions = useMemo(
    () => normalizedQuestions.map((text, idx) => ({ text, idx })).filter(({ text }) => text.trim()),
    [normalizedQuestions]
  );

  useEffect(() => { setQuestionDrafts(normalizedQuestions); }, [normalizedQuestions]);

  const normalizedResponses = useMemo(
    () => Array.from({ length: 3 }, (_, idx) => activePlayer?.weekly_question_responses?.[idx] || ''),
    [activePlayer?.weekly_question_responses]
  );
  useEffect(() => { setResponseDrafts(normalizedResponses); }, [normalizedResponses]);

  const handleAddPlayer = async (playerName) => {
    const plainPin = Math.floor(100000 + Math.random() * 900000).toString();

    const newPlayer = {
      name: playerName,
      team_id: userData.teamId,
      age: '',
      preferred_foot: 'Rechts',
      position: '',
      pin_hash: 'pending', // placeholder; replaced immediately after insert
      avatar_url: `https://placehold.co/128x128/1A1A1A/FFFFFF?text=${playerName.substring(0, 2).toUpperCase()}`,
      evaluations: createInitialEvaluations(),
      completed_homework_ids: [],
      weekly_question_responses: ['', '', ''],
    };

    const withTimeout = <T,>(p: Promise<T>, ms: number, msg: string): Promise<T> =>
      Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

    const { data, error } = await withTimeout(
      supabase.from('players').insert(newPlayer).select().single(),
      30000,
      'Server reageert niet. Controleer je verbinding en probeer opnieuw.'
    );
    if (error) throw new Error(error.message || 'Aanmaken mislukt. Controleer je verbinding.');
    if (!data) throw new Error('Geen toegang. Controleer of je ingelogd bent als coach.');

    // Hash PIN with player ID as salt now that we have the ID
    const pinHash = await hashPin(plainPin, data.id);
    const { error: updateError } = await supabase.from('players').update({ pin_hash: pinHash }).eq('id', data.id);
    if (updateError) throw new Error('Speler aangemaakt maar pincode niet opgeslagen. Probeer opnieuw in te loggen.');

    setPlayers(prev => [...prev, {
      ...newPlayer,
      id: data.id,
      weekly_question_responses: ['', '', ''],
    }]);

    return { id: data.id, pin: plainPin };
  };

  const handleSaveProfile = async (playerId, profileData) => {
    await supabase.from('players').update(profileData).eq('id', playerId);
  };

  const handleResetPin = async (playerId: string): Promise<string> => {
    const plainPin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = await hashPin(plainPin, playerId);
    const { error } = await supabase.from('players').update({ pin_hash: pinHash }).eq('id', playerId);
    if (error) throw error;
    localStorage.removeItem('rememberedPin');
    return plainPin;
  };

  const handleSaveCoachProfile = async (coachProfileData) => {
    await supabase.from('teams').update(coachProfileData).eq('id', userData.teamId);
    setTeamData(prev => ({ ...prev, ...coachProfileData }));
  };

  const handleSaveTeamQuestions = async () => {
    const normalized = Array.from({ length: 3 }, (_, idx) => (questionDrafts[idx] || '').trim());
    setSavingQuestions(true);
    try {
      const { error } = await supabase.from('teams').update({ weekly_questions: normalized }).eq('id', userData.teamId);
      if (error) throw error;
      setTeamData(prev => ({ ...prev, weekly_questions: normalized }));
      const emptyResponses = normalized.map(() => '');
      const { error: playersError } = await supabase.from('players').update({ weekly_question_responses: emptyResponses }).eq('team_id', userData.teamId);
      if (!playersError) {
        setPlayers(prev => prev.map(player => ({ ...player, weekly_question_responses: emptyResponses.slice() })));
        toast.success('Vragen opgeslagen en gedeeld met het team.');
      } else {
        toast('Vragen opgeslagen, maar antwoorden konden niet worden gereset.', { icon: '⚠️' });
      }
    } catch (err) {
      console.error('Error saving team questions:', err);
      toast.error('Opslaan van vragen is mislukt.');
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleSaveQuestionResponses = async () => {
    if (!activePlayer) return;
    const normalized = responseDrafts.map(answer => answer.trim());
    setSavingResponses(true);
    try {
      const { error } = await supabase.from('players').update({ weekly_question_responses: normalized }).eq('id', activePlayer.id);
      if (error) throw error;
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, weekly_question_responses: normalized } : p));
      setResponseDrafts(normalized);
      toast.success('Antwoorden opgeslagen.');
    } catch (err) {
      console.error('Error saving question responses:', err);
      toast.error('Opslaan van antwoorden is mislukt.');
    } finally {
      setSavingResponses(false);
    }
  };

  const flushEvaluationSave = useCallback(async () => {
    const pending = pendingEvalRef.current;
    if (!pending) return;
    pendingEvalRef.current = null;
    if (evalSaveTimerRef.current) { clearTimeout(evalSaveTimerRef.current); evalSaveTimerRef.current = null; }

    suppressRealtimeUntilRef.current = Date.now() + 3000;

    // .select() is essentieel: bij een RLS-blokkade geeft Supabase géén error terug,
    // maar 0 geraakte rijen. Zonder deze check lijkt opslaan te lukken en springt de
    // waarde bij de eerstvolgende fetch stilletjes terug.
    const { data, error } = await supabase
      .from('players')
      .update({ evaluations: pending.evaluations })
      .eq('id', pending.playerId)
      .select('id');

    if (error || !data?.length) {
      suppressRealtimeUntilRef.current = 0;
      console.error('Error updating evaluation:', error ?? 'update raakte 0 rijen (RLS?)');
      toast.error('Opslaan mislukt: ' + (error?.message ?? 'je hebt geen rechten om deze speler te bewerken'));
      setPlayers(prev => prev.map(p => p.id === pending.playerId ? { ...p, evaluations: pending.snapshot } : p));
    }
  }, []);

  const handleUpdateEvaluation = (field: string, value: unknown) => {
    if (userData.role === 'player' || !activePlayer) return;

    const playerId = activePlayer.id;
    // Wissel van speler? Eerst het openstaande werk van de vorige speler wegschrijven.
    if (pendingEvalRef.current && pendingEvalRef.current.playerId !== playerId) flushEvaluationSave();

    const pending = pendingEvalRef.current?.playerId === playerId ? pendingEvalRef.current : null;
    const base = pending?.evaluations ?? activePlayer.evaluations ?? {};
    const snapshot = pending?.snapshot ?? activePlayer.evaluations ?? {};

    const newEvaluations = JSON.parse(JSON.stringify(base));
    if (!newEvaluations[activeTab]) newEvaluations[activeTab] = makeEvaluation();

    const path = field.split('.');
    let currentLevel = newEvaluations[activeTab];
    for (let i = 0; i < path.length - 1; i++) {
      if (!currentLevel[path[i]]) currentLevel[path[i]] = {};
      currentLevel = currentLevel[path[i]];
    }
    currentLevel[path[path.length - 1]] = value;

    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, evaluations: newEvaluations } : p));

    // Slepen aan een slider vuurt tientallen wijzigingen; bundel ze tot één write.
    pendingEvalRef.current = { playerId, evaluations: newEvaluations, snapshot };
    suppressRealtimeUntilRef.current = Date.now() + 3000;
    if (evalSaveTimerRef.current) clearTimeout(evalSaveTimerRef.current);
    evalSaveTimerRef.current = setTimeout(flushEvaluationSave, 400);
  };

  useEffect(() => () => { flushEvaluationSave(); }, [flushEvaluationSave]);

  const handleSaveHomework = async (newHomework) => {
    await supabase.from('custom_homework').insert({ ...newHomework, team_id: userData.teamId });
  };

  const handleAssignHomework = (homeworkIds) => setConfirmAssign({ isVisible: true, homeworkIds });

  const executeAssignHomework = async () => {
    const { homeworkIds } = confirmAssign;
    if (!homeworkIds) return;
    await supabase.from('teams').update({ assigned_homework_ids: homeworkIds }).eq('id', userData.teamId);
    for (const player of players) {
      const newCompletedIds = player.completed_homework_ids.filter(id => homeworkIds.includes(id));
      await supabase.from('players').update({ completed_homework_ids: newCompletedIds }).eq('id', player.id);
    }
    setConfirmAssign({ isVisible: false, homeworkIds: null });
    setIsHomeworkVisible(false);
  };

  const handleToggleHomeworkAssignment = async (hwId: string) => {
    const current = teamData.assigned_homework_ids || [];
    const isAssigned = current.includes(hwId);
    const newIds = isAssigned ? current.filter(id => id !== hwId) : [...current, hwId];
    const { error } = await supabase.from('teams').update({ assigned_homework_ids: newIds }).eq('id', userData.teamId);
    if (!error) {
      setTeamData(prev => ({ ...prev, assigned_homework_ids: newIds }));
      toast.success(isAssigned ? 'Huiswerk ingetrokken.' : 'Huiswerk toegewezen aan het team.');
    }
  };

  const handleToggleSubmissionReview = async (submission: HomeworkSubmission) => {
    const coach_reviewed = !submission.coach_reviewed;
    setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, coach_reviewed } : s));
    await supabase.from('homework_submissions').update({ coach_reviewed }).eq('id', submission.id);
  };

  const handleToggleChallengeReview = async (completion: ChallengeCompletion) => {
    const coach_reviewed = !completion.coach_reviewed;
    setTeamChallengeCompletions(prev => prev.map(c => c.id === completion.id ? { ...c, coach_reviewed } : c));
    await supabase.from('challenge_completions').update({ coach_reviewed }).eq('id', completion.id);
  };

  const handleSubmissionComplete = async (submission: HomeworkSubmission) => {
    setSubmissions(prev => {
      const idx = prev.findIndex(s => s.id === submission.id);
      if (idx !== -1) return prev.map(s => s.id === submission.id ? submission : s);
      return [submission, ...prev];
    });

    if (userData.role !== 'player' || !userData.teamId || !activePlayer) return;

    const hwId = submission.homework_id;
    const isAlreadyDone = activePlayer.completed_homework_ids.includes(hwId);

    if (!isAlreadyDone) {
      // Markeer huiswerk automatisch als voltooid na video + AI feedback
      const newCompletedIds = [...activePlayer.completed_homework_ids, hwId];
      await supabase.from('players').update({ completed_homework_ids: newCompletedIds }).eq('id', user.id);
      setPlayers(prev => prev.map(p => p.id === user.id ? { ...p, completed_homework_ids: newCompletedIds } : p));

      // Award XP + streak (zelfde logica als handleToggleHomeworkStatus)
      const oldTier = playerStats?.tier ?? 'brons';
      await Promise.all([
        insertStatEvents(user.id, userData.teamId, 'homework_done', { homework_id: hwId }),
        insertStatEvents(user.id, userData.teamId, 'video_submitted', { homework_id: hwId }),
        incrementStreak(user.id).then(s => { if (s) setStreak(s); }),
      ]);
      const updated = await fetchAndRecomputeStats(user.id, userData.teamId);
      if (updated) {
        setPlayerStats(updated);
        if (updated.tier !== oldTier) setPendingTierUp(updated.tier);
      }
    }
  };

  const handleChallengeComplete = async (challengeId: string, reflection: string, videoUrl?: string, videoAIFeedback?: string): Promise<string | null> => {
    if (!userData.teamId || !activePlayer) return null;

    // Zoek de challenge op voor de category
    const { CHALLENGES } = await import('../../data/challenges');
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return null;

    const oldTier = playerStats?.tier ?? 'brons';

    // Sla completion op in DB met video data
    const { data: completion } = await supabase
      .from('challenge_completions')
      .insert({
        challenge_id: challengeId,
        player_id: user.id,
        team_id: userData.teamId,
        reflection: reflection || null,
        video_url: videoUrl || null,
        video_ai_feedback: videoAIFeedback || null,
      })
      .select()
      .single();

    if (completion) {
      setChallengeCompletions(prev => [...prev, completion as ChallengeCompletion]);
    }

    await Promise.all([
      insertChallengeEvents(user.id, userData.teamId, challenge.category, challengeId),
      incrementStreak(user.id).then(s => { if (s) setStreak(s); }),
    ]);

    const updated = await fetchAndRecomputeStats(user.id, userData.teamId);
    if (updated) {
      setPlayerStats(updated);
      if (updated.tier !== oldTier) setPendingTierUp(updated.tier);
    }

    return completion?.id ?? null;
  };

  const handleCompleteWeekChallenge = async () => {
    if (!userData.teamId || !activePlayer || !weekChallenge) return;
    if (weekChallengeCompletions.some(c => c.week_plan_id === weekChallenge.id)) return;

    const oldTier = playerStats?.tier ?? 'brons';

    const { data: completion } = await supabase
      .from('week_challenge_completions')
      .insert({ week_plan_id: weekChallenge.id, player_id: user.id, team_id: userData.teamId })
      .select()
      .single();

    if (completion) {
      setWeekChallengeCompletions(prev => [...prev, completion as WeekChallengeCompletion]);
    }

    await Promise.all([
      insertStatEvents(user.id, userData.teamId, 'challenge_done', { week_plan_id: weekChallenge.id }),
      incrementStreak(user.id).then(s => { if (s) setStreak(s); }),
    ]);

    const updated = await fetchAndRecomputeStats(user.id, userData.teamId);
    if (updated) {
      setPlayerStats(updated);
      if (updated.tier !== oldTier) setPendingTierUp(updated.tier);
    }
  };

  const handleRemovePlayer = (id) => setConfirmRemove({ isVisible: true, playerId: id });

  const executeRemovePlayer = async () => {
    const { playerId } = confirmRemove;
    if (!playerId) return;
    await supabase.from('players').delete().eq('id', playerId);
    setPlayers(prev => {
      const remaining = prev.filter(p => p.id !== playerId);
      if (activePlayerId === playerId) setActivePlayerId(remaining[0]?.id ?? null);
      return remaining;
    });
    setConfirmRemove({ isVisible: false, playerId: null });
  };

  const handleCopyTeamId = () => {
    void copyToClipboard(userData.teamId ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateComments = async () => {
    if (!activePlayer) return;
    setIsGenerating(prev => ({ ...prev, comments: true }));
    const currentEval = activePlayer.evaluations[activeTab];
    const sortedSkills = Object.entries(currentEval.skills).sort(([, a], [, b]) => b - a);
    const topSkills = sortedSkills.slice(0, 2).map(s => s[0]).join(', ');
    const bottomSkills = sortedSkills.slice(-2).map(s => s[0]).join(', ');
    const prompt = `Schrijf een korte, bemoedigende feedback-opmerking in het Nederlands voor een jonge voetballer (7-12 jaar). Het wedstrijdcijfer was ${currentEval.matchRating}/10. De beste skills zijn: ${topSkills}. De skills die verbetering nodig hebben zijn: ${bottomSkills}. Begin met een compliment over de sterke punten en geef dan op een vriendelijke en constructieve manier één tip voor een verbeterpunt. Houd het onder de 40 woorden.`;
    const result = await callAI(prompt);
    handleUpdateEvaluation('comments', result);
    setIsGenerating(prev => ({ ...prev, comments: false }));
  };

  const handleGeneratePlanForPlayer = async (player: Player) => {
    const currentEval = player.evaluations[activeTab];
    if (!currentEval) return;
    setGeneratingPlanForPlayer(player.id);
    try {
      const structuredPlan = await generateIndividualPlan(player, activeTab);
      const newEvaluations = JSON.parse(JSON.stringify(player.evaluations)) as typeof player.evaluations;
      if (structuredPlan) {
        newEvaluations[activeTab].structuredPlan = structuredPlan;
      } else {
        // Fallback to basic plan if structured generation fails
        const sortedSkills = Object.entries(currentEval.skills).sort(([, a], [, b]) => (b as number) - (a as number));
        const topSkills = sortedSkills.slice(0, 2).map(s => s[0]).join(', ');
        const bottomSkills = sortedSkills.slice(-2).map(s => s[0]).join(', ');
        const prompt = `Genereer een beknopt trainingsplan voor een jonge voetballer. Sterke punten: ${topSkills}. Verbeterpunten: ${bottomSkills}. Coach opmerkingen: "${currentEval.comments}". Geef 2-3 oefeningen met koppeltekens.`;
        newEvaluations[activeTab].trainingPlan = await callAI(prompt);
      }
      await supabase.from('players').update({ evaluations: newEvaluations }).eq('id', player.id);
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, evaluations: newEvaluations } : p));
      toast.success(`Plan voor ${player.name} gegenereerd.`);
    } catch (err) {
      console.error('Error generating plan:', err);
      toast.error('Plan genereren mislukt.');
    } finally {
      setGeneratingPlanForPlayer(null);
    }
  };

  const handleSaveTeamSession = (session: TeamSession) => {
    const updated = [session, ...teamSessions].slice(0, 15);
    setTeamSessions(updated);
    localStorage.setItem(`team_sessions_${userData.teamId}`, JSON.stringify(updated));
    toast.success('Teamsessie opgeslagen.');
  };

  if (!activePlayer && userData.role === 'player') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 text-gray-900">
        {fetchError ? (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verbinding mislukt</h2>
            <p className="text-gray-500 mb-6">Kan geen verbinding maken met de server. Controleer je internet en probeer opnieuw.</p>
            <button
              onClick={() => { setFetchError(false); window.location.reload(); }}
              className="px-6 py-2 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COACH_COLOR }}
            >
              Opnieuw proberen
            </button>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin h-12 w-12 mb-4" style={{ color: COACH_COLOR }} />
            <h2 className="text-2xl font-bold">Laden van spelerdata...</h2>
            <p className="text-gray-500">Een ogenblik geduld.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
      <OnboardingTour role={(userData.role === 'player' ? 'player' : 'coach')} />
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#fff', color: '#111827', border: '1px solid #e5e7eb' }, success: { iconTheme: { primary: COACH_COLOR, secondary: '#fff' } } }} />
      <AnimatePresence>
        {pendingTierUp && (
          <TierUpModal tier={pendingTierUp} onClose={() => setPendingTierUp(null)} />
        )}
      </AnimatePresence>
      <Suspense fallback={null}>
        <HomeworkCreatorModal isVisible={isHomeworkVisible} onClose={() => setIsHomeworkVisible(false)} onSave={handleSaveHomework} onAssign={handleAssignHomework} customHomework={customHomework} />
        <AddPlayerModal isVisible={isAddPlayerVisible} onClose={() => setIsAddPlayerVisible(false)} onAdd={handleAddPlayer} teamId={userData.teamId ?? ''} />
        <PlayerProfileModal isVisible={!!editingPlayer} onClose={() => setEditingPlayer(null)} player={editingPlayer} teamId={userData.teamId ?? ''} onSave={handleSaveProfile} onResetPin={handleResetPin} />
        <CoachProfileModal isVisible={isCoachProfileVisible} onClose={() => setIsCoachProfileVisible(false)} teamData={teamData} onSave={handleSaveCoachProfile} />
        <TestsModal isVisible={isTestsVisible} onClose={() => setIsTestsVisible(false)} player={activePlayer} period={activeTab} onUpdate={handleUpdateEvaluation} />
        <AttendanceModal isVisible={isAttendanceVisible} onClose={() => setIsAttendanceVisible(false)} players={players} teamId={userData.teamId ?? ''} onSaved={() => {}} />
        <TeamSessionModal isVisible={isTeamSessionModalVisible} teamId={userData.teamId ?? ''} onClose={() => setIsTeamSessionModalVisible(false)} onSave={handleSaveTeamSession} />
        <ParentLinkModal isVisible={!!parentLinkTarget} onClose={() => setParentLinkTarget(null)} playerId={parentLinkTarget?.id ?? ''} teamId={userData.teamId ?? ''} playerName={parentLinkTarget?.name ?? ''} />
      </Suspense>

      <ConfirmModal isVisible={confirmAssign.isVisible} onClose={() => setConfirmAssign({ isVisible: false, homeworkIds: null })} onConfirm={executeAssignHomework} title="Huiswerk Toewijzen">
        Weet je zeker dat je dit huiswerk wilt toewijzen? Dit vervangt de huidige opdracht voor het team.
      </ConfirmModal>
      <ConfirmModal isVisible={confirmRemove.isVisible} onClose={() => setConfirmRemove({ isVisible: false, playerId: null })} onConfirm={executeRemovePlayer} title="Speler Verwijderen">
        Weet je zeker dat je deze speler wilt verwijderen?
      </ConfirmModal>

      {/* ── COACH DASHBOARD ── */}
      {userData.role !== 'player' && (
        <div className="flex flex-col min-h-screen bg-white text-gray-900">

          {/* Sticky header */}
          <header className="sticky top-0 z-20 bg-white/98 backdrop-blur-md border-b border-gray-200 px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-lg shrink-0 object-cover" />
                <h1 className="text-lg font-black tracking-tight truncate text-gray-900">
                  {teamData.team_name || 'Mijn Team'}
                </h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyTeamId}
                  className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono font-bold text-gray-900">{userData.teamId}</span>
                  {copied ? <CheckCircle2 size={13} style={{ color: COACH_COLOR }} /> : <Copy size={13} className="text-gray-400" />}
                </button>
                <button
                  onClick={() => canInstall ? showInstallPrompt() : setShowInstallModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors"
                  style={{ borderColor: `${COACH_COLOR}40`, color: COACH_COLOR, backgroundColor: `${COACH_COLOR}10` }}
                >
                  <Download size={14} /> App
                </button>
                <button onClick={() => setMobileSection('berichten')} title="Berichten" className="relative p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500">
                  <MessageSquare size={16} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <button onClick={() => setIsCoachProfileVisible(true)} title="Instellingen" className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500">
                  <Settings2 size={16} />
                </button>
                <button onClick={async () => { await supabase.auth.signOut(); }} className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-red-50 transition-colors text-red-400">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Desktop section tabs */}
          <nav className="hidden sm:block border-b border-gray-200 bg-white px-4">
            <div className="max-w-6xl mx-auto flex">
              {COACH_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMobileSection(id)}
                  className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                    mobileSection === id
                      ? 'text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  style={mobileSection === id ? { borderColor: COACH_COLOR, color: '#111827' } : {}}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 px-4 py-5 max-w-6xl mx-auto w-full pb-28 sm:pb-10">

            {/* ── OVERZICHT ── */}
            {mobileSection === 'overzicht' && (
              <div className="space-y-5">
                <CoachWeekAgenda
                  clubId={userData.clubId}
                  isClubPro={isClubPro}
                  coachName={teamData.coach_name}
                  teamName={teamData.team_name}
                  onGoToTrainingen={() => setMobileSection('trainingen')}
                />
                {!dataLoaded ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-gray-300" />
                  </div>
                ) : (
                <TeamOverview
                  players={players}
                  teamData={teamData}
                  activeTab={activeTab}
                  onSelectPlayer={(id) => { setActivePlayerId(id); setMobileSection('spelers'); }}
                />
                )}
              </div>
            )}

            {/* ── SPELERS ── */}
            {mobileSection === 'spelers' && (
              <div className="space-y-4">

                {/* Geen speler geselecteerd → volledig spelers-dashboard */}
                {!activePlayer && (
                  <PlayersDashboard
                    players={players}
                    teamData={teamData}
                    activeTab={activeTab}
                    teamPeriods={teamPeriods}
                    attendanceRecords={attendanceRecords}
                    onSelectPlayer={(id) => setActivePlayerId(id)}
                    onAddPlayer={() => setIsAddPlayerVisible(true)}
                  />
                )}

                {activePlayer && (
                  <>
                    {/* Terug naar overzicht + snelle spelerswissel */}
                    <div className="flex items-center gap-2 -mb-1">
                      <button
                        onClick={() => setActivePlayerId(null)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm font-semibold"
                      >
                        <ChevronLeft size={15} /> Alle spelers
                      </button>
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {players.map(player => {
                          const isActive = activePlayerId === player.id;
                          return (
                            <button
                              key={player.id}
                              onClick={() => setActivePlayerId(player.id)}
                              className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border transition-all text-sm font-medium whitespace-nowrap ${
                                isActive
                                  ? 'border-green-500 bg-green-50 text-gray-900'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <img src={player.avatar_url} alt={player.name} className="w-6 h-6 rounded-full shrink-0" />
                              {player.name.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Player header */}
                    <Card light>
                      <div className="flex items-center gap-3">
                        <img src={activePlayer.avatar_url} alt={activePlayer.name} className="w-12 h-12 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-black truncate text-gray-900">{activePlayer.name}</h2>
                          <p className="text-xs text-gray-400">{activePlayer.position || 'Positie niet ingesteld'}{activePlayer.age ? ` · ${activePlayer.age} jaar` : ''}</p>
                        </div>
                        {/* Inline action buttons */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => setEditingPlayer(activePlayer)} title="Profiel bewerken" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <User size={15} />
                          </button>
                          <button onClick={() => setParentLinkTarget(activePlayer)} title="Ouder koppelen" className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                            <Link2 size={15} />
                          </button>
                          <button onClick={() => handleRemovePlayer(activePlayer.id)} title="Speler verwijderen" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={15} />
                          </button>
                          <div className="ml-2 text-right">
                            <div className="text-2xl font-black tabular-nums" style={{ color: COACH_COLOR }}>
                              {Math.round(skillKeys.reduce((s, k) => s + (activePlayer.evaluations[activeTab]?.skills[k] ?? 5), 0) / skillKeys.length * 10)}
                            </div>
                            <div className="text-[9px] text-gray-400 uppercase tracking-wide">score</div>
                          </div>
                        </div>
                      </div>

                      {/* Period tabs */}
                      <div className="flex items-center justify-between mt-4 border-b border-gray-100">
                        <div className="flex overflow-x-auto">
                          {teamPeriods.map(period => (
                            <button
                              key={period}
                              onClick={() => setActiveTab(period)}
                              className={`px-3 py-2.5 text-sm font-semibold relative transition-colors shrink-0 ${activeTab === period ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              {period}
                              {activeTab === period && (
                                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: COACH_COLOR }} layoutId="coachTab" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1.5 shrink-0 pb-1">
                          <ToolButton light onClick={() => setIsTestsVisible(true)}>
                            <FileText size={13} /> Testen
                          </ToolButton>
                          <ToolButton light onClick={async () => {
                            const { exportPlayerPdf } = await import('../../utils/pdfExport');
                            exportPlayerPdf(activePlayer, teamData.team_name || 'Team', teamPeriods);
                          }}>
                            <Download size={13} /> PDF
                          </ToolButton>
                        </div>
                      </div>

                      {/* Skills */}
                      <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-4 space-y-6">
                          {SKILL_GROUPS.map(group => (
                            <div key={group.key}>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: group.color }}>{group.label}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                {group.skills.map(skill => (
                                  <SkillRater
                                    key={skill.key}
                                    label={skill.label}
                                    value={activePlayer.evaluations[activeTab]?.skills[skill.key] ?? 5}
                                    onChange={v => handleUpdateEvaluation(`skills.${skill.key}`, v)}
                                    color={group.color}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="max-w-[200px]">
                            <Input
                              light
                              label="Wedstrijdcijfer (0–10)"
                              type="number"
                              value={activePlayer.evaluations[activeTab]?.matchRating || ''}
                              onChange={e => handleUpdateEvaluation('matchRating', parseFloat(e.target.value))}
                              disabled={false}
                            />
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </Card>

                    {/* Comments */}
                    <Card light>
                      <Textarea
                        light
                        label="Opmerkingen Coach"
                        placeholder="Sterke punten, verbeterpunten..."
                        value={activePlayer.evaluations[activeTab]?.comments || ''}
                        onChange={e => handleUpdateEvaluation('comments', e.target.value)}
                        disabled={false}
                      >
                        <button onClick={handleGenerateComments} disabled={isGenerating.comments} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50">
                          {isGenerating.comments ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} style={{ color: COACH_COLOR }} />}
                          Genereer
                        </button>
                      </Textarea>
                    </Card>
                    <CoachCharts
                      players={players}
                      activePlayer={activePlayer}
                      activeTab={activeTab}
                    />
                  </>
                )}
              </div>
            )}

            {/* ── HUISWERK + VRAGEN ── */}
            {mobileSection === 'huiswerk' && (
              <div className="space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Huiswerk</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{customHomework.length} opdracht{customHomework.length !== 1 ? 'en' : ''} aangemaakt</p>
                  </div>
                  {userData.role === 'club_admin' && (
                    <button
                      onClick={() => setIsHomeworkVisible(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: COACH_COLOR }}
                    >
                      <Plus size={15} /> Nieuw
                    </button>
                  )}
                </div>

                {/* Team completion */}
                {(teamData.assigned_homework_ids?.length || 0) > 0 && players.length > 0 && (
                  <Card light>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Voltooiing team</p>
                    <div className="space-y-3">
                      {players.map(p => {
                        const total = teamData.assigned_homework_ids?.length || 0;
                        const done = p.completed_homework_ids?.filter(id => teamData.assigned_homework_ids?.includes(id)).length || 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <div key={p.id} className="flex items-center gap-3">
                            <img src={p.avatar_url} className="w-7 h-7 rounded-full shrink-0" alt={p.name} />
                            <span className="text-sm flex-1 min-w-0 truncate text-gray-800 font-medium">{p.name}</span>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 shrink-0">
                              <motion.div
                                className="h-1.5 rounded-full"
                                style={{ backgroundColor: pct === 100 ? COACH_COLOR : '#94a3b8' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-semibold tabular-nums shrink-0 w-8 text-right">{done}/{total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Homework list */}
                {customHomework.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                    <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium mb-3">Nog geen huiswerk aangemaakt</p>
                    {userData.role === 'club_admin' && (
                      <button onClick={() => setIsHomeworkVisible(true)} className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: COACH_COLOR }}>
                        Eerste opdracht aanmaken
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customHomework.map(hw => {
                      const isAssigned = (teamData.assigned_homework_ids || []).includes(hw.id);
                      return (
                        <Card light key={hw.id} className={`transition-all ${isAssigned ? '!border-emerald-200 !bg-emerald-50/60' : ''}`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 truncate">{hw.title}</h4>
                                {isAssigned && (
                                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: COACH_COLOR }}>
                                    Actief
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 leading-relaxed">{hw.description}</p>
                              {hw.youtube_url && (
                                <a href={hw.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-medium">
                                  Video bekijken →
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => handleToggleHomeworkAssignment(hw.id)}
                              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                isAssigned
                                  ? 'bg-white text-red-500 border-red-200 hover:bg-red-50'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                              }`}
                            >
                              {isAssigned ? 'Intrekken' : 'Toewijzen'}
                            </button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Video inzendingen */}
                {submissions.length > 0 && (
                  <Card light>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <span style={{ color: COACH_COLOR }}>●</span> Video Inzendingen
                    </p>
                    <div className="space-y-3">
                      {submissions.slice(0, 20).map(sub => {
                        const submPlayer = players.find(p => p.id === sub.player_id);
                        const hw = customHomework.find(h => h.id === sub.homework_id);
                        if (!submPlayer || !hw) return null;
                        const statusColor = sub.feedback_status === 'done' ? COACH_COLOR : sub.feedback_status === 'error' ? '#dc2626' : '#64748b';
                        const statusLabel = sub.feedback_status === 'done' ? 'Klaar' : sub.feedback_status === 'error' ? 'Mislukt' : 'Bezig…';
                        return (
                          <details key={sub.id} className="group rounded-xl bg-gray-50 border border-gray-200 overflow-hidden">
                            <summary className="flex items-center gap-3 p-3 cursor-pointer list-none hover:bg-gray-100 transition-colors">
                              <img src={submPlayer.avatar_url} alt={submPlayer.name} className="w-8 h-8 rounded-full shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{submPlayer.name}</p>
                                <p className="text-xs text-gray-500 truncate">{hw.title}</p>
                              </div>
                              {sub.coach_reviewed && <CheckCircle2 size={15} className="shrink-0" style={{ color: COACH_COLOR }} />}
                              <span className="text-[10px] font-bold shrink-0" style={{ color: statusColor }}>{statusLabel}</span>
                            </summary>
                            <div className="px-3 pb-3 border-t border-gray-200 pt-3 space-y-2">
                              {sub.video_url && <video src={sub.video_url} controls playsInline className="w-full rounded-lg max-h-40 object-contain bg-black" />}
                              {sub.ai_feedback ? (
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{sub.ai_feedback}</p>
                              ) : (
                                <p className="text-xs text-gray-400 italic">{sub.feedback_status === 'processing' ? 'Feedback wordt gegenereerd…' : 'Geen feedback beschikbaar.'}</p>
                              )}
                              <div className="flex items-center justify-between pt-1">
                                <p className="text-[10px] text-gray-400">{new Date(sub.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                <button
                                  onClick={() => handleToggleSubmissionReview(sub)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    sub.coach_reviewed
                                      ? 'text-white'
                                      : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                                  }`}
                                  style={sub.coach_reviewed ? { backgroundColor: COACH_COLOR } : {}}
                                >
                                  <CheckCircle2 size={13} /> {sub.coach_reviewed ? 'Goedgekeurd' : 'Goedkeuren'}
                                </button>
                              </div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* ── REFLECTIEVRAGEN (onder huiswerk) ── */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <ListPlus size={11} /> Reflectievragen
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <Card light>
                  <p className="text-xs font-semibold text-gray-500 mb-3">Stel wekelijks maximaal 3 vragen aan je team.</p>
                  <div className="space-y-3">
                    {questionDrafts.map((value, idx) => (
                      <Textarea
                        key={`coach-question-${idx}`}
                        light
                        rows={2}
                        label={`Vraag ${idx + 1}`}
                        value={value}
                        onChange={e => {
                          const updated = [...questionDrafts];
                          updated[idx] = e.target.value;
                          setQuestionDrafts(updated);
                        }}
                        placeholder="Typ de vraag die je wilt stellen..."
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setQuestionDrafts(['', '', ''])} className="px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200">
                      Reset
                    </button>
                    <button
                      onClick={handleSaveTeamQuestions}
                      disabled={savingQuestions}
                      className="px-5 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: COACH_COLOR }}
                    >
                      {savingQuestions ? <Loader2 size={14} className="animate-spin" /> : null}
                      Opslaan & Delen
                    </button>
                  </div>
                </Card>

                {/* Antwoorden per speler */}
                {visibleQuestions.length > 0 && players.length > 0 && (
                  <Card light>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Antwoorden per speler</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-gray-100">
                      {players.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setActivePlayerId(p.id)}
                          className={`shrink-0 flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                            activePlayerId === p.id ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                          style={activePlayerId === p.id ? { backgroundColor: COACH_COLOR, borderColor: COACH_COLOR } : {}}
                        >
                          <img src={p.avatar_url} className="w-5 h-5 rounded-full shrink-0" alt={p.name} />
                          {p.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                    {activePlayer ? (
                      <div className="space-y-2.5">
                        {visibleQuestions.map(({ text, idx }) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Vraag {idx + 1}</p>
                            <p className="text-sm text-gray-800 font-semibold mb-2 leading-snug">{text}</p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {activePlayer.weekly_question_responses?.[idx]?.trim()
                                ? activePlayer.weekly_question_responses[idx]
                                : <span className="italic text-gray-400">Nog geen antwoord gegeven</span>
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">Selecteer een speler om antwoorden te bekijken.</p>
                    )}
                  </Card>
                )}
              </div>
            )}

            {/* ── CHALLENGES ── */}
            {mobileSection === 'challenges' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Challenges</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{teamChallengeCompletions.length} voltooiing{teamChallengeCompletions.length !== 1 ? 'en' : ''}</p>
                </div>

                {userData.teamId && userData.role === 'club_admin' && (
                  <TeamChallengeSetter
                    teamId={userData.teamId}
                    current={teamChallenge}
                    onChange={setTeamChallenge}
                    clubId={userData.clubId}
                  />
                )}

                {teamChallengeCompletions.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Trophy size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Nog geen challenges voltooid</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamChallengeCompletions.slice(0, 30).map(comp => {
                      const compPlayer = players.find(p => p.id === comp.player_id);
                      const challenge = CHALLENGES.find(c => c.id === comp.challenge_id);
                      if (!compPlayer || !challenge) return null;
                      return (
                        <details key={comp.id} className="group rounded-xl bg-gray-50 border border-gray-200 overflow-hidden">
                          <summary className="flex items-center gap-3 p-3 cursor-pointer list-none hover:bg-gray-100 transition-colors">
                            <img src={compPlayer.avatar_url} alt={compPlayer.name} className="w-8 h-8 rounded-full shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{compPlayer.name}</p>
                              <p className="text-xs text-gray-500 truncate">{challenge.title}</p>
                            </div>
                            {comp.coach_reviewed && <CheckCircle2 size={15} className="shrink-0" style={{ color: COACH_COLOR }} />}
                          </summary>
                          <div className="px-3 pb-3 border-t border-gray-200 pt-3 space-y-2">
                            {comp.video_url && <video src={comp.video_url} controls playsInline className="w-full rounded-lg max-h-40 object-contain bg-black" />}
                            {comp.reflection && (
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{comp.reflection}</p>
                            )}
                            <div className="flex items-center justify-between pt-1">
                              <p className="text-[10px] text-gray-400">{new Date(comp.completed_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                              <button
                                onClick={() => handleToggleChallengeReview(comp)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  comp.coach_reviewed
                                    ? 'text-white'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                                }`}
                                style={comp.coach_reviewed ? { backgroundColor: COACH_COLOR } : {}}
                              >
                                <CheckCircle2 size={13} /> {comp.coach_reviewed ? 'Goedgekeurd' : 'Goedkeuren'}
                              </button>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TRAININGEN + AANWEZIGHEID ── */}
            {mobileSection === 'trainingen' && (
              <div className="space-y-6">

                {/* Seizoensprogramma PRO */}
                {userData.clubId && (
                  isClubPro ? (
                    <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
                      <SeasonTrainingView clubId={userData.clubId} />
                    </Suspense>
                  ) : (
                    <ProGate
                      feature="Seizoensprogramma"
                      description="32 KNVB-trainingen per leeftijdscategorie, inclusief wekelijks huiswerk en challenges. Activeer PRO via je club-admin."
                    />
                  )
                )}

                {/* AI Plannen header */}
                <div className="flex items-start justify-between gap-3 flex-wrap pt-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={13} style={{ color: COACH_COLOR }} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Trainingsplannen</span>
                    </div>
                    <p className="text-sm text-gray-500">Individuele plannen per speler + teamsessies</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200">
                      {teamPeriods.map(p => (
                        <button
                          key={p}
                          onClick={() => setActiveTab(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {p.length > 8 ? p.substring(0, 8) + '…' : p}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsTeamSessionModalVisible(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: COACH_COLOR }}
                    >
                      <Wand2 size={13} /> Teamsessie
                    </button>
                  </div>
                </div>

                {/* Individual player plans */}
                {players.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Target size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Voeg spelers toe om trainingsplannen te maken.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {players.map(player => {
                      const structuredPlan = player.evaluations?.[activeTab]?.structuredPlan;
                      const legacyPlan = player.evaluations?.[activeTab]?.trainingPlan;
                      const isGeneratingThis = generatingPlanForPlayer === player.id;
                      return (
                        <Card light key={player.id}>
                          <div className="flex items-center gap-3 mb-4">
                            <img src={player.avatar_url} alt={player.name} className="w-10 h-10 rounded-full border border-gray-200 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 truncate">{player.name}</h4>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                {player.position || 'positie onbekend'} · {player.age ? `${player.age}jr` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => handleGeneratePlanForPlayer(player)}
                              disabled={!!generatingPlanForPlayer}
                              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: COACH_COLOR }}
                            >
                              {isGeneratingThis ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                              {isGeneratingThis ? 'Bezig...' : structuredPlan ? 'Vernieuwen' : 'Genereer'}
                            </button>
                          </div>
                          {structuredPlan ? (
                            <TrainingPlanCard plan={structuredPlan} playerName={player.name} period={activeTab} />
                          ) : legacyPlan ? (
                            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-100">{legacyPlan}</div>
                          ) : (
                            <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                              <Wand2 size={22} className="mx-auto mb-2 text-gray-300" />
                              <p className="text-xs text-gray-500">Klik Genereer voor een persoonlijk plan</p>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Saved team sessions */}
                {teamSessions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Opgeslagen Teamsessies</p>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {teamSessions.map(session => (
                        <Card light key={session.id}>
                          <div className="flex items-center gap-2 mb-3">
                            <Target size={13} style={{ color: COACH_COLOR }} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Teamsessie</span>
                            <span className="text-[10px] text-gray-500 ml-auto">
                              {new Date(session.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <TrainingPlanCard plan={session.plan} />
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── AANWEZIGHEID (onder trainingen) ── */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <CalendarCheck size={11} /> Aanwezigheid
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Registreer trainingen en wedstrijden</p>
                  <button
                    onClick={() => setIsAttendanceVisible(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: COACH_COLOR }}
                  >
                    <Plus size={15} /> Sessie
                  </button>
                </div>
                <AttendanceCard players={players} records={attendanceRecords} />
              </div>
            )}

            {/* ── BERICHTEN ── */}
            {mobileSection === 'berichten' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Berichten</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Communiceer met club admin, ouders en stuur push berichten naar spelers.</p>
                </div>

                <Suspense fallback={<div className="h-52 bg-gray-100 rounded-2xl animate-pulse" />}>
                  <PushNotificationSender
                    players={players}
                    teamId={userData.teamId ?? ''}
                    coachName={(teamData as { coach_name?: string }).coach_name || teamData.team_name || 'Trainer'}
                  />
                </Suspense>

                <Suspense fallback={<div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />}>
                  <MessagingInbox
                    currentUserId={user.id}
                    currentUserName={(teamData as { coach_name?: string }).coach_name || teamData.team_name || 'Trainer'}
                    currentUserRole="coach"
                    clubId={userData.clubId}
                    teamId={userData.teamId}
                    onUnreadChange={setUnreadMessages}
                  />
                </Suspense>

                {/* Team chat (groepschat per channel) */}
                {userData.teamId && (
                  <div className="mt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                        <MessageSquare size={11} /> Teamchat
                      </span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <Suspense fallback={<div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />}>
                      <TeamChatLazy
                        teamId={userData.teamId}
                        userData={{ uid: user.id, role: userData.role === 'club_admin' ? 'club_admin' : 'coach' }}
                        userName={(teamData as { coach_name?: string }).coach_name || teamData.team_name || 'Coach'}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Install modal */}
          <InstallModal
            open={showInstallModal}
            onClose={() => setShowInstallModal(false)}
            role={userData.role === 'club_admin' ? 'club_admin' : 'coach'}
          />

          {/* Mobile bottom nav */}
          <nav
            className="fixed bottom-0 left-0 right-0 sm:hidden z-30"
            style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid #e5e7eb', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex">
              {COACH_SECTIONS.map(({ id, label, icon: Icon }) => {
                const isActive = mobileSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => setMobileSection(id)}
                    className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-60 transition-opacity relative"
                    style={{ color: isActive ? COACH_COLOR : '#9ca3af' }}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-5 right-5 h-[2px] rounded-b-full" style={{ background: COACH_COLOR }} />
                    )}
                    <Icon size={20} />
                    <span className="text-[9px] font-bold tracking-wide uppercase">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* ── PLAYER DASHBOARD ── */}
      {userData.role === 'player' && activePlayer && (
        <div className="flex flex-col min-h-screen">

          {/* Sticky header */}
          <header className="sticky top-0 z-20 bg-white/98 backdrop-blur-md border-b border-gray-200 px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <h1 className="text-xl font-black tracking-wide truncate text-gray-900">
                {teamData.team_name || 'Skillkaart'}
              </h1>
              <div className="flex items-center gap-2">
                <button onClick={() => setMobileSection('berichten')} title="Berichten" className="relative p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500">
                  <MessageSquare size={16} />
                  {unreadPlayerNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">
                      {unreadPlayerNotifications}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => canInstall ? showInstallPrompt() : setShowInstallModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors"
                  style={{ borderColor: `${COACH_COLOR}40`, color: COACH_COLOR, backgroundColor: `${COACH_COLOR}10` }}
                >
                  <Download size={14} /> App
                </button>
                <button onClick={onPlayerLogout} className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-red-50 transition-colors text-red-400">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Desktop section tabs */}
          <nav className="hidden sm:block border-b border-gray-200 bg-white px-4">
            <div className="max-w-6xl mx-auto flex">
              {PLAYER_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMobileSection(id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all relative ${
                    mobileSection === id
                      ? 'text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  style={mobileSection === id ? { borderColor: COACH_COLOR, color: '#111827' } : {}}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 px-4 py-5 max-w-6xl mx-auto w-full pb-28 sm:pb-10">

          {/* ════════════════ VANDAAG — één actie, rustig overzicht ════════════════ */}
          {mobileSection === 'vandaag' && (
            <div className="space-y-5">
              <TodayScreen
                player={activePlayer}
                streak={streak}
                customHomework={customHomework}
                assignedHomeworkIds={teamData.assigned_homework_ids || []}
                hasOpenQuestions={visibleQuestions.some(({ idx }) => !responseDrafts[idx]?.trim())}
                weekChallenge={activeWeekChallengeText}
                onCompleteWeekChallenge={handleCompleteWeekChallenge}
              />

              {/* Team-uitdaging — collectief weekdoel, geen individuele ranking */}
              {teamChallenge && (
                <TeamChallengeCard
                  challenge={teamChallenge}
                  playerId={user.id}
                />
              )}

              <div id="today-homework" className="scroll-mt-24">
                <PlayerHomeworkCard
                  player={activePlayer}
                  teamId={userData.teamId ?? ''}
                  customHomework={customHomework}
                  assignedHomeworkIds={teamData.assigned_homework_ids || []}
                  submissions={submissions}
                  onSubmissionComplete={handleSubmissionComplete}
                  focusedId={focusedHomeworkId}
                />
              </div>

              <div id="today-challenges" className="scroll-mt-24">
                {isClubPro ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <ChallengeLibrary
                      player={activePlayer}
                      completions={challengeCompletions}
                      onComplete={handleChallengeComplete}
                    />
                  </div>
                ) : (
                  <ProGate
                    feature="Uitdagingen"
                    description="Wekelijkse skill-uitdagingen per categorie, met AI-feedback. Binnenkort beschikbaar als PRO-feature."
                  />
                )}
              </div>

              {/* Coach-vragen — paged, één vraag per scherm */}
              {visibleQuestions.length > 0 && (
                <div id="today-questions" className="scroll-mt-24">
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck size={18} style={{ color: COACH_COLOR }} />
                      <h3 className="text-lg font-black text-gray-900">Vragen van je coach</h3>
                    </div>
                    <QuestionPager
                      questions={visibleQuestions}
                      responseDrafts={responseDrafts}
                      onChangeResponse={(idx, value) => {
                        const updated = [...responseDrafts];
                        updated[idx] = value;
                        setResponseDrafts(updated);
                      }}
                      onSave={handleSaveQuestionResponses}
                      saving={savingResponses}
                      isYoung={parseInt(activePlayer.age ?? '10', 10) <= 9}
                    />
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ MIJN KAART — Inzet-DNA (de trots) ════════════════ */}
          {mobileSection === 'kaart' && (
            <div className="space-y-3">
              <StreakWidget streak={streak} onRevive={s => setStreak(s)} />
              <PlayerCard player={activePlayer} stats={playerStats} />
            </div>
          )}

          {/* ════════════════ IK — alle data, rustig & opt-in ════════════════ */}
          {mobileSection === 'ik' && (
            <div className="space-y-5">
              <PlayerOverview player={activePlayer} players={players} teamData={teamData} activeTab={activeTab} avatarStats={avatarStats} onAvatarSave={handleSaveAvatar} />

              {/* Coach-evaluatie per periode (alleen-lezen) */}
              <Card>
                <div className="flex justify-between items-center border-b border-gray-200 mb-4">
                  <div className="flex">
                    {teamPeriods.map(period => (
                      <button key={period} onClick={() => setActiveTab(period)} className={`px-4 py-3 text-sm sm:text-base font-medium transition-colors duration-200 relative ${activeTab === period ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        {period}
                        {activeTab === period && (<motion.div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: COACH_COLOR }} layoutId="underline" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />)}
                      </button>
                    ))}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {skillKeys.map(key => (
                          <Slider key={key} label={key} value={activePlayer.evaluations[activeTab]?.skills[key] || 5} onChange={() => {}} disabled={true} light />
                        ))}
                      </div>
                      <hr className="md:col-span-2 border-gray-200" />
                      <Input light label="Wedstrijdcijfer (0-10)" type="number" value={activePlayer.evaluations[activeTab]?.matchRating || ''} onChange={() => {}} disabled={true} />
                      <Textarea light label="Opmerkingen Coach" placeholder="Nog geen opmerkingen" value={activePlayer.evaluations[activeTab]?.comments || ''} onChange={() => {}} disabled={true} />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </Card>

              {/* Trainingsplan */}
              {(activePlayer.evaluations[activeTab]?.structuredPlan || activePlayer.evaluations[activeTab]?.trainingPlan) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                  <Card>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Target size={11} style={{ color: COACH_COLOR }} /> Jouw Trainingsplan
                    </p>
                    {activePlayer.evaluations[activeTab]?.structuredPlan ? (
                      <TrainingPlanCard
                        plan={activePlayer.evaluations[activeTab].structuredPlan!}
                        playerName={activePlayer.name}
                        period={activeTab}
                      />
                    ) : (
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-100">
                        {activePlayer.evaluations[activeTab]?.trainingPlan}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Fysieke testresultaten */}
              <TestResultsCard player={activePlayer} period={activeTab} />
            </div>
          )}

          {/* ── BERICHTEN ── */}
          {mobileSection === 'berichten' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-gray-900">Berichten</h2>
                <p className="text-sm text-gray-500 mt-0.5">Berichten van je trainer.</p>
              </div>
              <Suspense fallback={<div className="h-52 bg-gray-100 rounded-2xl animate-pulse" />}>
                <PlayerNotificationsInbox playerId={user.id} onUnreadChange={setUnreadPlayerNotifications} />
              </Suspense>
            </div>
          )}

          </main>

          {/* Install modal */}
          <InstallModal
            playerId={userData.role === 'player' ? user.id : undefined}
            open={showInstallModal}
            onClose={() => setShowInstallModal(false)}
            role="player"
          />

          {/* Player bottom nav */}
          <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-30" style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid #e5e7eb', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex">
              <button onClick={() => setMobileSection('vandaag')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'vandaag' ? COACH_COLOR : '#9ca3af' }}>
                <Flame size={20} />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Vandaag</span>
              </button>
              <button onClick={() => setMobileSection('kaart')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'kaart' ? COACH_COLOR : '#9ca3af' }}>
                <Trophy size={20} />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Kaart</span>
              </button>
              <button onClick={() => setMobileSection('ik')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'ik' ? COACH_COLOR : '#9ca3af' }}>
                <User size={20} />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Ik</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
