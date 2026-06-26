import { useState, useEffect } from 'react';
import { BookOpen, Zap, Calendar, ChevronRight } from 'lucide-react';
import { fetchClubTrainingConfigs, fetchSeasonPlan, fetchClubWeekOverrides, fetchTrainingContent, getCurrentSeasonWeek } from '../../lib/trainingLibrary';
import type { SeasonWeekPlan, TrainingExercise } from '../../types';

interface CoachWeekAgendaProps {
  clubId?: string;
  isClubPro: boolean;
  coachName?: string;
  teamName?: string;
  onGoToTrainingen: () => void;
}

const TYPE_STYLE: Record<string, { label: string; cls: string }> = {
  warming_up: { label: 'Warming-up', cls: 'bg-orange-100 text-orange-700' },
  techniek:   { label: 'Techniek',   cls: 'bg-blue-100 text-blue-700' },
  partijvorm: { label: 'Spelvorm',   cls: 'bg-purple-100 text-purple-700' },
};

const CoachWeekAgenda = ({ clubId, isClubPro, coachName, teamName, onGoToTrainingen }: CoachWeekAgendaProps) => {
  const [weekPlan, setWeekPlan] = useState<SeasonWeekPlan | null | undefined>(undefined);
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);

  useEffect(() => {
    if (!isClubPro || !clubId) return;

    const load = async () => {
      try {
        const configs = await fetchClubTrainingConfigs(clubId);
        if (!configs.length) { setWeekPlan(null); return; }
        const ag = configs[0].age_group;
        const [plan, overrides] = await Promise.all([
          fetchSeasonPlan(ag),
          fetchClubWeekOverrides(clubId, ag),
        ]);
        const current = getCurrentSeasonWeek(plan, overrides);
        setWeekPlan(current);
        if (current?.training_a_number) {
          const content = await fetchTrainingContent(ag, current.training_a_number);
          if (content) setExercises(content.exercises.session_a);
        }
      } catch {
        setWeekPlan(null);
      }
    };

    load();
  }, [clubId, isClubPro]);

  const greeting = coachName ? `Hallo ${coachName}` : 'Hallo Coach';
  const showWeek = isClubPro && weekPlan !== undefined;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
      {/* Greeting row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">{greeting}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{teamName || 'Jouw team'} — klaar voor deze week?</p>
        </div>
        {weekPlan && (
          <div className="shrink-0 bg-emerald-600 text-white rounded-xl px-3 py-1.5 text-center min-w-[52px]">
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-75">Week</div>
            <div className="text-2xl font-black leading-none">{weekPlan.week_number}</div>
          </div>
        )}
      </div>

      {/* Week content */}
      {showWeek && weekPlan ? (
        <>
          {exercises.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2 flex items-center gap-1.5">
                <Calendar size={10} /> Op de agenda
              </p>
              <div className="space-y-1.5">
                {exercises.slice(0, 3).map((ex, i) => {
                  const style = TYPE_STYLE[ex.type] ?? { label: ex.type, cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.cls}`}>
                        {style.label}
                      </span>
                      <span className="text-sm text-gray-700 font-medium truncate">{ex.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(weekPlan.homework || weekPlan.challenge) && (
            <div className="flex gap-2 flex-wrap">
              {weekPlan.homework && (
                <div className="flex items-start gap-1.5 bg-white rounded-xl px-3 py-2 border border-emerald-100 flex-1 min-w-[140px]">
                  <BookOpen size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">Huiswerk</p>
                    <p className="text-xs text-gray-700 leading-tight">{weekPlan.homework}</p>
                  </div>
                </div>
              )}
              {weekPlan.challenge && (
                <div className="flex items-start gap-1.5 bg-white rounded-xl px-3 py-2 border border-purple-100 flex-1 min-w-[140px]">
                  <Zap size={13} className="text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-purple-500 mb-0.5">Challenge</p>
                    <p className="text-xs text-gray-700 leading-tight">{weekPlan.challenge}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onGoToTrainingen}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <span>Bekijk volledig programma</span>
            <ChevronRight size={16} />
          </button>
        </>
      ) : showWeek && !weekPlan ? (
        <p className="text-sm text-gray-500">Geen trainingsprogramma gevonden voor deze week.</p>
      ) : null}
    </div>
  );
};

export default CoachWeekAgenda;
