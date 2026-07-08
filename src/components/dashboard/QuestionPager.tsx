import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Send, Loader2, ShieldCheck } from 'lucide-react';
import { COACH_COLOR } from '../../utils/constants';

interface Question {
  text: string;
  idx: number;
}

interface QuestionPagerProps {
  questions: Question[];
  responseDrafts: string[];
  onChangeResponse: (idx: number, value: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  isYoung?: boolean;
}

const QuestionPager = ({
  questions, responseDrafts, onChangeResponse, onSave, saving, isYoung = false,
}: QuestionPagerProps) => {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const current = questions[page];
  const progress = ((page + 1) / total) * 100;

  const goNext = () => {
    if (page < total - 1) {
      setDirection(1);
      setPage(p => p + 1);
    }
  };

  const goPrev = () => {
    if (page > 0) {
      setDirection(-1);
      setPage(p => p - 1);
    }
  };

  const handleSend = async () => {
    await onSave();
    setDone(true);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-8 gap-3"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${COACH_COLOR}15`, border: `1px solid ${COACH_COLOR}40` }}
        >
          <ShieldCheck size={28} style={{ color: COACH_COLOR }} />
        </div>
        <p className="text-lg font-black text-gray-900">Verstuurd! 🙌</p>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          {isYoung
            ? 'Jouw coach leest je antwoorden. Goed gedaan!'
            : 'Je antwoorden zijn opgeslagen. Je coach leest ze voor de volgende training.'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voortgangsbalk */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: COACH_COLOR }}>
            Vraag {page + 1} van {total}
          </span>
          <span className="text-[10px] text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-1.5 rounded-full"
            style={{ backgroundColor: COACH_COLOR }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Vraag + antwoordveld */}
      <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ opacity: 0, x: direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -32 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-4"
          >
            <p
              className="font-bold text-gray-900 leading-relaxed"
              style={{ fontSize: isYoung ? 20 : 17 }}
            >
              {current.text}
            </p>

            <textarea
              value={responseDrafts[current.idx] ?? ''}
              onChange={e => onChangeResponse(current.idx, e.target.value)}
              placeholder={isYoung ? 'Schrijf hier...' : 'Jouw antwoord...'}
              rows={isYoung ? 4 : 3}
              className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-400 transition-colors"
              style={{
                fontSize: isYoung ? 18 : 15,
                padding: isYoung ? '14px 16px' : '10px 14px',
                lineHeight: 1.55,
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigatie */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <motion.button
          onClick={goPrev}
          disabled={page === 0}
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-1.5 px-4 rounded-xl font-bold text-gray-500 disabled:opacity-20 transition-opacity"
          style={{ height: isYoung ? 52 : 44, fontSize: isYoung ? 16 : 14 }}
        >
          <ChevronLeft size={isYoung ? 20 : 16} />
          Terug
        </motion.button>

        {page < total - 1 ? (
          <motion.button
            onClick={goNext}
            whileTap={{ scale: 0.96, y: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl font-black text-white"
            style={{
              height: isYoung ? 56 : 48,
              fontSize: isYoung ? 17 : 15,
              backgroundColor: COACH_COLOR,
              boxShadow: `0 4px 0 ${COACH_COLOR}90`,
            }}
          >
            Volgende
            <ChevronRight size={isYoung ? 20 : 17} />
          </motion.button>
        ) : (
          <motion.button
            onClick={handleSend}
            disabled={saving}
            whileTap={{ scale: 0.96, y: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl font-black text-white disabled:opacity-60"
            style={{
              height: isYoung ? 56 : 48,
              fontSize: isYoung ? 17 : 15,
              backgroundColor: COACH_COLOR,
              boxShadow: `0 4px 0 ${COACH_COLOR}90`,
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {saving ? 'Versturen...' : 'Verstuur'}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default QuestionPager;
