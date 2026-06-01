import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, ChevronUp, Target, Flame, Repeat2, Trophy, Wind, Package, MessageSquare, ArrowRight, Share2, CheckCircle2 } from 'lucide-react';
import type { StructuredTrainingPlan, TrainingPlanSection } from '../../types';
import { planToWhatsAppText } from '../../lib/trainingAI';
import { NEON_COLOR } from '../../utils/constants';

interface SectionStyle {
  color: string;
  bg: string;
  border: string;
  label: string;
  Icon: React.ElementType;
}

const SECTION_STYLES: Record<TrainingPlanSection['type'], SectionStyle> = {
  warming_up: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)', label: 'Warming-up', Icon: Flame },
  kern:        { color: '#00FF9D', bg: 'rgba(0,255,157,0.08)', border: 'rgba(0,255,157,0.2)', label: 'Kern', Icon: Target },
  oefenvorm:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', label: 'Oefenvorm', Icon: Repeat2 },
  spelvorm:    { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)', label: 'Spelvorm', Icon: Trophy },
  cooling_down:{ color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', label: 'Cooling-down', Icon: Wind },
};

const DIFFICULTY_LABELS = ['', 'Basis', 'Gevorderd', 'Uitdagend'];
const DIFFICULTY_COLORS = ['', '#4ade80', '#fb923c', '#f87171'];

interface TrainingPlanCardProps {
  plan: StructuredTrainingPlan;
  playerName?: string;
  period?: string;
  compact?: boolean;
}

function SectionBlock({ section, defaultOpen }: { section: TrainingPlanSection; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const style = SECTION_STYLES[section.type] ?? SECTION_STYLES.kern;
  const { Icon } = style;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: style.border, background: style.bg }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${style.color}20` }}>
          <Icon size={14} style={{ color: style.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: style.color }}>
              {style.label}
            </span>
            <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
              <Clock size={9} /> {section.duration} min
            </span>
          </div>
          <p className="text-sm font-bold text-white truncate">{section.title}</p>
        </div>
        <div className="shrink-0 text-gray-600">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: style.border }}>
              <p className="text-sm text-gray-300 leading-relaxed pt-3">{section.description}</p>

              {section.materials && (
                <div className="flex items-start gap-2">
                  <Package size={13} className="mt-0.5 shrink-0 text-gray-500" />
                  <p className="text-xs text-gray-400">{section.materials}</p>
                </div>
              )}

              {section.coaching_points?.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare size={11} style={{ color: style.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: style.color }}>
                      Coachingspunten
                    </span>
                  </div>
                  {section.coaching_points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] font-black mt-0.5 shrink-0" style={{ color: style.color }}>•</span>
                      <p className="text-xs text-gray-300 leading-relaxed">{pt}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.progression && (
                <div className="flex items-start gap-2 pt-1 mt-2 border-t border-white/5">
                  <ArrowRight size={12} className="mt-0.5 shrink-0 text-gray-600" />
                  <p className="text-xs text-gray-500 italic">{section.progression}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TrainingPlanCard({ plan, playerName, period, compact = false }: TrainingPlanCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = planToWhatsAppText(plan, playerName);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Trainingsplan ${playerName ?? ''}`, text });
        return;
      } catch { /* fall through to clipboard */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const totalMinutes = plan.sections.reduce((s, sec) => s + (sec.duration || 0), 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-black text-white leading-snug truncate">{plan.focus_theme}</h4>
          {period && <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-0.5">{period}</p>}
          <p className="text-xs text-gray-400 mt-1 leading-snug">{plan.weekly_goal}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${DIFFICULTY_COLORS[plan.difficulty]}20`,
                color: DIFFICULTY_COLORS[plan.difficulty],
              }}
            >
              {DIFFICULTY_LABELS[plan.difficulty]}
            </span>
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              <Clock size={10} /> {totalMinutes}m
            </span>
          </div>
          <span className="text-[10px] text-gray-700">{plan.age_group}</span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {plan.sections.map((s, i) => {
          const style = SECTION_STYLES[s.type] ?? SECTION_STYLES.kern;
          const width = `${(s.duration / totalMinutes) * 100}%`;
          return <div key={i} style={{ width, backgroundColor: style.color, opacity: 0.7 }} />;
        })}
      </div>

      {/* Sections */}
      {!compact && (
        <div className="space-y-2">
          {plan.sections.map((section, i) => (
            <SectionBlock key={i} section={section} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {compact && (
        <div className="space-y-1">
          {plan.sections.map((s, i) => {
            const style = SECTION_STYLES[s.type] ?? SECTION_STYLES.kern;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span style={{ color: style.color }} className="text-[10px] font-bold w-20 shrink-0">{style.label}</span>
                <span className="text-gray-300 truncate">{s.title}</span>
                <span className="text-gray-600 shrink-0">{s.duration}m</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] text-gray-700">
          {new Date(plan.generated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
        </p>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
        >
          {copied
            ? <><CheckCircle2 size={12} className="text-green-400" /> Gekopieerd</>
            : <><Share2 size={12} /> Delen</>
          }
        </button>
      </div>
    </div>
  );
}
