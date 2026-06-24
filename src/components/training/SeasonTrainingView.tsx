import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Trophy, Calendar, Pause, Info, Play, ChevronDown, ChevronRight,
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
  warming_up: { label: 'Warming-up', color: '#ea580c', bg: '#ea580c18' },
  techniek:   { label: 'Techniek',   color: '#7c3aed', bg: '#7c3aed18' },
  partijvorm: { label: 'Partijvorm', color: '#16a34a', bg: '#16a34a18' },
};

function getExerciseImage(
  ageGroup: string,
  trainingNumber: number | null,
  session: 'a' | 'b',
  exerciseIndex: number,
): string | undefined {
  if (!trainingNumber) return undefined;
  const ag = ageGroup.toLowerCase();
  const page = exerciseIndex + 1;
  if (ag === 'o8') return `/trainingen/o8/t${trainingNumber}_p${page}.png`;
  return `/trainingen/${ag}/t${trainingNumber}${session}_p${page}.png`;
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

function ExerciseCard({ exercise, imageUrl, defaultOpen = false }: {
  exercise: TrainingExercise;
  imageUrl?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [imgVisible, setImgVisible] = useState(!!imageUrl);
  const meta = TYPE_META[exercise.type] ?? TYPE_META.techniek;
  const sections = parseContent(exercise.content);

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}
    >
      {/* Field diagram */}
      {imageUrl && imgVisible && (
        <div className="relative overflow-hidden bg-[#1a6b32]" style={{ aspectRatio: '4/3' }}>
          <img
            src={imageUrl}
            alt={exercise.title}
            className="w-full h-full object-contain"
            onError={() => setImgVisible(false)}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.35) 100%)',
            }}
          />
          <span
            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow"
            style={{ backgroundColor: meta.color, color: '#fff' }}
          >
            {meta.label}
          </span>
        </div>
      )}

      {/* Title row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        {(!imageUrl || !imgVisible) && (
          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        )}
        <span className="font-black text-[15px] text-gray-900 flex-1 leading-tight">{exercise.title}</span>
        <div
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: meta.bg }}
        >
          {open
            ? <ChevronDown size={13} style={{ color: meta.color }} />
            : <ChevronRight size={13} style={{ color: meta.color }} />}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-4 border-t border-gray-50">
              {sections.map((s, i) => (
                <div key={i} className={i === 0 ? 'pt-4' : ''}>
                  {s.heading && (
                    <p
                      className="text-[10px] font-black uppercase tracking-widest mb-1.5"
                      style={{ color: meta.color }}
                    >
                      {s.heading}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SessionBlock({
  label, exercises, color, ageGroup, trainingNumber, session,
}: {
  label: string;
  exercises: TrainingExercise[];
  color: string;
  ageGroup: string;
  trainingNumber: number | null;
  session: 'a' | 'b';
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1" style={{ backgroundColor: `${color}25` }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: `${color}25` }} />
      </div>
      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <ExerciseCard
            key={i}
            exercise={ex}
            imageUrl={getExerciseImage(ageGroup, trainingNumber, session, i)}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

function WeekBanner({
  weekPlan, training, overrides, ageGroup,
}: {
  weekPlan: SeasonWeekPlan;
  training: TrainingLibraryRow | null;
  overrides: ClubWeekOverride[];
  ageGroup: string;
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

  const hasSessions = training && training.exercises.session_b.length > 0;

  return (
    <div className="space-y-4">
      {/* Week header card */}
      <div
        className="rounded-2xl px-5 py-4 border border-emerald-200"
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
          boxShadow: '0 2px 12px rgba(5,150,105,0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white"
              >
                Week {weekPlan.week_number}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">
                Training {weekPlan.training_a_number}
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900">Deze week</h2>
          </div>

          {hasSessions && (
            <div className="flex gap-1 rounded-xl p-1 shrink-0 bg-white border border-emerald-200">
              {(['a', 'b'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSession(s)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all"
                  style={{
                    backgroundColor: activeSession === s ? '#059669' : 'transparent',
                    color: activeSession === s ? '#fff' : '#6b7280',
                  }}
                >
                  Sessie {s.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {(weekPlan.homework || weekPlan.challenge) && (
          <div className="grid grid-cols-2 gap-2">
            {weekPlan.homework && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-emerald-100">
                <ClipboardList size={13} className="mt-0.5 shrink-0 text-purple-500" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Huiswerk</p>
                  <p className="text-xs text-gray-800 font-medium leading-snug">{weekPlan.homework}</p>
                </div>
              </div>
            )}
            {weekPlan.challenge && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-emerald-100">
                <Trophy size={13} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Challenge</p>
                  <p className="text-xs text-gray-800 font-medium leading-snug">{weekPlan.challenge}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Training content */}
      {training ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSession}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <SessionBlock
              label={`Sessie ${activeSession.toUpperCase()} — ${activeSession === 'a' ? 'Dinsdag' : 'Donderdag'}`}
              exercises={activeSession === 'a' ? training.exercises.session_a : training.exercises.session_b}
              color={activeSession === 'a' ? '#7c3aed' : '#16a34a'}
              ageGroup={ageGroup}
              trainingNumber={activeSession === 'a' ? weekPlan.training_a_number : weekPlan.training_b_number}
              session={activeSession}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Training content niet beschikbaar</p>
        </div>
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
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${NEON_COLOR}20`, color: '#16a34a' }}
            >
              PRO
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900">Seizoensprogramma</h2>
          <p className="text-sm text-gray-500 mt-0.5">KNVB-curriculum — week {getISOWeek(new Date('2026-08-24'))}</p>
        </div>

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
                {seasonPlan.find(w => w.week_number === getISOWeek(new Date('2026-08-24')))?.vacation_label ?? 'Vrije week'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {seasonStatus === 'active' && currentWeekPlan && (
        <WeekBanner
          weekPlan={currentWeekPlan}
          training={training}
          overrides={overrides}
          ageGroup={activeAgeGroup}
        />
      )}

      {seasonStatus === 'active' && !currentWeekPlan && (
        <Card light>
          <div className="flex items-center gap-3">
            <Info size={18} className="text-gray-400" />
            <p className="text-sm text-gray-500">
              Week {getISOWeek(new Date('2026-08-24'))} staat niet in het seizoensplan.
            </p>
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

      {/* Season overview dots */}
      {seasonPlan.length > 0 && seasonStatus !== 'not_started' && (
        <Card light>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
            <Play size={10} style={{ color: '#16a34a' }} /> Seizoensoverzicht
          </p>
          <div className="flex flex-wrap gap-1.5">
            {seasonPlan.map(w => {
              const isCurrentWeek = w.week_number === getISOWeek(new Date('2026-08-24'));
              const ovr = overrides.find(o => o.week_number === w.week_number);
              const isDisabled = ovr && !ovr.is_enabled;
              return (
                <div
                  key={w.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all"
                  style={{
                    backgroundColor: isCurrentWeek ? NEON_COLOR : w.is_vacation ? '#f3f4f6' : '#f3f4f6',
                    color: isCurrentWeek ? '#fff' : w.is_vacation ? '#9ca3af' : '#6b7280',
                    border: isCurrentWeek ? `2px solid ${NEON_COLOR}` : '1px solid #e5e7eb',
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                  title={w.is_vacation ? (w.vacation_label ?? 'Vakantie') : `Training ${w.training_a_number}`}
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
