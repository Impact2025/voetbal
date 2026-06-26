import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Flame, Bell, BellOff, Loader2, MessageSquare,
  Calendar, TrendingUp, Home, Settings, CheckCircle2,
  XCircle, Shield, Star, AlertTriangle, ChevronRight, Trophy,
} from 'lucide-react';

const MessagingInbox = lazy(() => import('../messaging/MessagingInbox'));
import { supabase } from '../../lib/supabase';
import { COACH_COLOR } from '../../utils/constants';
import { TIER_CONFIG, tierProgress } from '../../lib/cardTier';
import { CHALLENGES, CATEGORY_META } from '../../data/challenges';
import type {
  Player, PlayerStats, Streak, NotificationPrefs,
  StatAxis, UserData, AttendanceRecord,
} from '../../types';

const ACCENT = COACH_COLOR;

type ParentTab = 'vandaag' | 'groei' | 'agenda' | 'berichten' | 'meer';

const PARENT_TABS = [
  { id: 'vandaag'   as ParentTab, label: 'Vandaag',   icon: Home },
  { id: 'groei'     as ParentTab, label: 'Groei',     icon: TrendingUp },
  { id: 'agenda'    as ParentTab, label: 'Agenda',    icon: Calendar },
  { id: 'berichten' as ParentTab, label: 'Berichten', icon: MessageSquare },
  { id: 'meer'      as ParentTab, label: 'Meer',      icon: Settings },
];

const AXIS_LABELS: Record<StatAxis, string> = {
  consistentie: 'Consistentie',
  werkethiek:   'Werkethiek',
  techniek:     'Techniek',
  focus:        'Focus',
  team_spirit:  'Teamspirit',
};
const AXIS_ORDER: StatAxis[] = ['consistentie', 'werkethiek', 'techniek', 'focus', 'team_spirit'];

function softLabel(v: number) {
  if (v >= 67) return { text: 'Sterk',     color: ACCENT };
  if (v >= 34) return { text: 'Stevig',    color: '#d97706' };
  return             { text: 'In Opbouw', color: '#9ca3af' };
}

const SOCKS_QUOTES = [
  'Elke keer dat {naam} iets doet, groeit er iets. Dat is topsport.',
  '{naam} laat zien dat doorzetten telt. Jij ziet het ook.',
  'De beste coaches zijn de ouders die vragen hoe het was — niet hoeveel goals.',
  'Samen spelen is het beste trainen. Vraag {naam} om een uitdaging te laten zien.',
  'Trots zijn op inzet is mooier dan trots zijn op een score.',
  'Een kind dat plezier heeft in trainen, komt vanzelf verder. Geef dat ruimte.',
  'Kleine stappen elke dag zijn groter dan één grote sprong per maand.',
];

function getSocksQuote(name: string) {
  const q = SOCKS_QUOTES[Math.floor(Date.now() / 86400000) % SOCKS_QUOTES.length];
  return q.replace(/{naam}/g, name.split(' ')[0]);
}

function getWeeklyChallenge(player: Player) {
  const age = parseInt(player.age ?? '10', 10);
  const pool = CHALLENGES.filter(c => age >= c.age_min && age <= c.age_max);
  if (!pool.length) return null;
  return pool[Math.floor(Date.now() / (86400000 * 7)) % pool.length];
}

const TIER_NEXT_LABEL: Record<string, string> = {
  brons: 'Zilver', zilver: 'Goud', goud: 'Legendary', legendary: '',
};

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_PLAYER: Player = {
  id: 'demo', name: 'Demo Kind', team_id: 'demo-team', age: '10',
  preferred_foot: 'rechts', position: 'Middenvelder', pin: '0000',
  avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DemoKind',
  evaluations: {}, completed_homework_ids: [], weekly_question_responses: [],
};
const DEMO_STATS: PlayerStats = {
  player_id: 'demo', team_id: 'demo-team',
  consistentie: 72, werkethiek: 58, techniek: 41, focus: 35, team_spirit: 80,
  tier: 'zilver', total_xp: 240, prev_snapshot: null, snapshot_at: null,
  updated_at: new Date().toISOString(),
};
const DEMO_STREAK: Streak = {
  player_id: 'demo', week_start: new Date().toISOString(),
  activities_count: 1, week_goal: 2, best_week_count: 4, recovery_used: false,
  flame_state: 'active', updated_at: new Date().toISOString(),
};
const DEMO_PREFS: NotificationPrefs = {
  parent_id: 'demo', weekly_digest: true, critical_alerts: true,
  channel: 'email', detail_level: 'light', updated_at: new Date().toISOString(),
};
const DEMO_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', team_id: 'dt', player_id: 'demo', session_date: new Date(Date.now() -  2*86400000).toISOString(), session_type: 'training',  present: true },
  { id: '2', team_id: 'dt', player_id: 'demo', session_date: new Date(Date.now() -  5*86400000).toISOString(), session_type: 'training',  present: true },
  { id: '3', team_id: 'dt', player_id: 'demo', session_date: new Date(Date.now() -  9*86400000).toISOString(), session_type: 'wedstrijd', present: false },
  { id: '4', team_id: 'dt', player_id: 'demo', session_date: new Date(Date.now() - 12*86400000).toISOString(), session_type: 'training',  present: true },
  { id: '5', team_id: 'dt', player_id: 'demo', session_date: new Date(Date.now() - 16*86400000).toISOString(), session_type: 'training',  present: true },
];

// ─── Toggle component ────────────────────────────────────────────────────────

function Toggle({ on, color = ACCENT }: { on: boolean; color?: string }) {
  return (
    <div className="w-11 h-6 rounded-full relative shrink-0 transition-colors"
      style={{ backgroundColor: on ? color : '#e5e7eb' }}>
      <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
        style={{ left: on ? '23px' : '4px' }} />
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ParentDashboardProps {
  userData: UserData;
  onLogout: () => void;
  demo?: boolean;
}

const ParentDashboard = ({ userData, onLogout, demo = false }: ParentDashboardProps) => {
  const [activeTab, setActiveTab]     = useState<ParentTab>('vandaag');
  const [player, setPlayer]           = useState<Player | null>(demo ? DEMO_PLAYER : null);
  const [stats, setStats]             = useState<PlayerStats | null>(demo ? DEMO_STATS : null);
  const [streak, setStreak]           = useState<Streak | null>(demo ? DEMO_STREAK : null);
  const [notifPrefs, setNotifPrefs]   = useState<NotificationPrefs | null>(demo ? DEMO_PREFS : null);
  const [attendance, setAttendance]   = useState<AttendanceRecord[]>(demo ? DEMO_ATTENDANCE : []);
  const [loading, setLoading]         = useState(!demo);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [npsScore, setNpsScore]         = useState<number | null>(null);
  const [npsFeedback, setNpsFeedback]   = useState('');
  const [npsSubmitted, setNpsSubmitted] = useState(false);
  const [showNpsModal, setShowNpsModal] = useState(false);
  const [savingNps, setSavingNps]       = useState(false);

  const [consented, setConsented]             = useState<boolean | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [savingConsent, setSavingConsent]     = useState(false);

  const pid = userData.linkedPlayerId;

  useEffect(() => {
    if (demo) return;
    if (!pid) { setLoading(false); return; }

    Promise.allSettled([
      supabase.from('players').select('*').eq('id', pid).single(),
      supabase.from('player_stats').select('*').eq('player_id', pid).maybeSingle(),
      supabase.from('streaks').select('*').eq('player_id', pid).maybeSingle(),
      supabase.from('notification_prefs').select('*').eq('parent_id', userData.uid).maybeSingle(),
      supabase.from('attendance').select('*').eq('player_id', pid).order('session_date', { ascending: false }).limit(20),
    ]).then(([pR, sR, stR, nR, aR]) => {
      if (pR.status  === 'fulfilled' && pR.value.data)  setPlayer(pR.value.data as Player);
      if (sR.status  === 'fulfilled' && sR.value.data)  setStats(sR.value.data as PlayerStats);
      if (stR.status === 'fulfilled' && stR.value.data) setStreak(stR.value.data as Streak);
      if (nR.status  === 'fulfilled' && nR.value.data)  setNotifPrefs(nR.value.data as NotificationPrefs);
      if (aR.status  === 'fulfilled' && aR.value.data)  setAttendance(aR.value.data as AttendanceRecord[]);
      setLoading(false);
    });

    // NPS: show after 7 days if not yet submitted
    supabase.from('parent_nps').select('id').eq('parent_id', userData.uid).maybeSingle()
      .then(({ data, error }) => {
        if (error) return;
        if (data) { setNpsSubmitted(true); return; }
        supabase.from('parent_links').select('created_at').eq('parent_id', userData.uid).maybeSingle()
          .then(({ data: link }) => {
            if (!link) return;
            const days = (Date.now() - new Date(link.created_at).getTime()) / 86400000;
            if (days >= 7) setShowNpsModal(true);
          });
      });

    // VPC consent
    supabase.from('parent_consents').select('consented_at').eq('parent_id', userData.uid).eq('player_id', pid).maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          const stored = localStorage.getItem(`vpc_${userData.uid}_${pid}`);
          if (stored) setConsented(true);
          else { setConsented(false); setShowConsentModal(true); }
          return;
        }
        if (data) setConsented(true);
        else { setConsented(false); setShowConsentModal(true); }
      });
  }, [demo, pid, userData.uid]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTogglePref = async (key: 'weekly_digest' | 'critical_alerts') => {
    if (!notifPrefs || savingPrefs) return;
    const newVal = !notifPrefs[key];
    if (demo) { setNotifPrefs(p => p ? { ...p, [key]: newVal } : p); return; }
    setSavingPrefs(true);
    await supabase.from('notification_prefs').update({ [key]: newVal }).eq('parent_id', userData.uid);
    setNotifPrefs(p => p ? { ...p, [key]: newVal } : p);
    setSavingPrefs(false);
  };

  const handleSubmitNps = async () => {
    if (npsScore === null || savingNps) return;
    setSavingNps(true);
    if (!demo) {
      await supabase.from('parent_nps')
        .insert({ parent_id: userData.uid, score: npsScore, feedback: npsFeedback || null })
        .catch(() => {});
    }
    setNpsSubmitted(true);
    setShowNpsModal(false);
    setSavingNps(false);
  };

  const handleConsent = async () => {
    if (savingConsent) return;
    setSavingConsent(true);
    if (!demo && pid) {
      const { error } = await supabase.from('parent_consents')
        .upsert({ parent_id: userData.uid, player_id: pid, consent_version: '1.0', consented_at: new Date().toISOString() });
      if (error) localStorage.setItem(`vpc_${userData.uid}_${pid}`, new Date().toISOString());
    }
    setConsented(true);
    setShowConsentModal(false);
    setSavingConsent(false);
  };

  // ── Loading / empty ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10" style={{ color: ACCENT }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-gray-50">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Shield size={24} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Nog geen koppeling</h2>
        <p className="text-sm text-gray-500 max-w-xs">Vraag de coach om een koppelcode en koppel jouw account opnieuw.</p>
        <button onClick={onLogout}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-bold text-red-500 border border-red-200 bg-white hover:bg-red-50 transition-colors min-h-[44px]">
          Uitloggen
        </button>
      </div>
    );
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const tier        = stats?.tier ?? 'brons';
  const tierCfg     = TIER_CONFIG[tier];
  const firstName   = player.name.split(' ')[0];
  const totalXP     = stats?.total_xp ?? 0;
  const weekCount   = streak?.activities_count ?? 0;
  const weekGoal    = streak?.week_goal ?? 2;
  const isComplete  = streak?.flame_state === 'complete';
  const challenge   = getWeeklyChallenge(player);
  const challMeta   = challenge ? CATEGORY_META[challenge.category] : null;
  const xpPct       = tierProgress(totalXP, tier);

  // PREVENT: no activity and it's Thursday or later in the week
  const dow = new Date().getDay();
  const showPrevent = !isComplete && weekCount === 0 && (dow >= 4 || dow === 0) && totalXP > 0;

  const attendTotal   = attendance.length;
  const attendPresent = attendance.filter(r => r.present).length;
  const attendRate    = attendTotal > 0 ? Math.round((attendPresent / attendTotal) * 100) : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── VPC Consent Modal ── */}
      <AnimatePresence>
        {showConsentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full max-w-lg bg-white rounded-t-3xl p-6 space-y-5"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: `${ACCENT}12` }}>
                  <Shield size={22} style={{ color: ACCENT }} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Jouw toestemming</h2>
                  <p className="text-xs text-gray-500">Verplicht voor spelers onder 16 jaar (AVG)</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-sm text-gray-700 mb-3">Skillkaart verwerkt de volgende gegevens van {firstName}:</p>
                {[
                  'Naam, leeftijd, positie en avatar',
                  'Inzet-statistieken (XP, streak, aanwezigheid)',
                  'Ingediend huiswerk en uitdagingen',
                  'Berichtverkeer met de coach',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    {item}
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed pt-2 border-t border-gray-100">
                  Gegevens worden nooit verkocht of gedeeld met derden. Intrekken kan altijd via Meer → Privacy.
                </p>
              </div>
              <button onClick={handleConsent} disabled={savingConsent}
                className="w-full py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 min-h-[52px] hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ACCENT }}>
                {savingConsent ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                Ik geef toestemming
              </button>
              <button onClick={onLogout} className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Nee, uitloggen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NPS Modal ── */}
      <AnimatePresence>
        {showNpsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowNpsModal(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full max-w-lg bg-white rounded-t-3xl p-6 space-y-4"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Star size={28} style={{ color: '#d97706' }} />
                </div>
                <h2 className="text-lg font-black text-gray-900">Hoe tevreden ben jij?</h2>
                <p className="text-sm text-gray-500 mt-1">Hoe blij ben jij met Skillkaart voor {firstName}?</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => {
                  const sel   = npsScore === n;
                  const color = n <= 3 ? '#ef4444' : n <= 6 ? '#f59e0b' : '#10b981';
                  return (
                    <button key={n} onClick={() => setNpsScore(n)}
                      className="h-11 rounded-xl font-black text-sm transition-all border-2 min-h-[44px]"
                      style={{
                        backgroundColor: sel ? color : `${color}18`,
                        borderColor: sel ? color : 'transparent',
                        color: sel ? 'white' : color,
                      }}>
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 px-1">
                <span>Niet blij</span><span>Heel blij</span>
              </div>
              {npsScore !== null && npsScore >= 9 && (
                <textarea value={npsFeedback} onChange={e => setNpsFeedback(e.target.value)}
                  placeholder={`Wat maakt Skillkaart waardevol voor ${firstName}?`}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              )}
              <button onClick={handleSubmitNps} disabled={npsScore === null || savingNps}
                className="w-full py-3.5 rounded-2xl font-black text-white min-h-[48px] disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ACCENT }}>
                {savingNps ? 'Versturen...' : 'Verstuur beoordeling'}
              </button>
              <button onClick={() => setShowNpsModal(false)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Misschien later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img src={player.avatar_url} alt={player.name}
            className="w-9 h-9 rounded-xl shrink-0 border-2"
            style={{ borderColor: `${tierCfg.color}50` }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 truncate">{player.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest"
                style={{ backgroundColor: `${tierCfg.color}15`, color: tierCfg.color }}>
                {tierCfg.label}
              </span>
              <span className="text-[10px] text-gray-400">{totalXP} XP</span>
            </div>
          </div>
          <button onClick={onLogout}
            className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-lg mx-auto w-full px-4 pt-5 pb-28">
        <AnimatePresence mode="wait">

          {/* ─── VANDAAG ─── */}
          {activeTab === 'vandaag' && (
            <motion.div key="vandaag"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }} className="space-y-4">

              {showPrevent && (
                <div className="rounded-2xl border p-4 flex items-start gap-3"
                  style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: '#d97706' }} />
                  <div>
                    <p className="text-sm font-bold text-amber-800">{firstName} heeft deze week nog geen activiteiten</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Misschien een goed moment voor de Samen-Doen challenge hieronder? 10 minuten is al genoeg.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Socks zegt</p>
                <p className="text-sm text-gray-700 leading-relaxed italic">"{getSocksQuote(player.name)}"</p>
              </div>

              <div className="rounded-2xl border p-4"
                style={{ backgroundColor: isComplete ? '#f0fdf4' : 'white', borderColor: isComplete ? '#bbf7d0' : '#f3f4f6' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Deze week</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isComplete ? '#dcfce7' : '#fff7ed' }}>
                    <Flame size={28}
                      fill={isComplete ? ACCENT : '#f97316'}
                      style={{ color: isComplete ? ACCENT : '#f97316' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      {Array.from({ length: weekGoal }, (_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full transition-colors"
                          style={{ backgroundColor: i < weekCount ? (isComplete ? ACCENT : '#f97316') : '#e5e7eb' }} />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {isComplete
                        ? `${firstName} heeft het weekdoel behaald`
                        : weekCount === 0
                        ? `${firstName} is nog niet bezig deze week`
                        : `${firstName} deed ${weekCount} van ${weekGoal} acties`}
                    </p>
                    {(streak?.best_week_count ?? 0) > 1 && (
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Trophy size={10} />
                        Record: {streak!.best_week_count} acties in één week
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {challenge && challMeta && (
                <div className="rounded-2xl border p-4"
                  style={{ borderColor: `${challMeta.color}40`, backgroundColor: `${challMeta.color}08` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: challMeta.color }}>
                    Samen doen deze week
                  </p>
                  <p className="text-sm font-bold text-gray-900 mb-1">{challenge.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{challenge.setup}</p>
                  <div className="rounded-xl p-3 border text-xs font-semibold text-gray-700 flex items-start gap-2"
                    style={{ backgroundColor: `${challMeta.color}12`, borderColor: `${challMeta.color}30` }}>
                    <Trophy size={13} className="mt-0.5 shrink-0" style={{ color: challMeta.color }} />
                    {challenge.win_condition}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
                    10 minuten in de tuin of het park is al genoeg.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── GROEI ─── */}
          {activeTab === 'groei' && (
            <motion.div key="groei"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }} className="space-y-4">

              <div className="rounded-2xl border-2 bg-white p-5"
                style={{ borderColor: `${tierCfg.color}50` }}>
                <div className="flex items-center gap-4">
                  <img src={player.avatar_url} alt={player.name}
                    className="w-14 h-14 rounded-2xl shrink-0 border-2"
                    style={{ borderColor: `${tierCfg.color}40` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{firstName}s groeiprofiel</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-black px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${tierCfg.color}18`, color: tierCfg.color }}>
                        {tierCfg.label}
                      </span>
                      <span className="text-xs text-gray-400">{totalXP} XP</span>
                    </div>
                    {tier !== 'legendary' ? (
                      <>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ backgroundColor: tierCfg.color }} />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">
                          {xpPct}% naar {TIER_NEXT_LABEL[tier]}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-bold" style={{ color: tierCfg.color }}>
                        Hoogste niveau bereikt
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Inzet-DNA van {firstName}
                </p>
                {totalXP === 0 ? (
                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    {firstName} bouwt dit op door huiswerk en uitdagingen te doen.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {AXIS_ORDER.map(axis => {
                      const val  = stats?.[axis] ?? 0;
                      const soft = softLabel(val);
                      return (
                        <div key={axis} className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-500 w-24 shrink-0">{AXIS_LABELS[axis]}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <motion.div className="h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              style={{ backgroundColor: soft.color }} />
                          </div>
                          <span className="text-[10px] font-semibold w-20 text-right shrink-0"
                            style={{ color: soft.color }}>
                            {soft.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-3 leading-relaxed border-t border-gray-50 pt-3">
                  Inzet-statistieken gebaseerd op gedrag — geen cijfers of vergelijking met anderen.
                </p>
              </div>

              {attendRate !== null && (
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Aanwezigheid</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg"
                      style={{
                        backgroundColor: attendRate >= 80 ? '#f0fdf4' : attendRate >= 60 ? '#fffbeb' : '#fef2f2',
                        color: attendRate >= 80 ? ACCENT : attendRate >= 60 ? '#d97706' : '#ef4444',
                      }}>
                      {attendRate}%
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {attendPresent} van {attendTotal} sessies aanwezig
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {attendRate >= 80
                          ? 'Uitstekende aanwezigheid'
                          : attendRate >= 60
                          ? 'Er is ruimte voor verbetering'
                          : 'Lage aanwezigheid — let op'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── AGENDA ─── */}
          {activeTab === 'agenda' && (
            <motion.div key="agenda"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }} className="space-y-4">

              <div>
                <h2 className="text-base font-black text-gray-900">Agenda</h2>
                <p className="text-xs text-gray-500 mt-0.5">Trainingen en wedstrijden van {firstName}</p>
              </div>

              {attendance.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl bg-white">
                  <Calendar size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm font-bold text-gray-900">Nog geen sessies geregistreerd</p>
                  <p className="text-xs text-gray-400 mt-1">De coach registreert trainingen en wedstrijden</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {attendance.map((rec, idx) => {
                    const d       = new Date(rec.session_date);
                    const isMatch = rec.session_type === 'wedstrijd';
                    return (
                      <motion.div key={rec.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.035 }}
                        className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 min-h-[68px]">
                        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-gray-50">
                          <span className="text-[9px] font-bold uppercase text-gray-400">
                            {d.toLocaleDateString('nl-NL', { month: 'short' })}
                          </span>
                          <span className="text-lg font-black text-gray-800 leading-none">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: isMatch ? '#fef3c7' : '#f0fdf4',
                                color: isMatch ? '#92400e' : ACCENT,
                              }}>
                              {isMatch ? 'Wedstrijd' : 'Training'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                            {d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {rec.present
                            ? <CheckCircle2 size={22} style={{ color: ACCENT }} />
                            : <XCircle size={22} className="text-red-400" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── BERICHTEN ─── */}
          {activeTab === 'berichten' && (
            <motion.div key="berichten"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{ height: 'calc(100vh - 200px)' }}>
              {demo ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-200 rounded-2xl bg-white">
                  <MessageSquare size={28} className="mb-2 text-gray-200" />
                  <p className="text-sm font-bold text-gray-400">Berichten niet beschikbaar in demo</p>
                </div>
              ) : (
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />}>
                  <MessagingInbox
                    currentUserId={userData.uid}
                    currentUserName={`Ouder van ${firstName}`}
                    currentUserRole="parent"
                    className="h-full"
                    onUnreadChange={setUnreadMessages}
                  />
                </Suspense>
              )}
            </motion.div>
          )}

          {/* ─── MEER ─── */}
          {activeTab === 'meer' && (
            <motion.div key="meer"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }} className="space-y-4">

              {/* Notifications */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Meldingen</p>

                <button onClick={() => handleTogglePref('weekly_digest')} disabled={savingPrefs}
                  className="w-full flex items-center justify-between py-3.5 min-h-[56px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: notifPrefs?.weekly_digest ? `${ACCENT}12` : '#f9fafb' }}>
                      {notifPrefs?.weekly_digest
                        ? <Bell size={16} style={{ color: ACCENT }} />
                        : <BellOff size={16} className="text-gray-400" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">Wekelijkse update</p>
                      <p className="text-[10px] text-gray-400">Elke vrijdag een update over {firstName}</p>
                    </div>
                  </div>
                  <Toggle on={!!notifPrefs?.weekly_digest} />
                </button>

                <div className="h-px bg-gray-50 mx-1" />

                <button onClick={() => handleTogglePref('critical_alerts')} disabled={savingPrefs}
                  className="w-full flex items-center justify-between py-3.5 min-h-[56px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl"
                      style={{ backgroundColor: notifPrefs?.critical_alerts ? '#fef2f2' : '#f9fafb' }}>
                      <AlertTriangle size={16}
                        style={{ color: notifPrefs?.critical_alerts ? '#ef4444' : '#9ca3af' }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">Signaalberichten</p>
                      <p className="text-[10px] text-gray-400">Melding als {firstName} langere tijd inactief is</p>
                    </div>
                  </div>
                  <Toggle on={!!notifPrefs?.critical_alerts} color="#ef4444" />
                </button>
              </div>

              {/* Privacy */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Privacy</p>
                <div className="flex items-center gap-3 py-3 min-h-[56px]">
                  <div className="p-2 rounded-xl"
                    style={{ backgroundColor: consented ? `${ACCENT}12` : '#fef2f2' }}>
                    <Shield size={16} style={{ color: consented ? ACCENT : '#ef4444' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-900">AVG-toestemming</p>
                    <p className="text-[10px] text-gray-400">
                      {consented ? 'Verleend — gegevens verwerkt conform AVG' : 'Nog niet verleend'}
                    </p>
                  </div>
                  {!consented && (
                    <button onClick={() => setShowConsentModal(true)}
                      className="text-xs font-bold px-3 py-2 rounded-xl min-h-[36px]"
                      style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}>
                      Verlenen
                    </button>
                  )}
                </div>
              </div>

              {/* NPS */}
              {!npsSubmitted ? (
                <button onClick={() => setShowNpsModal(true)}
                  className="w-full rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3 min-h-[64px] hover:bg-gray-50 transition-colors text-left">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: '#fffbeb' }}>
                    <Star size={16} style={{ color: '#d97706' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Geef feedback</p>
                    <p className="text-[10px] text-gray-400">Hoe tevreden ben jij met Skillkaart?</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3 min-h-[56px]">
                  <CheckCircle2 size={18} style={{ color: ACCENT }} />
                  <p className="text-sm text-gray-600">Bedankt voor je feedback!</p>
                </div>
              )}

              <button onClick={onLogout}
                className="w-full py-4 rounded-2xl font-bold text-red-500 border border-red-100 bg-white hover:bg-red-50 transition-colors min-h-[52px]">
                Uitloggen
              </button>

              <p className="text-[9px] text-gray-400 text-center leading-relaxed px-2 pb-4">
                Je ziet alleen inzet-data van jouw kind — geen ranglijsten of vergelijking met andere kinderen.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #f3f4f6',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="max-w-lg mx-auto flex">
          {PARENT_TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const badge  = id === 'berichten' && unreadMessages > 0;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 relative min-h-[56px] active:opacity-60 transition-opacity"
                style={{ color: active ? ACCENT : '#9ca3af' }}>
                {active && (
                  <span className="absolute top-0 left-4 right-4 h-0.5 rounded-b-full"
                    style={{ background: ACCENT }} />
                )}
                <Icon size={21} />
                <span className="text-[9px] font-bold tracking-wide uppercase">{label}</span>
                {badge && (
                  <span className="absolute top-2 right-[18%] w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-black">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ParentDashboard;
