import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Flame, Bell, BellOff, Loader2, MessageSquare } from 'lucide-react';

const MessagingInbox = lazy(() => import('../messaging/MessagingInbox'));
import { supabase } from '../../lib/supabase';
import { NEON_COLOR } from '../../utils/constants';
import { TIER_CONFIG } from '../../lib/cardTier';
import { CHALLENGES, CATEGORY_META } from '../../data/challenges';
import type { Player, PlayerStats, Streak, NotificationPrefs, StatAxis, UserData } from '../../types';

const ACCENT = '#16A34A';

const AXIS_LABELS: Record<StatAxis, string> = {
  consistentie: 'Consistentie',
  werkethiek:   'Werkethiek',
  techniek:     'Techniek',
  focus:        'Focus',
  team_spirit:  'Team Spirit',
};

const AXIS_ORDER: StatAxis[] = ['consistentie', 'werkethiek', 'techniek', 'focus', 'team_spirit'];

function softLabel(value: number): { text: string; emoji: string } {
  if (value >= 67) return { text: 'Sterk',     emoji: '⭐' };
  if (value >= 34) return { text: 'Stevig',    emoji: '💪' };
  return               { text: 'In Opbouw', emoji: '🌱' };
}

const SOCKS_QUOTES = [
  'Elke keer dat {naam} iets doet, groeit er iets. Dat is topsport.',
  '{naam} laat zien dat doorzetten telt. Jij ziet het ook.',
  'De beste coaches zijn de ouders die vragen hoe het was — niet hoeveel goals.',
  'Samen spelen is het beste trainen. Vraag {naam} om een uitdaging te laten zien.',
  'Trots zijn op inzet is mooier dan trots zijn op een score.',
];

function getSocksQuote(playerName: string): string {
  const idx = Math.floor(Date.now() / 86400000) % SOCKS_QUOTES.length;
  return SOCKS_QUOTES[idx].replace(/{naam}/g, playerName.split(' ')[0]);
}

function getRandomChallenge(player: Player) {
  const age = parseInt(player.age ?? '10', 10);
  const eligible = CHALLENGES.filter(c => age >= c.age_min && age <= c.age_max);
  return eligible[Math.floor(Math.random() * eligible.length)];
}

interface ParentDashboardProps {
  userData: UserData;
  onLogout: () => void;
  demo?: boolean;
}

const DEMO_PLAYER: Player = {
  id: 'demo-player', name: 'Demo Kind', team_id: 'demo-team', age: '10',
  preferred_foot: 'rechts', position: 'Middenvelder', pin: '0000',
  avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DemoKind',
  evaluations: {}, completed_homework_ids: [], weekly_question_responses: [],
};
const DEMO_STATS: PlayerStats = {
  player_id: 'demo-player', team_id: 'demo-team',
  consistentie: 72, werkethiek: 58, techniek: 41, focus: 35, team_spirit: 80,
  tier: 'zilver', total_xp: 240, prev_snapshot: null, snapshot_at: null,
  updated_at: new Date().toISOString(),
};
const DEMO_STREAK: Streak = {
  player_id: 'demo-player', week_start: new Date().toISOString(),
  activities_count: 1, week_goal: 2, best_week_count: 4, recovery_used: false,
  flame_state: 'active', updated_at: new Date().toISOString(),
};
const DEMO_PREFS: NotificationPrefs = {
  parent_id: 'demo-parent', weekly_digest: true, critical_alerts: true,
  channel: 'email', detail_level: 'light', updated_at: new Date().toISOString(),
};

const ParentDashboard = ({ userData, onLogout, demo = false }: ParentDashboardProps) => {
  const [player, setPlayer]           = useState<Player | null>(demo ? DEMO_PLAYER : null);
  const [stats, setStats]             = useState<PlayerStats | null>(demo ? DEMO_STATS : null);
  const [streak, setStreak]           = useState<Streak | null>(demo ? DEMO_STREAK : null);
  const [notifPrefs, setNotifPrefs]   = useState<NotificationPrefs | null>(demo ? DEMO_PREFS : null);
  const [loading, setLoading]         = useState(!demo);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const linkedPlayerId = userData.linkedPlayerId;

  useEffect(() => {
    if (demo) { setLoading(false); return; }
    if (!linkedPlayerId) { setLoading(false); return; }

    Promise.allSettled([
      supabase.from('players').select('*').eq('id', linkedPlayerId).single(),
      supabase.from('player_stats').select('*').eq('player_id', linkedPlayerId).maybeSingle(),
      supabase.from('streaks').select('*').eq('player_id', linkedPlayerId).maybeSingle(),
      supabase.from('notification_prefs').select('*').eq('parent_id', userData.uid).maybeSingle(),
    ]).then(([playerRes, statsRes, streakRes, prefsRes]) => {
      if (playerRes.status === 'fulfilled' && playerRes.value.data) setPlayer(playerRes.value.data as Player);
      if (statsRes.status === 'fulfilled' && statsRes.value.data)   setStats(statsRes.value.data as PlayerStats);
      if (streakRes.status === 'fulfilled' && streakRes.value.data)  setStreak(streakRes.value.data as Streak);
      if (prefsRes.status === 'fulfilled' && prefsRes.value.data)    setNotifPrefs(prefsRes.value.data as NotificationPrefs);
      setLoading(false);
    });
  }, [demo, linkedPlayerId, userData.uid]);

  const handleToggleDigest = async () => {
    if (!notifPrefs || savingPrefs) return;
    const newVal = !notifPrefs.weekly_digest;
    if (demo) { setNotifPrefs(p => p ? { ...p, weekly_digest: newVal } : p); return; }
    setSavingPrefs(true);
    await supabase.from('notification_prefs')
      .update({ weekly_digest: newVal })
      .eq('parent_id', userData.uid);
    setNotifPrefs(p => p ? { ...p, weekly_digest: newVal } : p);
    setSavingPrefs(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin h-10 w-10" style={{ color: ACCENT }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-white">
        <div className="text-4xl">⚽</div>
        <h2 className="text-xl font-black text-gray-900">Nog geen koppeling gevonden</h2>
        <p className="text-sm text-gray-500">Vraag de coach om een koppelcode en link jouw account opnieuw.</p>
        <button onClick={onLogout} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
          Uitloggen
        </button>
      </div>
    );
  }

  const tier        = stats?.tier ?? 'brons';
  const tierCfg     = TIER_CONFIG[tier];
  const firstName   = player.name.split(' ')[0];
  const totalXP     = stats?.total_xp ?? 0;
  const weekCount   = streak?.activities_count ?? 0;
  const weekGoal    = streak?.week_goal ?? 2;
  const isComplete  = streak?.flame_state === 'complete';
  const socksQuote  = getSocksQuote(player.name);
  const suggestion  = getRandomChallenge(player);
  const suggMeta    = suggestion ? CATEGORY_META[suggestion.category] : null;

  return (
    <div className="min-h-screen pb-10 bg-white" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>

      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚽</span>
          <span className="text-sm font-black text-gray-900">Ouder-portaal</span>
        </div>
        <button onClick={onLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
          <LogOut size={16} />
        </button>
      </header>

      <div className="max-w-sm mx-auto px-4 pt-6 space-y-4">

        {/* Child card — keeps tier gradient, looks great on white */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden border p-5"
          style={{
            background: `linear-gradient(145deg, ${tierCfg.bgFrom}, ${tierCfg.bgTo})`,
            borderColor: `${tierCfg.color}40`,
            boxShadow: `0 4px 24px ${tierCfg.glow}`,
          }}
        >
          <div className="flex items-center gap-4">
            <img src={player.avatar_url} alt={player.name}
              className="w-16 h-16 rounded-2xl border-2 shrink-0"
              style={{ borderColor: `${tierCfg.color}60` }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white truncate">{player.name}</h2>
              <p className="text-xs text-white/60">{player.age ? `${player.age} jaar` : ''}{player.position ? ` · ${player.position}` : ''}</p>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{ backgroundColor: `${tierCfg.color}20`, color: tierCfg.color, border: `1px solid ${tierCfg.color}40` }}
                >
                  {tierCfg.label}
                </div>
                <span className="text-[10px] text-white/40">{totalXP} XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Socks quote */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">⚽ Socks zegt</p>
          <p className="text-sm text-gray-700 leading-relaxed italic">"{socksQuote}"</p>
        </motion.div>

        {/* Deze week */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border p-4"
          style={{
            background: isComplete ? '#f0fdf4' : '#f9fafb',
            borderColor: isComplete ? '#bbf7d0' : '#f3f4f6',
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Deze week</p>
          <div className="flex items-center gap-3">
            <Flame
              size={28}
              style={{ color: isComplete ? ACCENT : '#f97316' }}
              fill={isComplete ? ACCENT : '#f97316'}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                {Array.from({ length: weekGoal }, (_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: i < weekCount ? (isComplete ? ACCENT : '#f97316') : '#e5e7eb' }}
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-gray-900">
                {isComplete
                  ? `${firstName} heeft het weekdoel behaald! 🎉`
                  : weekCount === 0
                  ? `${firstName} is nog niet bezig deze week`
                  : `${firstName} deed ${weekCount} van ${weekGoal} acties`
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Inzet-DNA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            Inzet-DNA van {firstName}
          </p>
          {totalXP === 0 ? (
            <p className="text-xs text-gray-400 italic">Nog geen data — {firstName} bouwt dit op door huiswerk en uitdagingen te doen.</p>
          ) : (
            <div className="space-y-2.5">
              {AXIS_ORDER.map(axis => {
                const value = stats?.[axis] ?? 0;
                const soft = softLabel(value);
                return (
                  <div key={axis} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 w-24 shrink-0">{AXIS_LABELS[axis]}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{ backgroundColor: value >= 67 ? ACCENT : value >= 34 ? '#d97706' : '#9ca3af' }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0 w-24 text-right">
                      {soft.emoji} {soft.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
            Dit zijn geen schoolcijfers — het zijn inzet-statistieken berekend uit gedrag.
          </p>
        </motion.div>

        {/* Samen doen */}
        {suggestion && suggMeta && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border p-4"
            style={{ borderColor: `${suggMeta.color}40`, backgroundColor: `${suggMeta.color}08` }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: suggMeta.color }}>
              {suggMeta.emoji} Samen doen deze week
            </p>
            <p className="text-sm font-bold text-gray-900 mb-1">{suggestion.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{suggestion.setup}</p>
            <div
              className="rounded-xl p-2.5 border text-xs font-semibold text-gray-700"
              style={{ backgroundColor: `${suggMeta.color}12`, borderColor: `${suggMeta.color}30` }}
            >
              🏆 {suggestion.win_condition}
            </div>
            <p className="text-[9px] text-gray-400 mt-2">
              Doe dit samen in de tuin of het park — 10 minuten is genoeg.
            </p>
          </motion.div>
        )}

        {/* Notification prefs */}
        {notifPrefs && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Instellingen</p>
            <button
              onClick={handleToggleDigest}
              disabled={savingPrefs}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                {notifPrefs.weekly_digest
                  ? <Bell size={16} style={{ color: ACCENT }} />
                  : <BellOff size={16} className="text-gray-400" />
                }
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">Wekelijkse update</p>
                  <p className="text-[10px] text-gray-400">Elke vrijdag een kort berichtje over {firstName}</p>
                </div>
              </div>
              <div
                className="w-10 h-6 rounded-full transition-colors relative shrink-0"
                style={{ backgroundColor: notifPrefs.weekly_digest ? ACCENT : '#e5e7eb' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
                  style={{ left: notifPrefs.weekly_digest ? '22px' : '4px' }}
                />
              </div>
            </button>
          </motion.div>
        )}

        {/* Berichten met trainer */}
        {!demo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <button
              onClick={() => setShowMessages(v => !v)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: '#f0fdf4' }}>
                  <MessageSquare size={16} style={{ color: ACCENT }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">Berichten met trainer</p>
                  <p className="text-[10px] text-gray-400">Direct contact met de coach van {firstName}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{showMessages ? '▲' : '▼'}</span>
            </button>

            {showMessages && (
              <div className="mt-3 h-[480px]">
                <Suspense fallback={<div className="h-full bg-gray-100 rounded-2xl animate-pulse" />}>
                  <MessagingInbox
                    currentUserId={userData.uid}
                    currentUserName={`Ouder van ${firstName}`}
                    currentUserRole="parent"
                    className="h-full"
                  />
                </Suspense>
              </div>
            )}
          </motion.div>
        )}

        {/* Privacy note */}
        <p className="text-[9px] text-gray-400 text-center leading-relaxed px-2">
          Je ziet alleen inzet-statistieken van jouw kind — geen ranglijsten, geen cijfers van andere kinderen.
        </p>
      </div>
    </div>
  );
};

export default ParentDashboard;
