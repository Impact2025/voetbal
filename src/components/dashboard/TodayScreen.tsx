import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Trophy, ArrowDown, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react';
import { COACH_COLOR } from '../../utils/constants';
import type { Player, CustomHomework, Streak } from '../../types';

interface TodayScreenProps {
  player: Player;
  streak: Streak | null;
  customHomework: CustomHomework[];
  assignedHomeworkIds: string[];
  hasOpenQuestions: boolean;
  /** Gratis basis-uitdaging uit het seizoensprogramma van deze week, of null als er geen is / al gedaan is. */
  weekChallenge: string | null;
  onCompleteWeekChallenge: () => Promise<void>;
}

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
  player, streak, customHomework, assignedHomeworkIds, hasOpenQuestions, weekChallenge, onCompleteWeekChallenge,
}: TodayScreenProps) => {
  const ageNum = parseInt(player.age ?? '10', 10);
  const isYoung = !isNaN(ageNum) && ageNum <= 9;
  const firstName = player.name.split(' ')[0];

  const count = streak?.activities_count ?? 0;
  const goal = streak?.week_goal ?? 2;
  const goalReached = count >= goal;

  const [completing, setCompleting] = useState(false);

  // ── 1. De ene volgende stap bepalen ──────────────────────────────
  const assignedTasks = useMemo(
    () => customHomework.filter(hw => assignedHomeworkIds.includes(hw.id)),
    [customHomework, assignedHomeworkIds],
  );
  const nextHomework = useMemo(
    () => assignedTasks.find(hw => !player.completed_homework_ids?.includes(hw.id)),
    [assignedTasks, player.completed_homework_ids],
  );

  type Focus =
    | { kind: 'homework'; title: string; sub: string }
    | { kind: 'weekChallenge'; title: string }
    | { kind: 'done' };

  const focus: Focus = nextHomework
    ? { kind: 'homework', title: nextHomework.title, sub: 'Film jezelf tijdens de oefening en krijg AI-feedback' }
    : weekChallenge
      ? { kind: 'weekChallenge', title: weekChallenge }
      : { kind: 'done' };

  const accent = COACH_COLOR;

  const handleCompleteWeekChallenge = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await onCompleteWeekChallenge();
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── GROET + STREAK ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-gray-900 leading-tight truncate">
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
        <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, #ffffff 0%, ${accent}10 70%, ${accent}1c 100%)` }} />
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
              <h3 className="text-xl font-black text-gray-900">Alles gedaan! 🎉</h3>
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
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
                    : <><Trophy size={11} /> Uitdaging van de week</>}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {focus.kind === 'homework' && isYoung && <span className="mr-2">⚽</span>}
                {focus.title}
              </h3>
              {focus.kind === 'homework' && (
                <p className={`text-sm text-gray-600 mt-2 leading-relaxed ${isYoung ? 'line-clamp-1' : 'line-clamp-3'}`}>{focus.sub}</p>
              )}
              {focus.kind === 'weekChallenge' && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">Onderdeel van het trainingsprogramma van deze week.</p>
              )}

              <motion.button
                whileTap={{ scale: 0.96, y: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                disabled={focus.kind === 'weekChallenge' && completing}
                onClick={() => focus.kind === 'homework' ? scrollTo('today-homework') : handleCompleteWeekChallenge()}
                className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-black text-white disabled:opacity-60"
                style={{ backgroundColor: accent, boxShadow: `0 4px 0 ${accent}90` }}
              >
                {focus.kind === 'homework'
                  ? <>Upload je video voor feedback <ArrowDown size={18} /></>
                  : <>{completing ? 'Bezig...' : 'Klaar? Vink af'} <CheckCircle2 size={18} /></>}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── WEEKDOEL-RING (geen ranking, alleen jouw doel) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-4"
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
                  style={{ backgroundColor: i < count ? COACH_COLOR : '#e5e7eb' }}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: i < count ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                />
              ))
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">
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
          className="w-full flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <MessageSquare size={16} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Je coach vroeg je iets 💬</p>
            <p className="text-[11px] text-gray-500">Tik om te antwoorden.</p>
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default TodayScreen;
