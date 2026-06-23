import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronDown, ChevronRight, Calendar, Trophy,
  ClipboardList, Zap, Play, Pause, Info,
} from 'lucide-react';
import Card from '../ui/Card';
import { NEON_COLOR } from '../../utils/constants';
import {
  fetchClubTrainingConfigs, fetchSeasonPlan, fetchTrainingContent,
  fetchClubWeekOverrides, getCurrentSeasonWeek, getSeasonStatus,
  weekNumberToDate, getISOWeek,
} from '../../lib/trainingLibrary';
import type {
  ClubTrainingConfig, SeasonWeekPlan, TrainingLibraryRow,
  ClubWeekOverride, TrainingExercise,
} from '../../types';

const AGE_GROUPS = ['O8', 'O9', 'O10', 'O11', 'O12'] as const;

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  warming_up: { label: 'Warming-up', color: '#ea580c', bg: '#ea580c12' },
  techniek:   { label: 'Techniek',   color: '#7c3aed', bg: '#7c3aed12' },
  partijvorm: { label: 'Partijvorm', color: '#16a34a', bg: '#16a34a12' },
};

function ExerciseCard({ exercise, defaultOpen = false }: { exercise: TrainingExercise; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = TYPE_META[exercise.type] ?? TYPE_META.techniek;
  const sections = parseContent(exercise.content);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${meta.color}30`, backgroundColor: `${meta.color}08` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition-opacity"
      >
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide" style={{ backgroundColor: meta.bg, color: meta.color }}>
          {meta.label}
        </span>
        <span className="font-bold text-sm text-gray-900 flex-1 truncate">{exercise.title}</span>
        {open ? <ChevronDown size={15} className="text-gray-400 shrink-0" /> : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {sections.map((s, i) => (
                <div key={i}>
                  {s.heading && (
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: meta.color }}>
                      {s.heading}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{s.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function parseContent(raw: string): { heading: string; text: string }[] {
  const knownHeadings = ['Methodiek', 'Materialen', 'Aanwijzingen', 'Variatie', 'Opgelet', 'Doordraaien', 'Doel'];
  const parts = raw.split(/\n(?=(Methodiek|Materialen|Aanwijzingen|Variatie[^:]*|Opgelet!?|Doordraaien)\n?)/);
  if (parts.length <= 1) return [{ heading: '', text: raw.trim() }];

  const sections: { heading: string; text: string }[] = [];
  let i = 0;
  while (i < parts.length) {
    const isHeading = knownHeadings.some(h => parts[i].startsWith(h));
    if (isHeading) {
      const headingLine = parts[i].split('\n')[0];
      const rest = parts[i].slice(headingLine.length).trim();
      sections.push({ heading: headingLine, text: rest });
      i++;
    } else {
      sections.push({ heading: '', text: parts[i].trim() });
      i++;
    }
  }
  return sections.filter(s => s.text);
}

function SessionBlock({ label, exercises, color }: { label: string; exercises: TrainingExercise[]; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[10px] font-black uppercase tracking-widest px-2" style={{ color }}>
          {label}
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="space-y-2">
        {exercises.map((ex, i) => (
          <ExerciseCard key={i} exercise={ex} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}

function WeekBanner({ weekPlan, training, overrides }: {
  weekPlan: SeasonWeekPlan;
  training: TrainingLibraryRow | null;
  overrides: ClubWeekOverride[];
}) {
  const [activeSession, setActiveSession] = useState<'a' | 'b'>('a');
  const override = overrides.find(o => o.week_number === weekPlan.week_number);
  const isDisabled = override && !override.is_enabled;

  if (isDisabled) {
    return (
      <Card light>
        <div className="flex items-center gap-3 py-2">
          <Pause size={18} className="text-gray-400" />
          <div>
            <p className="font-bold text-gray-700">Week {weekPlan.week_number} — Uitgeschakeld</p>
            {override?.custom_notes && <p className="text-xs text-gray-500 mt-0.5">{override.custom_notes}</p>}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card light>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${NEON_COLOR}15`, color: '#16a34a' }}>
                Week {weekPlan.week_number}
              </span>
              <span className="text-[10px] text-gray-400">Training {weekPlan.training_a_number}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900">Deze week</h2>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200 shrink-0">
            {(['a', 'b'] as const).map(s => (
              <button
                key={s}
                onClick={() => setActiveSession(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSession === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sessie {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {weekPlan.homework && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <ClipboardList size={14} className="mt-0.5 shrink-0 text-purple-500" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Huiswerk</p>
                <p className="text-xs text-gray-700 font-semibold">{weekPlan.homework}</p>
              </div>
            </div>
          )}
          {weekPlan.challenge && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-100">
              <Trophy size={14} className="mt-0.5 shrink-0 text-green-600" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Challenge</p>
                <p className="text-xs text-gray-700 font-semibold">{weekPlan.challenge}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {training ? (
        <Card light>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSession}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              <SessionBlock
                label={`Sessie ${activeSession.toUpperCase()} — ${activeSession === 'a' ? 'Dinsdag' : 'Donderdag'}`}
                exercises={activeSession === 'a' ? training.exercises.session_a : training.exercises.session_b}
                color={activeSession === 'a' ? '#7c3aed' : '#16a34a'}
              />
            </motion.div>
          </AnimatePresence>
        </Card>
      ) : (
        <Card light>
          <div className="text-center py-8 text-gray-400">
            <BookOpen size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Training content niet beschikbaar</p>
          </div>
        </Card>
      )}
    </div>
  );
}

interface SeasonTrainingViewProps {
  clubId: string;
}

const SeasonTrainingView = ({ clubId }: SeasonTrainingViewProps) => {
  const [configs, setConfigs] = useState<ClubTrainingConfig[]>([]);
  const [activeAgeGroup, setActiveAgeGroup] = useState<string>('O8');
  const [seasonPlan, setSeasonPlan] = useState<SeasonWeekPlan[]>([]);
  const [training, setTraining] = useState<TrainingLibraryRow | null>(null);
  const [overrides, setOverrides] = useState<ClubWeekOverride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubTrainingConfigs(clubId).then(c => {
      setConfigs(c);
      if (c.length && !c.find(x => x.age_group === activeAgeGroup)) {
        setActiveAgeGroup(c[0].age_group);
      }
      setLoading(false);
    });
  }, [clubId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSeasonPlan(activeAgeGroup),
      fetchClubWeekOverrides(clubId, activeAgeGroup),
    ]).then(([plan, ov]) => {
      setSeasonPlan(plan);
      setOverrides(ov);
      setLoading(false);
    });
  }, [clubId, activeAgeGroup]);

  const activeConfig = configs.find(c => c.age_group === activeAgeGroup);
  const currentWeekPlan = activeConfig ? getCurrentSeasonWeek(seasonPlan, overrides) : null;

  useEffect(() => {
    if (!currentWeekPlan?.training_a_number) { setTraining(null); return; }
    fetchTrainingContent(activeAgeGroup, currentWeekPlan.training_a_number).then(setTraining);
  }, [activeAgeGroup, currentWeekPlan?.training_a_number]);

  const seasonStatus = activeConfig ? getSeasonStatus(seasonPlan, activeConfig) : 'not_started';
  const activeGroups = configs.map(c => c.age_group);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!configs.length) {
    return (
      <Card light>
        <div className="text-center py-10">
          <Calendar size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-700 font-semibold mb-1">Geen actieve leeftijdsgroepen</p>
          <p className="text-sm text-gray-400">De club-admin moet het seizoensprogramma activeren.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${NEON_COLOR}20`, color: '#16a34a' }}>
              PRO
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900">Seizoensprogramma</h2>
          <p className="text-sm text-gray-500 mt-0.5">KNVB-curriculum — week {getISOWeek(new Date())}</p>
        </div>

        {/* Age group tabs */}
        {activeGroups.length > 1 && (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200">
            {activeGroups.map(ag => (
              <button
                key={ag}
                onClick={() => setActiveAgeGroup(ag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeAgeGroup === ag ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        )}
      </div>

      {seasonStatus === 'not_started' && activeConfig && (
        <Card light>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${NEON_COLOR}15` }}>
              <Calendar size={16} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Seizoen start binnenkort</h3>
              <p className="text-sm text-gray-500">
                Het {activeAgeGroup} programma begint in{' '}
                <span className="text-gray-900 font-semibold">
                  week {activeConfig.season_start_week}, {activeConfig.season_start_year}
                </span>{' '}
                ({weekNumberToDate(activeConfig.season_start_year, activeConfig.season_start_week)
                  .toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}).
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {seasonPlan.filter(w => !w.is_vacation).length} trainingen gepland · {seasonPlan.filter(w => w.is_vacation).length} vrije weken
              </p>
            </div>
          </div>
        </Card>
      )}

      {seasonStatus === 'break' && (
        <Card light>
          <div className="flex items-center gap-3">
            <Pause size={18} className="text-yellow-500" />
            <div>
              <p className="font-bold text-gray-900">Vakantie</p>
              <p className="text-sm text-gray-500">
                {seasonPlan.find(w => w.week_number === getISOWeek(new Date()))?.vacation_label ?? 'Vrije week'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {seasonStatus === 'active' && currentWeekPlan && (
        <WeekBanner weekPlan={currentWeekPlan} training={training} overrides={overrides} />
      )}

      {seasonStatus === 'active' && !currentWeekPlan && (
        <Card light>
          <div className="flex items-center gap-3">
            <Info size={18} className="text-gray-400" />
            <p className="text-sm text-gray-500">Week {getISOWeek(new Date())} staat niet in het seizoensplan.</p>
          </div>
        </Card>
      )}

      {seasonStatus === 'finished' && (
        <Card light>
          <div className="text-center py-6">
            <Trophy size={28} className="mx-auto mb-2" style={{ color: NEON_COLOR }} />
            <p className="font-bold text-gray-900">Seizoen afgerond</p>
            <p className="text-sm text-gray-500 mt-1">Het programma voor dit seizoen is compleet.</p>
          </div>
        </Card>
      )}

      {/* Season overview mini */}
      {seasonPlan.length > 0 && seasonStatus !== 'not_started' && (
        <Card light>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
            <Play size={10} style={{ color: '#16a34a' }} /> Seizoensoverzicht
          </p>
          <div className="flex flex-wrap gap-1.5">
            {seasonPlan.map(w => {
              const isCurrentWeek = w.week_number === getISOWeek(new Date());
              const override = overrides.find(o => o.week_number === w.week_number);
              const isDisabled = override && !override.is_enabled;
              return (
                <div
                  key={w.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all"
                  style={{
                    backgroundColor: isCurrentWeek ? '#16a34a' : w.is_vacation ? '#f3f4f6' : isDisabled ? '#f9fafb' : '#f3f4f6',
                    color: isCurrentWeek ? '#fff' : w.is_vacation ? '#9ca3af' : isDisabled ? '#d1d5db' : '#6b7280',
                    border: isCurrentWeek ? '2px solid #16a34a' : '1px solid #e5e7eb',
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                  title={w.is_vacation ? w.vacation_label ?? 'Vakantie' : `Training ${w.training_a_number}`}
                >
                  {w.week_number}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SeasonTrainingView;
