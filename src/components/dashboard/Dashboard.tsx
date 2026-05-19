import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { Player, Team, CustomHomework, UserData, SessionUser } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, User, BarChart2, LogOut, ShieldCheck, UserSquare, ClipboardList, CheckCircle2, ListPlus, Wand2, Loader2, FileText, Copy, Edit, Menu, TrendingUp, LayoutDashboard } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isCoachProfileVisible, setIsCoachProfileVisible] = useState(false);
  const [questionDrafts, setQuestionDrafts] = useState(['', '', '']);
  const [responseDrafts, setResponseDrafts] = useState(['', '', '']);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [savingResponses, setSavingResponses] = useState(false);
  const [mobileSection, setMobileSection] = useState(() => userData.role === 'coach' ? 'players' : 'dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 sm:pb-0">
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#1A1A1A', color: '#fff', border: '1px solid #333' }, success: { iconTheme: { primary: '#00FF9D', secondary: '#000' } } }} />
      <Suspense fallback={null}>
        <HomeworkCreatorModal isVisible={isHomeworkVisible} onClose={() => setIsHomeworkVisible(false)} onSave={handleSaveHomework} onAssign={handleAssignHomework} customHomework={customHomework} />
        <TestsModal isVisible={isTestsVisible} onClose={() => setIsTestsVisible(false)} player={activePlayer} period={activeTab} onUpdate={handleUpdateEvaluation} />
        <AddPlayerModal isVisible={isAddPlayerVisible} onClose={() => setIsAddPlayerVisible(false)} onAdd={handleAddPlayer} teamId={userData.teamId} />
        <PlayerProfileModal isVisible={!!editingPlayer} onClose={() => setEditingPlayer(null)} player={editingPlayer} teamId={userData.teamId} onSave={handleSaveProfile} />
        <CoachProfileModal isVisible={isCoachProfileVisible} onClose={() => setIsCoachProfileVisible(false)} teamData={teamData} onSave={handleSaveCoachProfile} />
      </Suspense>

      <ConfirmModal isVisible={confirmAssign.isVisible} onClose={() => setConfirmAssign({ isVisible: false, homeworkIds: null })} onConfirm={executeAssignHomework} title="Huiswerk Toewijzen">
        Weet je zeker dat je deze opdracht wilt toewijzen? Dit zal de huidige huiswerkopdracht voor het team vervangen.
      </ConfirmModal>
      <ConfirmModal isVisible={confirmRemove.isVisible} onClose={() => setConfirmRemove({ isVisible: false, playerId: null })} onConfirm={executeRemovePlayer} title="Speler Verwijderen">
        Weet je zeker dat je deze speler wilt verwijderen?
      </ConfirmModal>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && userData.role === 'coach' && (
          <motion.div className="fixed inset-0 z-50 sm:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)}>
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-800 p-6"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
            >
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-4 text-white">Team Beheer</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-gray-800/80 rounded-2xl">
                  <span className="text-gray-400 text-sm">Team ID</span>
                  <div className="flex items-center gap-3">
                    <strong className="text-white font-mono">{userData.teamId}</strong>
                    <button onClick={handleCopyTeamId} className="p-2 hover:bg-gray-700 rounded-xl active:scale-95 transition-transform">
                      {copied ? <CheckCircle2 size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => { setIsAddPlayerVisible(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl text-left transition-colors active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${NEON_COLOR}20` }}><Plus size={20} style={{ color: NEON_COLOR }} /></div>
                  <span className="font-medium">Speler Toevoegen</span>
                </button>
                <button onClick={() => { setIsHomeworkVisible(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl text-left transition-colors active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${NEON_COLOR}20` }}><ClipboardList size={20} style={{ color: NEON_COLOR }} /></div>
                  <span className="font-medium">Huiswerk Manager</span>
                </button>
                <button onClick={() => { setIsCoachProfileVisible(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl text-left transition-colors active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${NEON_COLOR}20` }}><Edit size={20} style={{ color: NEON_COLOR }} /></div>
                  <span className="font-medium">Team Profiel</span>
                </button>
                <button onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) console.error(error); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-red-950/50 hover:bg-red-900/40 rounded-2xl text-left transition-colors active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center"><LogOut size={20} className="text-red-400" /></div>
                  <span className="font-medium text-red-400">Uitloggen</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>{teamData.team_name || 'Skillkaart'}</h1>
          {userData.role === 'coach' && (
            <button onClick={() => setIsCoachProfileVisible(true)} className="hidden sm:flex text-gray-400 hover:text-white transition-colors p-1">
              <Edit size={18} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {userData.role === 'coach' && (
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">Team ID:</span>
                <strong className="text-white">{userData.teamId}</strong>
                <button onClick={handleCopyTeamId} className="p-1 hover:bg-gray-700 rounded-md">
                  {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
              <ToolButton onClick={() => setIsAddPlayerVisible(true)}><Plus size={16} /> Speler Toevoegen</ToolButton>
              <ToolButton onClick={() => setIsHomeworkVisible(true)}><ClipboardList size={16} /> Huiswerk</ToolButton>
              <ToolButton onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) console.error(error); }}><LogOut size={16} /> Uitloggen</ToolButton>
            </div>
          )}
          {userData.role === 'player' && (
            <ToolButton className="hidden sm:flex" onClick={onPlayerLogout}><LogOut size={16} /> Uitloggen</ToolButton>
          )}
          {userData.role === 'coach' ? (
            <button onClick={() => setMobileMenuOpen(true)} className="sm:hidden p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 active:scale-95 transition-transform">
              <Menu size={22} />
            </button>
          ) : (
            <button onClick={onPlayerLogout} className="sm:hidden p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 active:scale-95 transition-transform text-gray-300">
              <LogOut size={22} />
            </button>
          )}
        </div>
      </header>

      {/* Reflectievragen */}
      {(userData.role === 'coach' || visibleQuestions.length > 0) && (
        <motion.div className={`mb-6 ${(userData.role === 'coach' ? mobileSection === 'questions' : mobileSection === 'vragen') ? '' : 'hidden'} sm:block`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            {userData.role === 'coach' ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-xl font-bold flex items-center gap-2"><ListPlus size={20} className="text-[--neon-color]" /> Team Reflectievragen</h3>
                  <p className="text-sm text-gray-400">Stel tot drie vragen voor je spelers.</p>
                </div>
                <div className="mt-4 space-y-4">
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
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <button onClick={() => setQuestionDrafts(['', '', ''])} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Reset</button>
                  <button onClick={handleSaveTeamQuestions} disabled={savingQuestions} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                    {savingQuestions ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Vragen opslaan
                  </button>
                </div>
                <div className="mt-6 border-t border-gray-800 pt-4">
                  <h4 className="font-semibold text-gray-300 mb-3">Antwoorden per speler</h4>
                  {!players.length ? (
                    <p className="text-sm text-gray-500">Nog geen spelers toegevoegd.</p>
                  ) : !activePlayer ? (
                    <p className="text-sm text-gray-500">Selecteer een speler om antwoorden te bekijken.</p>
                  ) : !visibleQuestions.length ? (
                    <p className="text-sm text-gray-500">Stel eerst vragen om antwoorden te verzamelen.</p>
                  ) : (
                    <div className="space-y-3">
                      {visibleQuestions.map(({ text, idx }) => (
                        <div key={`coach-answer-${idx}`} className="p-3 rounded-lg bg-gray-800/40">
                          <p className="text-sm text-gray-400">Vraag {idx + 1}</p>
                          <p className="text-white font-medium mt-1">{text}</p>
                          <p className="mt-2 text-sm text-gray-300">
                            {activePlayer.weekly_question_responses?.[idx]?.trim()
                              ? activePlayer.weekly_question_responses[idx]
                              : <span className="text-gray-500 italic">Nog geen antwoord</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-[--neon-color]" /> Coach Vragen</h3>
                  <p className="text-sm text-gray-400">Beantwoord de vragen van je coach.</p>
                </div>
                {!visibleQuestions.length ? (
                  <p className="text-gray-400 mt-4">Je coach heeft deze week nog geen vragen gedeeld.</p>
                ) : (
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
                )}
                {visibleQuestions.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button onClick={handleSaveQuestionResponses} disabled={savingResponses} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                      {savingResponses ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      Verstuur antwoorden
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Main content */}
      {userData.role === 'player' && activePlayer && (
        <div className={`mb-6 ${mobileSection === 'dashboard' ? '' : 'hidden'}`}>
          <PlayerOverview
            player={activePlayer}
            players={players}
            teamData={teamData}
            activeTab={activeTab}
          />
        </div>
      )}

      {userData.role === 'coach' && (
        <div className={`mb-6 ${mobileSection === 'overview' ? '' : 'hidden sm:hidden'}`}>
          <TeamOverview
            players={players}
            teamData={teamData}
            activeTab={activeTab}
            onSelectPlayer={id => { setActivePlayerId(id); setMobileSection('players'); }}
          />
        </div>
      )}

      <div className={(userData.role === 'coach' ? mobileSection === 'players' : ['huiswerk', 'skills', 'stats'].includes(mobileSection)) ? '' : 'hidden'}>
        {userData.role === 'coach' && (
          <div className="mb-6">
            <div className="flex gap-3 pb-3 overflow-x-auto">
              {players.map(player => {
                const assignedCount = teamData.assigned_homework_ids?.length || 0;
                const completedCount = player.completed_homework_ids?.filter(id => teamData.assigned_homework_ids?.includes(id)).length || 0;
                return (
                  <motion.div
                    key={player.id}
                    role="button"
                    tabIndex="0"
                    onClick={() => setActivePlayerId(player.id)}
                    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setActivePlayerId(player.id); }}
                    className={`relative shrink-0 flex flex-col items-start gap-2 p-3 rounded-lg transition-all duration-200 border cursor-pointer ${activePlayerId === player.id ? 'border-[#00FF9D] bg-gray-800/80' : 'border-gray-700 bg-gray-900/60 hover:bg-gray-800/60'}`}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center gap-3">
                      <img src={player.avatar_url} alt={player.name} className="w-10 h-10 rounded-full" />
                      <span className="font-medium whitespace-nowrap">{player.name}</span>
                    </div>
                    {assignedCount > 0 && (
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 pl-1">
                        <CheckCircle2 size={14} className={completedCount === assignedCount ? 'text-green-400' : 'text-gray-600'} />
                        Huiswerk: {completedCount}/{assignedCount}
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); setEditingPlayer(player); }} className="absolute -top-2 -left-2 p-1 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-transform duration-200 hover:scale-110" aria-label="Profiel bewerken"><User size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); handleRemovePlayer(player.id); }} className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-500 transition-transform duration-200 hover:scale-110" aria-label="Verwijder speler"><Trash2 size={12} /></button>
                  </motion.div>
                );
              })}
              {players.length === 0 && (
                <div className="text-center w-full py-8 border-2 border-dashed border-gray-700 rounded-lg">
                  <p className="text-gray-400">Nog geen spelers in je team.</p>
                  <p className="text-gray-500">Voeg een speler toe om te beginnen.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activePlayer ? (
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {userData.role === 'player' && (
              <motion.div className={`lg:col-span-3${mobileSection !== 'huiswerk' ? ' hidden sm:block' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <PlayerHomeworkCard player={activePlayer} customHomework={customHomework} assignedHomeworkIds={teamData.assigned_homework_ids || []} onToggleStatus={handleToggleHomeworkStatus} />
              </motion.div>
            )}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <motion.div className={userData.role === 'player' && mobileSection !== 'skills' ? 'hidden sm:block' : ''} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
              <motion.div className={userData.role === 'player' && mobileSection !== 'stats' ? 'hidden sm:block' : ''} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <TestResultsCard player={activePlayer} period={activeTab} />
              </motion.div>
              <motion.div className={userData.role === 'player' && mobileSection !== 'stats' ? 'hidden sm:block' : ''} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
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

            {/* Evaluatie panel */}
            <motion.div className={`lg:col-span-2${userData.role === 'player' && mobileSection !== 'skills' ? ' hidden sm:block' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
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
                  {userData.role === 'coach' && (
                    <ToolButton onClick={() => setIsTestsVisible(true)}>
                      <FileText size={16} /> Testen Afnemen
                    </ToolButton>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {skillKeys.map(key => (
                          <Slider key={key} label={key} value={activePlayer.evaluations[activeTab]?.skills[key] || 5} onChange={e => handleUpdateEvaluation(`skills.${key}`, parseInt(e.target.value))} disabled={userData.role !== 'coach'} />
                        ))}
                      </div>
                      <hr className="md:col-span-2 border-gray-700" />
                      <div className="space-y-6">
                        <Input label="Wedstrijdcijfer (0-10)" type="number" value={activePlayer.evaluations[activeTab]?.matchRating || ''} onChange={e => handleUpdateEvaluation('matchRating', parseFloat(e.target.value))} disabled={userData.role !== 'coach'} />
                        <Textarea label="Opmerkingen Coach" placeholder="Sterke punten, verbeterpunten..." value={activePlayer.evaluations[activeTab]?.comments || ''} onChange={e => handleUpdateEvaluation('comments', e.target.value)} disabled={userData.role !== 'coach'}>
                          {userData.role === 'coach' && (
                            <button onClick={handleGenerateComments} disabled={isGenerating.comments} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                              {isGenerating.comments ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} className="text-[--neon-color]" />}
                              ✨ Genereer
                            </button>
                          )}
                        </Textarea>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Conditietests (Wedstrijd)</label>
                          <div className="space-y-2">
                            <Input label="" placeholder="YoYo Test" value={activePlayer.evaluations[activeTab]?.fitness.yoyo || ''} onChange={e => handleUpdateEvaluation('fitness.yoyo', e.target.value)} disabled={userData.role !== 'coach'} />
                            <Input label="" placeholder="Coopertest" value={activePlayer.evaluations[activeTab]?.fitness.cooper || ''} onChange={e => handleUpdateEvaluation('fitness.cooper', e.target.value)} disabled={userData.role !== 'coach'} />
                            <Input label="" placeholder="Sprint 30m" value={activePlayer.evaluations[activeTab]?.fitness.sprint || ''} onChange={e => handleUpdateEvaluation('fitness.sprint', e.target.value)} disabled={userData.role !== 'coach'} />
                          </div>
                        </div>
                        <Textarea label="Persoonlijk Oefenplan" placeholder="Specifieke oefeningen voor deze speler..." value={activePlayer.evaluations[activeTab]?.trainingPlan || ''} onChange={e => handleUpdateEvaluation('trainingPlan', e.target.value)} disabled={userData.role !== 'coach'}>
                          {userData.role === 'coach' && (
                            <button onClick={handleGeneratePlan} disabled={isGenerating.plan} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                              {isGenerating.plan ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} className="text-[--neon-color]" />}
                              ✨ Genereer
                            </button>
                          )}
                        </Textarea>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </Card>
            </motion.div>
          </main>
        ) : (
          <div className="text-center py-20">
            <User size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400">Welkom!</h2>
            <p className="text-gray-500 mt-2">{userData.role === 'player' ? 'Jouw data wordt geladen...' : 'Selecteer een speler om te beginnen of wacht tot spelers zich aanmelden.'}</p>
          </div>
        )}
      </div>

      {/* Bottom nav mobiel */}
      <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-30" style={{ background: 'rgba(9,11,15,0.97)', backdropFilter: 'blur(20px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {userData.role === 'coach' ? (
            <>
              <button onClick={() => setMobileSection('players')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'players' ? NEON_COLOR : '#6b7280' }}>
                <UserSquare size={22} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Spelers</span>
              </button>
              <button onClick={() => setMobileSection('overview')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'overview' ? NEON_COLOR : '#6b7280' }}>
                <LayoutDashboard size={22} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Overzicht</span>
              </button>
              <button onClick={() => setMobileSection('questions')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'questions' ? NEON_COLOR : '#6b7280' }}>
                <ListPlus size={22} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Vragen</span>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
