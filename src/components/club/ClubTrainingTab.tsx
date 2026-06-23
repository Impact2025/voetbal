import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Save, Loader2, Check, Zap, Settings2, BookOpen,
} from 'lucide-react';
import Card from '../ui/Card';
import {
  fetchAllClubTrainingConfigs, upsertClubTrainingConfig,
  fetchSeasonPlan, fetchClubWeekOverrides, upsertWeekOverride,
  setClubProStatus, fetchClubSubscriptionTier,
} from '../../lib/trainingLibrary';
import type { ClubTrainingConfig, SeasonWeekPlan, ClubWeekOverride } from '../../types';

const ACCENT = '#16A34A';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_AGE_GROUPS = ['O8', 'O9', 'O10', 'O11', 'O12'] as const;
const AVAILABLE_AGE_GROUPS = ['O8'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="shrink-0 transition-opacity hover:opacity-80">
      {on
        ? <ToggleRight size={22} style={{ color: ACCENT }} />
        : <ToggleLeft size={22} className="text-gray-300" />}
    </button>
  );
}

// ─── Season Config Panel ──────────────────────────────────────────────────────

function SeasonConfigPanel({
  clubId, config, onSaved,
}: { clubId: string; config: ClubTrainingConfig | null; ageGroup: string; onSaved: () => void }) {
  const [year, setYear] = useState(config?.season_start_year ?? 2026);
  const [week, setWeek] = useState(config?.season_start_week ?? 35);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await upsertClubTrainingConfig(clubId, config?.age_group ?? 'O8', {
      season_start_year: year,
      season_start_week: week,
    });
    setSaving(false);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Startjaar</label>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
        >
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Startweek</label>
        <select
          value={week}
          onChange={e => setWeek(Number(e.target.value))}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
        >
          {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: ACCENT }}
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
        {saved ? 'Opgeslagen' : 'Opslaan'}
      </button>
    </div>
  );
}

// ─── Week Row ─────────────────────────────────────────────────────────────────

function WeekRow({
  plan, override, onToggle, onNotesChange,
}: {
  plan: SeasonWeekPlan;
  override: ClubWeekOverride | undefined;
  onToggle: (weekNumber: number, isEnabled: boolean) => void;
  onNotesChange: (weekNumber: number, notes: string) => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(override?.custom_notes ?? '');
  const isEnabled = override ? override.is_enabled : !plan.is_vacation;
  const isVacation = plan.is_vacation;

  return (
    <div className={`border-b border-gray-100 last:border-0 ${isVacation ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-3 py-2.5 px-1">
        <span className="w-8 text-center text-xs font-black text-gray-400 shrink-0">
          {plan.week_number}
        </span>

        <div className="flex-1 min-w-0">
          {isVacation ? (
            <span className="text-xs text-gray-400 italic">{plan.vacation_label ?? 'Vakantie'}</span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-700">Training {plan.training_a_number}</span>
              {plan.homework && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                  {plan.homework}
                </span>
              )}
              {plan.challenge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#f0fdf4', color: ACCENT }}>
                  {plan.challenge.slice(0, 30)}{plan.challenge.length > 30 ? '…' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {!isVacation && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setNotesOpen(o => !o)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              {notesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <Toggle on={isEnabled} onClick={() => onToggle(plan.week_number, !isEnabled)} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {notesOpen && !isVacation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-1 pb-3 flex gap-2">
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Clubnota (bijv. toernooiweekend)…"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
              <button
                onClick={() => onNotesChange(plan.week_number, notes)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ACCENT }}
              >
                <Check size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Age Group Panel ──────────────────────────────────────────────────────────

function AgeGroupPanel({
  clubId, ageGroup, config, onConfigChange,
}: {
  clubId: string;
  ageGroup: string;
  config: ClubTrainingConfig | null;
  onConfigChange: () => void;
}) {
  const [plan, setPlan] = useState<SeasonWeekPlan[]>([]);
  const [overrides, setOverrides] = useState<ClubWeekOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [p, o] = await Promise.all([
      fetchSeasonPlan(ageGroup),
      fetchClubWeekOverrides(clubId, ageGroup),
    ]);
    setPlan(p);
    setOverrides(o);
    setLoading(false);
  }, [clubId, ageGroup]);

  useEffect(() => { void reload(); }, [reload]);

  const handleToggle = async (weekNumber: number, isEnabled: boolean) => {
    const current = overrides.find(o => o.week_number === weekNumber);
    await upsertWeekOverride(clubId, ageGroup, weekNumber, isEnabled, current?.custom_notes ?? undefined);
    setOverrides(prev => {
      const next = prev.filter(o => o.week_number !== weekNumber);
      next.push({
        id: current?.id ?? '',
        club_id: clubId, age_group: ageGroup, week_number: weekNumber,
        is_enabled: isEnabled, custom_notes: current?.custom_notes ?? null,
      });
      return next;
    });
  };

  const handleNotesChange = async (weekNumber: number, notes: string) => {
    const current = overrides.find(o => o.week_number === weekNumber);
    await upsertWeekOverride(clubId, ageGroup, weekNumber, current?.is_enabled ?? true, notes || undefined);
    setOverrides(prev => {
      const next = prev.filter(o => o.week_number !== weekNumber);
      next.push({
        id: current?.id ?? '', club_id: clubId, age_group: ageGroup,
        week_number: weekNumber, is_enabled: current?.is_enabled ?? true,
        custom_notes: notes || null,
      });
      return next;
    });
  };

  const activeCount = plan.filter(w => {
    if (w.is_vacation) return false;
    const ov = overrides.find(o => o.week_number === w.week_number);
    return !ov || ov.is_enabled;
  }).length;

  return (
    <div className="space-y-4">
      <Card light>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
          <Settings2 size={10} style={{ color: ACCENT }} /> Seizoensinstelling
        </p>
        <SeasonConfigPanel
          clubId={clubId}
          config={config}
          ageGroup={ageGroup}
          onSaved={onConfigChange}
        />
      </Card>

      <Card light className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
            <Calendar size={10} style={{ color: ACCENT }} /> Seizoenskalender
          </p>
          <span className="text-[10px] text-gray-400">{activeCount} actieve trainingen</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-gray-400" />
          </div>
        ) : plan.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Geen seizoensdata beschikbaar voor {ageGroup}.</p>
          </div>
        ) : (
          <div className="px-3">
            <div className="flex items-center gap-3 py-2 px-1 border-b border-gray-100">
              <span className="w-8 text-[9px] font-black uppercase tracking-widest text-gray-300 text-center shrink-0">WK</span>
              <span className="flex-1 text-[9px] font-black uppercase tracking-widest text-gray-300">Inhoud</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 shrink-0 mr-8">Actief</span>
            </div>
            {plan.map(w => (
              <WeekRow
                key={w.id}
                plan={w}
                override={overrides.find(o => o.week_number === w.week_number)}
                onToggle={handleToggle}
                onNotesChange={handleNotesChange}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ClubTrainingTabProps {
  clubId: string;
  isSuperAdmin?: boolean;
}

const ClubTrainingTab = ({ clubId, isSuperAdmin = false }: ClubTrainingTabProps) => {
  const [isPro, setIsPro] = useState(false);
  const [configs, setConfigs] = useState<ClubTrainingConfig[]>([]);
  const [activeAgeGroup, setActiveAgeGroup] = useState<string>('O8');
  const [loading, setLoading] = useState(true);
  const [togglingPro, setTogglingPro] = useState(false);

  const reload = useCallback(async () => {
    const [tier, cfgs] = await Promise.all([
      fetchClubSubscriptionTier(clubId),
      fetchAllClubTrainingConfigs(clubId),
    ]);
    setIsPro(tier === 'pro');
    setConfigs(cfgs);
    setLoading(false);
  }, [clubId]);

  useEffect(() => { void reload(); }, [reload]);

  const handleTogglePro = async () => {
    setTogglingPro(true);
    await setClubProStatus(clubId, !isPro);
    setIsPro(p => !p);
    setTogglingPro(false);
  };

  const handleToggleAgeGroup = async (ag: string, enable: boolean) => {
    await upsertClubTrainingConfig(clubId, ag, { is_active: enable });
    reload();
  };

  const activeConfig = configs.find(c => c.age_group === activeAgeGroup);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* PRO status card */}
      <Card light>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="p-2.5 rounded-xl shrink-0"
              style={{ backgroundColor: '#f0fdf4', border: `1px solid #bbf7d0` }}
            >
              <Zap size={18} style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-black text-gray-900">Seizoensprogramma PRO</h3>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isPro ? '#f0fdf4' : '#f3f4f6',
                    color: isPro ? ACCENT : '#9ca3af',
                  }}
                >
                  {isPro ? 'ACTIEF' : 'INACTIEF'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Geeft coaches toegang tot het volledige KNVB-jaarprogramma met 32 trainingen per categorie.
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={handleTogglePro}
              disabled={togglingPro}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={isPro
                ? { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }
                : { backgroundColor: ACCENT, color: '#fff' }
              }
            >
              {togglingPro ? <Loader2 size={13} className="animate-spin" /> : null}
              {isPro ? 'Deactiveren' : 'Activeren'}
            </button>
          )}
        </div>
      </Card>

      {!isPro ? (
        <Card light>
          <div className="text-center py-8">
            <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-500 mb-1">PRO niet actief</p>
            <p className="text-sm text-gray-400">Neem contact op met je accountmanager om PRO te activeren.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Age group activation */}
          <Card light>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Leeftijdscategorieën</p>
            <div className="space-y-3">
              {AVAILABLE_AGE_GROUPS.map(ag => {
                const config = configs.find(c => c.age_group === ag);
                const isActive = config?.is_active ?? false;
                return (
                  <div key={ag} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-gray-900">{ag}</span>
                      {isActive && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ backgroundColor: '#f0fdf4', color: ACCENT }}
                        >
                          Actief
                        </span>
                      )}
                    </div>
                    <Toggle on={isActive} onClick={() => handleToggleAgeGroup(ag, !isActive)} />
                  </div>
                );
              })}
              {ALL_AGE_GROUPS.filter(ag => !AVAILABLE_AGE_GROUPS.includes(ag as typeof AVAILABLE_AGE_GROUPS[number])).map(ag => (
                <div key={ag} className="flex items-center justify-between opacity-30">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-900">{ag}</span>
                    <span className="text-[10px] text-gray-400">Binnenkort</span>
                  </div>
                  <ToggleLeft size={22} className="text-gray-300" />
                </div>
              ))}
            </div>
          </Card>

          {configs.filter(c => c.is_active).length > 0 && (
            <>
              {configs.filter(c => c.is_active).length > 1 && (
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200 w-fit">
                  {configs.filter(c => c.is_active).map(c => (
                    <button
                      key={c.age_group}
                      onClick={() => setActiveAgeGroup(c.age_group)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeAgeGroup === c.age_group ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      style={activeAgeGroup === c.age_group ? { backgroundColor: ACCENT } : {}}
                    >
                      {c.age_group}
                    </button>
                  ))}
                </div>
              )}

              <AgeGroupPanel
                key={activeAgeGroup}
                clubId={clubId}
                ageGroup={activeAgeGroup}
                config={activeConfig ?? null}
                onConfigChange={reload}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ClubTrainingTab;
