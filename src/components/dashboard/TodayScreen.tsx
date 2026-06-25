import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Swords, ArrowDown, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react';
import { CHALLENGES, CATEGORY_META } from '../../data/challenges';
import { NEON_COLOR } from '../../utils/constants';
import type { Player, CustomHomework, ChallengeCompletion, Streak } from '../../types';

interface TodayScreenProps {
  player: Player;
  streak: Streak | null;
  customHomework: CustomHomework[];
  assignedHomeworkIds: string[];
  completions: ChallengeCompletion[];
  hasOpenQuestions: boolean;
}

/** ISO-achtig weeknummer — stabiel binnen dezelfde week, zodat "challenge van de week" niet verspringt. */
const weekIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Hoi';
  return 'Goedenavond';
};

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const TodayScreen = ({
  player, streak, customHomework, assignedHomeworkIds, completions, hasOpenQuestions,
}: TodayScreenProps) => {
  const ageNum = parseInt(player.age ?? '10', 10);
  const isYoung = !isNaN(ageNum) && ageNum <= 9;
  const firstName = player.name.split(' ')[0];

  const count = streak?.activities_count ?? 0;
  const goal = streak?.week_goal ?? 2;
  const goalReached = count >= goal;

  // ── 1. De ene volgende stap bepalen ──────────────────────────────
  const assignedTasks = useMemo(
    () => customHomework.filter(hw => assignedHomeworkIds.includes(hw.id)),
    [customHomework, assignedHomeworkIds],
  );
  const nextHomework = useMemo(
    () => assignedTasks.find(hw => !player.completed_homework_ids?.includes(hw.id)),
    [assignedTasks, player.completed_homework_ids],
  );

  const challengeOfWeek = useMemo(() => {
    const ageOk = CHALLENGES.filter(c => ageNum >= c.age_min && ageNum <= c.age_max);
    if (ageOk.length === 0) return undefined;
    const undone = ageOk.filter(c => !completions.some(comp => comp.challenge_id === c.id));
    const pool = undone.length > 0 ? undone : ageOk;
    return pool[weekIndex() % pool.length];
  }, [ageNum, completions]);

  type Focus =
    | { kind: 'homework'; title: string; sub: string }
    | { kind: 'challenge'; title: string; sub: string; emoji: string; color: string }
    | { kind: 'done' };

  const focus: Focus = nextHomework
    ? { kind: 'homework', title: nextHomework.title, sub: nextHomework.description || 'Oefening van je coach' }
    : challengeOfWeek
      ? {
          kind: 'challenge',
          title: challengeOfWeek.title,
          sub: challengeOfWeek.setup,
          emoji: CATEGORY_META[challengeOfWeek.category].emoji,
          color: CATEGORY_META[challengeOfWeek.category].color,
        }
      : { kind: 'done' };

  const accent = focus.kind === 'challenge' ? focus.color : NEON_COLOR;

  return (
    <div className="space-y-4">

      {/* ── GROET + STREAK ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-white leading-tight truncate">
            {greeting()}, {firstName} 👋
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {focus.kind === 'done' ? 'Je bent helemaal bij vandaag.' : 'Klaar voor één actie?'}
          </p>
        </div>
        <div
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: goalReached ? '#4ade8015' : '#f9731615',
            border: `1px solid ${goalReached ? '#4ade8040' : '#f9731640'}`,
          }}
        >
          <Flame size={15} style={{ color: goalReached ? '#4ade80' : '#f97316' }} fill={goalReached ? '#4ade80' : '#f97316'} />
          <span className="text-xs font-black" style={{ color: goalReached ? '#4ade80' : '#f97316' }}>{count}/{goal}</span>
        </div>
      </motion.div>

      {/* ── DE FOCUS-KAART: één ding om te doen ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
        className="relative rounded-3xl overflow-hidden border"
        style={{ borderColor: `${accent}40` }}
      >
        <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, #0d0f14 0%, ${accent}14 70%, ${accent}28 100%)` }} />
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accent }} />

        <div className="relative p-5 sm:p-6">
          {focus.kind === 'done' ? (
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: '#4ade8015', border: '1px solid #4ade8040' }}
              >
                <CheckCircle2 size={32} style={{ color: '#4ade80' }} />
              </motion.div>
              <h3 className="text-xl font-black text-white">Alles gedaan! 🎉</h3>
              <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                {isYoung
                  ? 'Wat goed bezig! Pak de bal en ga lekker spelen — tot morgen!'
                  : goalReached
                    ? 'Je weekdoel is binnen. De rest is bonus — train zoveel je wilt.'
                    : 'Top! Kom morgen terug voor een nieuwe oefening.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  {focus.kind === 'homework'
                    ? <><Target size={11} /> Vandaag te doen</>
                    : <><Swords size={11} /> Uitdaging van de week</>}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {focus.kind === 'homework' && isYoung && <span className="mr-2">⚽</span>}
                {focus.kind === 'challenge' && <span className="mr-2">{focus.emoji}</span>}
                {focus.title}
              </h3>
              <p className={`text-sm text-gray-300 mt-2 leading-relaxed ${isYoung ? 'line-clamp-1' : 'line-clamp-3'}`}>{focus.sub}</p>

              <motion.button
                whileTap={{ scale: 0.96, y: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                onClick={() => scrollTo(focus.kind === 'homework' ? 'today-homework' : 'today-challenges')}
                className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-black text-black"
                style={{ backgroundColor: accent, boxShadow: `0 6px 0 ${accent}50, 0 0 24px ${accent}40` }}
              >
                {focus.kind === 'homework' ? 'Doe je oefening' : 'Start de uitdaging'}
                <ArrowDown size={18} />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── WEEKDOEL-RING (geen ranking, alleen jouw doel) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.06] bg-[#0d0f14] p-4 flex items-center gap-4"
      >
        <div className="flex gap-1.5 items-center">
          {goalReached
            ? Array.from({ length: goal }, (_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14, delay: i * 0.12 }}
                  style={{ fontSize: 20, lineHeight: 1, display: 'block' }}
                >
                  ⭐
                </motion.span>
              ))
            : Array.from({ length: goal }, (_, i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: i < count ? NEON_COLOR : '#1f2937' }}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: i < count ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                />
              ))
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">
            {goalReached ? 'Weekdoel behaald! 💪' : `Nog ${goal - count} actie${goal - count !== 1 ? 's' : ''} deze week`}
          </p>
          <p className="text-[11px] text-gray-500 leading-tight">
            {goalReached ? 'Consistent zijn — dát is het echte talent.' : 'Elke oefening of uitdaging telt mee.'}
          </p>
        </div>
        <Sparkles size={16} style={{ color: goalReached ? '#4ade80' : '#374151' }} />
      </motion.div>

      {/* ── COACH-VRAAG NUDGE (alleen indien open) ───────────────── */}
      {hasOpenQuestions && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          onClick={() => scrollTo('today-questions')}
          className="w-full flex items-center gap-3 rounded-2xl border border-violet-900/40 bg-violet-950/20 p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <MessageSquare size={16} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Je coach vroeg je iets 💬</p>
            <p className="text-[11px] text-gray-500">Tik om te antwoorden.</p>
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default TodayScreen;
