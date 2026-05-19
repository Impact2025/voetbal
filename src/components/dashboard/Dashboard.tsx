import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { Player, Team, CustomHomework, UserData, SessionUser } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, User, BarChart2, LogOut, ShieldCheck, UserSquare, ClipboardList, CheckCircle2, ListPlus, Wand2, Loader2, FileText, Copy, Edit, TrendingUp, LayoutDashboard, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callAI } from '../../lib/ai';
import { NEON_COLOR, skillKeys, evaluationPeriods, DEFAULT_WEEKLY_QUESTIONS, createInitialEvaluations } from '../../utils/constants';
import { copyToClipboard } from '../../utils/clipboard';
import Card from '../ui/Card';
import ToolButton from '../ui/ToolButton';
import Slider from '../ui/Slider';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import ConfirmModal from '../modals/ConfirmModal';
const HomeworkCreatorModal = lazy(() => import('../modals/HomeworkCreatorModal'));
const AddPlayerModal = lazy(() => import('../modals/AddPlayerModal'));
const PlayerProfileModal = lazy(() => import('../modals/PlayerProfileModal'));
const CoachProfileModal = lazy(() => import('../modals/CoachProfileModal'));
const TestsModal = lazy(() => import('../modals/TestsModal'));
import PlayerHomeworkCard from '../players/PlayerHomeworkCard';
import TestResultsCard from '../evaluation/TestResultsCard';
import TeamOverview from './TeamOverview';
import PlayerOverview from './PlayerOverview';

interface DashboardProps {
  user: SessionUser;
  userData: UserData;
  onPlayerLogout: () => void;
}

const COACH_SECTIONS = [
  { id: 'overzicht',   label: 'Overzicht',   icon: LayoutDashboard },
  { id: 'spelers',     label: 'Spelers',      icon: UserSquare },
  { id: 'huiswerk',    label: 'Huiswerk',     icon: ClipboardList },
  { id: 'trainingen',  label: 'Trainingen',   icon: Target },
  { id: 'vragen',      label: 'Vragen',       icon: ListPlus },
] as const;

const Dashboard = ({ user, userData, onPlayerLogout }: DashboardProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [customHomework, setCustomHomework] = useState<CustomHomework[]>([]);
  const [teamData, setTeamData] = useState<Partial<Team>>({});
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(evaluationPeriods[0]);
  const [isHomeworkVisible, setIsHomeworkVisible] = useState(false);
  const [isTestsVisible, setIsTestsVisible] = useState(false);
  const [confirmAssign, setConfirmAssign] = useState<{ isVisible: boolean; homeworkIds: string[] | null }>({ isVisible: false, homeworkIds: null });
  const [confirmRemove, setConfirmRemove] = useState<{ isVisible: boolean; playerId: string | null }>({ isVisible: false, playerId: null });
  const [isGenerating, setIsGenerating] = useState({ plan: false, comments: false });
  const [generatingPlanForPlayer, setGeneratingPlanForPlayer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isCoachProfileVisible, setIsCoachProfileVisible] = useState(false);
  const [questionDrafts, setQuestionDrafts] = useState(['', '', '']);
  const [responseDrafts, setResponseDrafts] = useState(['', '', '']);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [savingResponses, setSavingResponses] = useState(false);
  const [mobileSection, setMobileSection] = useState(() => userData.role === 'coach' ? 'overzicht' : 'dashboard');

  useEffect(() => {
    if (!userData.teamId) return;

    const fetchData = async () => {
      const { data: playersData } = await supabase.from('players').select('*').eq('team_id', userData.teamId);
      const { data: teamRecord } = await supabase.from('teams').select('*').eq('id', userData.teamId).single();
      const { data: homeworkData } = await supabase.from('custom_homework').select('*').eq('team_id', userData.teamId);

      const normalizedPlayers = (playersData || []).map(player => ({
        ...player,
        weekly_question_responses: Array.from({ length: 3 }, (_, idx) => player.weekly_question_responses?.[idx] || ''),
      }));

      const baseQuestions = Array.isArray(teamRecord?.weekly_questions) && teamRecord.weekly_questions.length > 0
        ? teamRecord.weekly_questions
        : DEFAULT_WEEKLY_QUESTIONS;
      const normalizedTeam = teamRecord
        ? { ...teamRecord, weekly_questions: Array.from({ length: 3 }, (_, idx) => baseQuestions[idx] || '') }
        : { weekly_questions: DEFAULT_WEEKLY_QUESTIONS.slice() };

      setPlayers(normalizedPlayers);
      setTeamData(normalizedTeam);
      setCustomHomework(homeworkData || []);

      if (userData.role === 'coach' && normalizedPlayers.length > 0) {
        setActivePlayerId(prev => prev || normalizedPlayers[0].id);
      } else if (userData.role === 'player') {
        setActivePlayerId(user.id);
      }
    };

    fetchData();

    supabase.channel(`public:players:team_id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchData())
      .subscribe();

    supabase.channel(`public:teams:id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, payload => setTeamData(payload.new))
      .subscribe();

    supabase.channel(`public:custom_homework:team_id=eq.${userData.teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_homework' }, () => fetchData())
      .subscribe();

    return () => supabase.removeAllChannels();
  }, [userData, user.id]);

  const activePlayer = useMemo(() => {
    if (userData.role === 'player') return players.find(p => p.id === user.id);
    return players.find(p => p.id === activePlayerId);
  }, [players, activePlayerId, user.id, userData.role]);

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
    let newPin;
    let isUnique = false;
    while (!isUnique) {
      newPin = Math.floor(100000 + Math.random() * 900000).toString();
      const { data } = await supabase.from('players').select('id').eq('team_id', userData.teamId).eq('pin', newPin);
      isUnique = !data || data.length === 0;
    }

    const newPlayer = {
      name: playerName,
      team_id: userData.teamId,
      age: '',
      preferred_foot: 'Rechts',
      position: '',
      pin: newPin,
      avatar_url: `https://placehold.co/128x128/1A1A1A/FFFFFF?text=${playerName.substring(0, 2).toUpperCase()}`,
      evaluations: createInitialEvaluations(),
      completed_homework_ids: [],
      weekly_question_responses: ['', '', ''],
    };

    const { data, error } = await supabase.from('players').insert(newPlayer).select().single();
    if (error) throw error;
    return { id: data.id, pin: newPin };
  };

  const handleSaveProfile = async (playerId, profileData) => {
    await supabase.from('players').update(profileData).eq('id', playerId);
  };

  const handleSaveCoachProfile = async (coachProfileData) => {
    await supabase.from('teams').update(coachProfileData).eq('id', userData.teamId);
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

  const handleUpdateEvaluation = async (field, value) => {
    if (userData.role !== 'coach' || !activePlayer) return;

    const newEvaluations = JSON.parse(JSON.stringify(activePlayer.evaluations));
    const path = field.split('.');
    let currentLevel = newEvaluations[activeTab];
    for (let i = 0; i < path.length - 1; i++) {
      if (!currentLevel[path[i]]) currentLevel[path[i]] = {};
      currentLevel = currentLevel[path[i]];
    }
    currentLevel[path[path.length - 1]] = value;

    const { error } = await supabase.from('players').update({ evaluations: newEvaluations }).eq('id', activePlayer.id);
    if (error) console.error('Error updating evaluation:', error);
  };

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

  const handleToggleHomeworkStatus = async (homeworkId) => {
    if (userData.role !== 'player' || !activePlayer) return;
    const isCompleted = activePlayer.completed_homework_ids.includes(homeworkId);
    const newCompletedIds = isCompleted
      ? activePlayer.completed_homework_ids.filter(id => id !== homeworkId)
      : [...activePlayer.completed_homework_ids, homeworkId];
    await supabase.from('players').update({ completed_homework_ids: newCompletedIds }).eq('id', user.id);
  };

  const handleRemovePlayer = (id) => setConfirmRemove({ isVisible: true, playerId: id });

  const executeRemovePlayer = async () => {
    const { playerId } = confirmRemove;
    if (!playerId) return;
    await supabase.from('players').delete().eq('id', playerId);
    setConfirmRemove({ isVisible: false, playerId: null });
  };

  const handleCopyTeamId = () => {
    copyToClipboard(userData.teamId);
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

  const handleGeneratePlan = async () => {
    if (!activePlayer) return;
    setIsGenerating(prev => ({ ...prev, plan: true }));
    const currentEval = activePlayer.evaluations[activeTab];
    const sortedSkills = Object.entries(currentEval.skills).sort(([, a], [, b]) => b - a);
    const topSkills = sortedSkills.slice(0, 2).map(s => s[0]).join(', ');
    const bottomSkills = sortedSkills.slice(-2).map(s => s[0]).join(', ');
    const prompt = `Genereer een beknopt, positief en motiverend persoonlijk trainingsplan in het Nederlands voor een jonge voetballer (7-12 jaar). Focus op het verbeteren van zwakke punten en benutten van sterke punten. Sterke punten: ${topSkills}. Zwakke punten: ${bottomSkills}. Coach opmerkingen: "${currentEval.comments}". Het plan moet bestaan uit 2-3 leuke, uitvoerbare oefeningen voor thuis. Formatteer het als een lijst met koppeltekens.`;
    const result = await callAI(prompt);
    handleUpdateEvaluation('trainingPlan', result);
    setIsGenerating(prev => ({ ...prev, plan: false }));
  };

  const handleGeneratePlanForPlayer = async (player: Player) => {
    const currentEval = player.evaluations[activeTab];
    if (!currentEval) return;
    setGeneratingPlanForPlayer(player.id);
    try {
      const sortedSkills = Object.entries(currentEval.skills).sort(([, a], [, b]) => (b as number) - (a as number));
      const topSkills = sortedSkills.slice(0, 2).map(s => s[0]).join(', ');
      const bottomSkills = sortedSkills.slice(-2).map(s => s[0]).join(', ');
      const prompt = `Genereer een beknopt, positief en motiverend persoonlijk trainingsplan in het Nederlands voor een jonge voetballer (7-12 jaar). Focus op het verbeteren van zwakke punten en benutten van sterke punten. Sterke punten: ${topSkills}. Zwakke punten: ${bottomSkills}. Coach opmerkingen: "${currentEval.comments}". Het plan moet bestaan uit 2-3 leuke, uitvoerbare oefeningen voor thuis. Formatteer het als een lijst met koppeltekens.`;
      const result = await callAI(prompt);
      const newEvaluations = JSON.parse(JSON.stringify(player.evaluations));
      newEvaluations[activeTab].trainingPlan = result;
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

  const radarChartData = useMemo(() => {
    if (!activePlayer) return [];
    const currentSkills = activePlayer.evaluations[activeTab].skills;
    return skillKeys.map(key => ({ subject: key.charAt(0).toUpperCase() + key.slice(1), value: currentSkills[key], fullMark: 10 }));
  }, [activePlayer, activeTab]);

  const lineChartData = useMemo(() => {
    if (!activePlayer) return [];
    return evaluationPeriods.map(period => {
      const evalData = activePlayer.evaluations[period];
      const skillAverage = skillKeys.reduce((sum, key) => sum + (evalData.skills[key] || 0), 0) / skillKeys.length;
      return { name: period, 'Gem. Skill': parseFloat(skillAverage.toFixed(1)), 'Wedstrijdcijfer': evalData.matchRating };
    });
  }, [activePlayer]);

  if (!activePlayer && userData.role === 'player') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Loader2 className="animate-spin h-12 w-12 text-[--neon-color] mb-4" />
        <h2 className="text-2xl font-bold">Laden van spelerdata...</h2>
        <p className="text-gray-400">Een ogenblik geduld.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#1A1A1A', color: '#fff', border: '1px solid #333' }, success: { iconTheme: { primary: '#00FF9D', secondary: '#000' } } }} />
      <Suspense fallback={null}>
        <HomeworkCreatorModal isVisible={isHomeworkVisible} onClose={() => setIsHomeworkVisible(false)} onSave={handleSaveHomework} onAssign={handleAssignHomework} customHomework={customHomework} />
        <AddPlayerModal isVisible={isAddPlayerVisible} onClose={() => setIsAddPlayerVisible(false)} onAdd={handleAddPlayer} teamId={userData.teamId} />
        <PlayerProfileModal isVisible={!!editingPlayer} onClose={() => setEditingPlayer(null)} player={editingPlayer} teamId={userData.teamId} onSave={handleSaveProfile} />
        <CoachProfileModal isVisible={isCoachProfileVisible} onClose={() => setIsCoachProfileVisible(false)} teamData={teamData} onSave={handleSaveCoachProfile} />
        <TestsModal isVisible={isTestsVisible} onClose={() => setIsTestsVisible(false)} player={activePlayer} period={activeTab} onUpdate={handleUpdateEvaluation} />
      </Suspense>

      <ConfirmModal isVisible={confirmAssign.isVisible} onClose={() => setConfirmAssign({ isVisible: false, homeworkIds: null })} onConfirm={executeAssignHomework} title="Huiswerk Toewijzen">
        Weet je zeker dat je dit huiswerk wilt toewijzen? Dit vervangt de huidige opdracht voor het team.
      </ConfirmModal>
      <ConfirmModal isVisible={confirmRemove.isVisible} onClose={() => setConfirmRemove({ isVisible: false, playerId: null })} onConfirm={executeRemovePlayer} title="Speler Verwijderen">
        Weet je zeker dat je deze speler wilt verwijderen?
      </ConfirmModal>

      {/* ── COACH DASHBOARD ── */}
      {userData.role === 'coach' && (
        <div className="flex flex-col min-h-screen">

          {/* Sticky header */}
          <header className="sticky top-0 z-20 bg-[#090B0F]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <h1 className="text-xl font-black tracking-wide truncate" style={{ color: NEON_COLOR, textShadow: `0 0 20px ${NEON_COLOR}40` }}>
                {teamData.team_name || 'Mijn Team'}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyTeamId}
                  className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-400">ID:</span>
                  <span className="font-mono font-bold text-white">{userData.teamId}</span>
                  {copied ? <CheckCircle2 size={13} className="text-green-400" /> : <Copy size={13} className="text-gray-500" />}
                </button>
                <button onClick={() => setIsCoachProfileVisible(true)} className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 hover:bg-gray-700 transition-colors text-gray-300">
                  <Edit size={16} />
                </button>
                <button onClick={async () => { await supabase.auth.signOut(); }} className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 hover:bg-red-900/40 transition-colors text-red-400">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Desktop section tabs */}
          <nav className="hidden sm:block border-b border-white/[0.06] bg-[#090B0F]/60 px-4">
            <div className="max-w-6xl mx-auto flex">
              {COACH_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMobileSection(id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all relative ${
                    mobileSection === id
                      ? 'border-[--neon-color] text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-200'
                  }`}
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <TeamOverview
                  players={players}
                  teamData={teamData}
                  activeTab={activeTab}
                  onSelectPlayer={(id) => { setActivePlayerId(id); setMobileSection('spelers'); }}
                />
              </motion.div>
            )}

            {/* ── SPELERS ── */}
            {mobileSection === 'spelers' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

                {/* Player selector */}
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {players.map(player => {
                    const assignedCount = teamData.assigned_homework_ids?.length || 0;
                    const completedCount = player.completed_homework_ids?.filter(id => teamData.assigned_homework_ids?.includes(id)).length || 0;
                    const isActive = activePlayerId === player.id;
                    return (
                      <motion.div
                        key={player.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActivePlayerId(player.id)}
                        onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setActivePlayerId(player.id); }}
                        className={`relative shrink-0 flex flex-col items-start gap-2 p-3 rounded-xl transition-all cursor-pointer border ${
                          isActive ? 'border-[#00FF9D] bg-gray-800/80' : 'border-gray-700/60 bg-gray-900/60 hover:bg-gray-800/60'
                        }`}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-center gap-3">
                          <img src={player.avatar_url} alt={player.name} className="w-10 h-10 rounded-full" />
                          <span className="font-semibold whitespace-nowrap text-sm">{player.name}</span>
                        </div>
                        {assignedCount > 0 && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 pl-1">
                            <CheckCircle2 size={12} className={completedCount === assignedCount ? 'text-green-400' : 'text-gray-700'} />
                            HW: {completedCount}/{assignedCount}
                          </div>
                        )}
                        <button onClick={e => { e.stopPropagation(); setEditingPlayer(player); }} className="absolute -top-2 -left-2 p-1 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors" aria-label="Profiel bewerken">
                          <User size={11} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleRemovePlayer(player.id); }} className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors" aria-label="Verwijder speler">
                          <Trash2 size={11} />
                        </button>
                      </motion.div>
                    );
                  })}
                  <button
                    onClick={() => setIsAddPlayerVisible(true)}
                    className="shrink-0 flex flex-col items-center justify-center gap-1.5 px-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-[--neon-color] min-w-[5rem] h-[5rem] transition-colors text-gray-600 hover:text-[--neon-color]"
                  >
                    <Plus size={18} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">Toevoegen</span>
                  </button>
                </div>

                {players.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl">
                    <UserSquare size={40} className="mx-auto mb-3 text-gray-700" />
                    <p className="text-gray-400 font-medium mb-3">Nog geen spelers in het team</p>
                    <button onClick={() => setIsAddPlayerVisible(true)} className="px-5 py-2 rounded-xl text-sm font-bold text-black hover:opacity-90 transition-opacity" style={{ backgroundColor: NEON_COLOR }}>
                      Eerste speler toevoegen
                    </button>
                  </div>
                )}

                {activePlayer && (
                  <>
                    {/* Player header */}
                    <Card>
                      <div className="flex items-center gap-4">
                        <img src={activePlayer.avatar_url} alt={activePlayer.name} className="w-14 h-14 rounded-full border-2 shrink-0" style={{ borderColor: NEON_COLOR }} />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-black truncate">{activePlayer.name}</h2>
                          <p className="text-sm text-gray-400">{activePlayer.position || 'Positie niet ingesteld'} · {activePlayer.age ? `${activePlayer.age} jaar` : ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-3xl font-black" style={{ color: NEON_COLOR }}>
                            {Math.round(radarChartData.reduce((s, sk) => s + sk.value, 0) / skillKeys.length * 10)}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">score</div>
                        </div>
                      </div>

                      {/* Period tabs */}
                      <div className="flex items-center justify-between mt-5 border-b border-gray-800">
                        <div className="flex">
                          {evaluationPeriods.map(period => (
                            <button
                              key={period}
                              onClick={() => setActiveTab(period)}
                              className={`px-4 py-2.5 text-sm font-semibold relative transition-colors ${activeTab === period ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              {period}
                              {activeTab === period && (
                                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--neon-color]" layoutId="coachTab" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                              )}
                            </button>
                          ))}
                        </div>
                        <ToolButton onClick={() => setIsTestsVisible(true)}>
                          <FileText size={14} /> Testen
                        </ToolButton>
                      </div>

                      {/* Skills */}
                      <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {skillKeys.map(key => (
                              <Slider
                                key={key}
                                label={key}
                                value={activePlayer.evaluations[activeTab]?.skills[key] || 5}
                                onChange={e => handleUpdateEvaluation(`skills.${key}`, parseInt(e.target.value))}
                                disabled={false}
                              />
                            ))}
                          </div>
                          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Wedstrijdcijfer (0-10)"
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
                    <Card>
                      <Textarea
                        label="Opmerkingen Coach"
                        placeholder="Sterke punten, verbeterpunten..."
                        value={activePlayer.evaluations[activeTab]?.comments || ''}
                        onChange={e => handleUpdateEvaluation('comments', e.target.value)}
                        disabled={false}
                      >
                        <button onClick={handleGenerateComments} disabled={isGenerating.comments} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                          {isGenerating.comments ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} style={{ color: NEON_COLOR }} />}
                          Genereer
                        </button>
                      </Textarea>
                    </Card>

                    {/* Radar */}
                    <Card>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Skill Radar — {activeTab}</p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar name={activePlayer.name} dataKey="value" stroke={NEON_COLOR} fill={NEON_COLOR} fillOpacity={0.55} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Trend */}
                    <Card>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                        <TrendingUp size={13} style={{ color: NEON_COLOR }} /> Prestatie Trend
                      </p>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 10]} stroke="#6b7280" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="Gem. Skill" stroke={NEON_COLOR} strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Wedstrijdcijfer" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </>
                )}
              </motion.div>
            )}

            {/* ── HUISWERK ── */}
            {mobileSection === 'huiswerk' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">Huiswerk</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{customHomework.length} opdracht{customHomework.length !== 1 ? 'en' : ''} aangemaakt</p>
                  </div>
                  <button
                    onClick={() => setIsHomeworkVisible(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: NEON_COLOR }}
                  >
                    <Plus size={15} /> Nieuw
                  </button>
                </div>

                {/* Team completion */}
                {(teamData.assigned_homework_ids?.length || 0) > 0 && players.length > 0 && (
                  <Card>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Voltooiing Team</p>
                    <div className="space-y-3">
                      {players.map(p => {
                        const total = teamData.assigned_homework_ids?.length || 0;
                        const done = p.completed_homework_ids?.filter(id => teamData.assigned_homework_ids?.includes(id)).length || 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <div key={p.id} className="flex items-center gap-3">
                            <img src={p.avatar_url} className="w-7 h-7 rounded-full shrink-0" alt={p.name} />
                            <span className="text-sm flex-1 min-w-0 truncate">{p.name}</span>
                            <div className="w-24 bg-gray-800 rounded-full h-1.5 shrink-0">
                              <motion.div
                                className="h-1.5 rounded-full"
                                style={{ backgroundColor: pct === 100 ? '#4ade80' : NEON_COLOR }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums shrink-0 w-8 text-right">{done}/{total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Homework list */}
                {customHomework.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl">
                    <ClipboardList size={40} className="mx-auto mb-3 text-gray-700" />
                    <p className="text-gray-400 font-medium mb-3">Nog geen huiswerk aangemaakt</p>
                    <button onClick={() => setIsHomeworkVisible(true)} className="px-5 py-2 rounded-xl text-sm font-bold text-black hover:opacity-90 transition-opacity" style={{ backgroundColor: NEON_COLOR }}>
                      Eerste opdracht aanmaken
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customHomework.map(hw => {
                      const isAssigned = (teamData.assigned_homework_ids || []).includes(hw.id);
                      return (
                        <Card key={hw.id} className={`transition-all ${isAssigned ? 'border border-[#00FF9D]/25' : ''}`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold truncate">{hw.title}</h4>
                                {isAssigned && (
                                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${NEON_COLOR}15`, color: NEON_COLOR }}>
                                    Actief
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 leading-relaxed">{hw.description}</p>
                              {hw.youtube_url && (
                                <a href={hw.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                                  Video bekijken →
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => handleToggleHomeworkAssignment(hw.id)}
                              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                isAssigned
                                  ? 'bg-gray-800 text-gray-400 hover:bg-red-900/30 hover:text-red-400 border border-gray-700'
                                  : 'border border-gray-700 hover:border-[--neon-color] hover:text-[--neon-color] text-gray-400'
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
              </motion.div>
            )}

            {/* ── TRAININGEN ── */}
            {mobileSection === 'trainingen' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">Trainingen</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Persoonlijke plannen per speler</p>
                  </div>
                  {/* Period selector */}
                  <div className="flex gap-1 bg-gray-800/80 rounded-xl p-1 border border-gray-700/60 shrink-0">
                    {evaluationPeriods.map(p => (
                      <button
                        key={p}
                        onClick={() => setActiveTab(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === p ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {p.replace('Check-in ', 'CI')}
                      </button>
                    ))}
                  </div>
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl">
                    <Target size={40} className="mx-auto mb-3 text-gray-700" />
                    <p className="text-gray-400">Voeg spelers toe om trainingsplannen te maken.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {players.map(player => {
                      const plan = player.evaluations?.[activeTab]?.trainingPlan;
                      const isGeneratingThis = generatingPlanForPlayer === player.id;
                      return (
                        <Card key={player.id}>
                          <div className="flex items-center gap-3 mb-4">
                            <img src={player.avatar_url} alt={player.name} className="w-10 h-10 rounded-full border border-gray-700 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold truncate">{player.name}</h4>
                              <p className="text-[10px] text-gray-600 uppercase tracking-wide">{activeTab}</p>
                            </div>
                            <button
                              onClick={() => handleGeneratePlanForPlayer(player)}
                              disabled={!!generatingPlanForPlayer}
                              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: NEON_COLOR }}
                            >
                              {isGeneratingThis ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                              {isGeneratingThis ? 'Laden...' : 'Genereer'}
                            </button>
                          </div>
                          {plan ? (
                            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-800/40 rounded-xl p-4 border border-gray-700/40">
                              {plan}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 italic text-center py-4">
                              Nog geen trainingsplan — klik Genereer.
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── VRAGEN ── */}
            {mobileSection === 'vragen' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black">Reflectievragen</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Stel wekelijkse vragen aan het team</p>
                </div>

                <Card>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Vragen voor spelers</p>
                  <div className="space-y-4">
                    {questionDrafts.map((value, idx) => (
                      <Textarea
                        key={`coach-question-${idx}`}
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
                  <div className="mt-5 flex justify-end gap-3">
                    <button onClick={() => setQuestionDrafts(['', '', ''])} className="px-4 py-2 rounded-xl bg-gray-800 text-sm text-gray-300 hover:bg-gray-700 transition-colors border border-gray-700">
                      Reset
                    </button>
                    <button
                      onClick={handleSaveTeamQuestions}
                      disabled={savingQuestions}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-black flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: NEON_COLOR }}
                    >
                      {savingQuestions ? <Loader2 size={14} className="animate-spin" /> : null}
                      Opslaan & Delen
                    </button>
                  </div>
                </Card>

                {/* Player answers */}
                {visibleQuestions.length > 0 && players.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Antwoorden per speler</p>
                    </div>
                    {/* Player selector */}
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-gray-800">
                      {players.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setActivePlayerId(p.id)}
                          className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activePlayerId === p.id
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <img src={p.avatar_url} className="w-5 h-5 rounded-full" alt={p.name} />
                          {p.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                    {activePlayer ? (
                      <div className="space-y-3">
                        {visibleQuestions.map(({ text, idx }) => (
                          <div key={idx} className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/40">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Vraag {idx + 1}</p>
                            <p className="text-sm text-white font-semibold mb-2">{text}</p>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {activePlayer.weekly_question_responses?.[idx]?.trim()
                                ? activePlayer.weekly_question_responses[idx]
                                : <span className="italic text-gray-600">Nog geen antwoord gegeven</span>
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 text-center py-4">Selecteer een speler om antwoorden te bekijken.</p>
                    )}
                  </Card>
                )}
              </motion.div>
            )}
          </main>

          {/* Mobile bottom nav */}
          <nav
            className="fixed bottom-0 left-0 right-0 sm:hidden z-30"
            style={{ background: 'rgba(9,11,15,0.97)', backdropFilter: 'blur(20px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex">
              {COACH_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMobileSection(id)}
                  className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity"
                  style={{ color: mobileSection === id ? NEON_COLOR : '#6b7280' }}
                >
                  <Icon size={19} />
                  <span className="text-[9px] font-bold tracking-wider uppercase">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* ── PLAYER DASHBOARD ── */}
      {userData.role === 'player' && activePlayer && (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 sm:pb-0">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>{teamData.team_name || 'Skillkaart'}</h1>
            <div className="flex items-center gap-2">
              <ToolButton className="hidden sm:flex" onClick={onPlayerLogout}><LogOut size={16} /> Uitloggen</ToolButton>
              <button onClick={onPlayerLogout} className="sm:hidden p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 active:scale-95 transition-transform text-gray-300">
                <LogOut size={22} />
              </button>
            </div>
          </header>

          {/* Reflectievragen speler */}
          {visibleQuestions.length > 0 && (
            <motion.div className={`mb-6 ${mobileSection === 'vragen' ? '' : 'hidden'} sm:block`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-[--neon-color]" /> Coach Vragen</h3>
                  <p className="text-sm text-gray-400">Beantwoord de vragen van je coach.</p>
                </div>
                <div className="mt-4 space-y-5">
                  {visibleQuestions.map(({ text, idx }) => (
                    <div key={`player-question-${idx}`} className="space-y-2">
                      <p className="text-sm font-semibold text-[--neon-color] uppercase tracking-wide">Vraag {idx + 1}</p>
                      <p className="text-base text-white leading-relaxed">{text}</p>
                      <Textarea
                        label="Jouw antwoord"
                        value={responseDrafts[idx]}
                        onChange={e => {
                          const updated = [...responseDrafts];
                          updated[idx] = e.target.value;
                          setResponseDrafts(updated);
                        }}
                        placeholder="Schrijf hier je antwoord..."
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={handleSaveQuestionResponses} disabled={savingResponses} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                    {savingResponses ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Verstuur antwoorden
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Player overview */}
          <div className={`mb-6 ${mobileSection === 'dashboard' ? '' : 'hidden'}`}>
            <PlayerOverview player={activePlayer} players={players} teamData={teamData} activeTab={activeTab} />
          </div>

          <div className={((['huiswerk', 'skills', 'stats'].includes(mobileSection)) ? '' : 'hidden sm:block')}>
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div className={`lg:col-span-3${mobileSection !== 'huiswerk' ? ' hidden sm:block' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <PlayerHomeworkCard player={activePlayer} customHomework={customHomework} assignedHomeworkIds={teamData.assigned_homework_ids || []} onToggleStatus={handleToggleHomeworkStatus} />
              </motion.div>
              <div className="lg:col-span-1 flex flex-col gap-6">
                <motion.div className={mobileSection !== 'skills' ? 'hidden sm:block' : ''} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Card className="h-full">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <img src={activePlayer.avatar_url} alt={activePlayer.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2" style={{ borderColor: NEON_COLOR }} />
                        <div className="absolute -bottom-2 right-0 bg-gray-900 px-4 py-1 rounded-full border" style={{ borderColor: NEON_COLOR, color: NEON_COLOR }}>
                          <span className="text-2xl font-black">{Math.round(radarChartData.reduce((sum, skill) => sum + skill.value, 0) / skillKeys.length * 10)}</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold">{activePlayer.name}</h2>
                    </div>
                    <div className="h-64 sm:h-80 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                          <PolarGrid stroke="#4A5568" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                          <Radar name={activePlayer.name} dataKey="value" stroke={NEON_COLOR} fill={NEON_COLOR} fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </motion.div>
                <motion.div className={mobileSection !== 'stats' ? 'hidden sm:block' : ''} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                  <TestResultsCard player={activePlayer} period={activeTab} />
                </motion.div>
                <motion.div className={mobileSection !== 'stats' ? 'hidden sm:block' : ''} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                  <Card>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-[--neon-color]" />Prestatie Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                          <XAxis dataKey="name" stroke="#A0AEC0" />
                          <YAxis domain={[0, 10]} stroke="#A0AEC0" />
                          <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                          <Legend />
                          <Line type="monotone" dataKey="Gem. Skill" stroke={NEON_COLOR} strokeWidth={2} />
                          <Line type="monotone" dataKey="Wedstrijdcijfer" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </motion.div>
              </div>

              <motion.div className={`lg:col-span-2${mobileSection !== 'skills' ? ' hidden sm:block' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card>
                  <div className="flex justify-between items-center border-b border-gray-700 mb-4">
                    <div className="flex">
                      {evaluationPeriods.map(period => (
                        <button key={period} onClick={() => setActiveTab(period)} className={`px-4 py-3 text-sm sm:text-base font-medium transition-colors duration-200 relative ${activeTab === period ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                          {period}
                          {activeTab === period && (<motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--neon-color]" layoutId="underline" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          {skillKeys.map(key => (
                            <Slider key={key} label={key} value={activePlayer.evaluations[activeTab]?.skills[key] || 5} onChange={() => {}} disabled={true} />
                          ))}
                        </div>
                        <hr className="md:col-span-2 border-gray-700" />
                        <Input label="Wedstrijdcijfer (0-10)" type="number" value={activePlayer.evaluations[activeTab]?.matchRating || ''} onChange={() => {}} disabled={true} />
                        <Textarea label="Opmerkingen Coach" placeholder="Nog geen opmerkingen" value={activePlayer.evaluations[activeTab]?.comments || ''} onChange={() => {}} disabled={true} />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </Card>
              </motion.div>
            </main>
          </div>

          {/* Player bottom nav */}
          <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-30" style={{ background: 'rgba(9,11,15,0.97)', backdropFilter: 'blur(20px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex">
              <button onClick={() => setMobileSection('huiswerk')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'huiswerk' ? NEON_COLOR : '#6b7280' }}>
                <ClipboardList size={20} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Huiswerk</span>
              </button>
              <button onClick={() => setMobileSection('skills')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'skills' ? NEON_COLOR : '#6b7280' }}>
                <User size={20} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Skills</span>
              </button>
              <button onClick={() => setMobileSection('dashboard')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'dashboard' ? NEON_COLOR : '#6b7280' }}>
                <LayoutDashboard size={20} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Pro</span>
              </button>
              <button onClick={() => setMobileSection('stats')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'stats' ? NEON_COLOR : '#6b7280' }}>
                <TrendingUp size={20} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Stats</span>
              </button>
              <button onClick={() => setMobileSection('vragen')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'vragen' ? NEON_COLOR : '#6b7280' }}>
                <ShieldCheck size={20} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Vragen</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
