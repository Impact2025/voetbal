import { supabase } from './supabase';
import type {
  TrainingLibraryRow,
  SeasonWeekPlan,
  ClubTrainingConfig,
  ClubWeekOverride,
} from '../types';

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
}

export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  return d.getUTCFullYear();
}

// Week 35 of 2026 → first Monday of that week
export function weekNumberToDate(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1);
  const target = new Date(startOfWeek1);
  target.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
  return target;
}

export async function fetchClubSubscriptionTier(clubId: string): Promise<'free' | 'pro'> {
  const { data } = await supabase
    .from('clubs')
    .select('subscription_tier')
    .eq('id', clubId)
    .single();
  return (data?.subscription_tier as 'free' | 'pro') ?? 'free';
}

export async function fetchClubTrainingConfigs(clubId: string): Promise<ClubTrainingConfig[]> {
  const { data } = await supabase
    .from('club_training_config')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true);
  return (data ?? []) as ClubTrainingConfig[];
}

export async function fetchAllClubTrainingConfigs(clubId: string): Promise<ClubTrainingConfig[]> {
  const { data } = await supabase
    .from('club_training_config')
    .select('*')
    .eq('club_id', clubId);
  return (data ?? []) as ClubTrainingConfig[];
}

export async function upsertClubTrainingConfig(
  clubId: string,
  ageGroup: string,
  updates: Partial<Omit<ClubTrainingConfig, 'id' | 'club_id' | 'age_group'>>
): Promise<void> {
  await supabase.from('club_training_config').upsert({
    club_id: clubId,
    age_group: ageGroup,
    ...updates,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'club_id,age_group' });
}

export async function fetchSeasonPlan(ageGroup: string): Promise<SeasonWeekPlan[]> {
  const { data } = await supabase
    .from('season_week_plan')
    .select('*')
    .eq('age_group', ageGroup)
    .order('sequence_number', { ascending: true });
  return (data ?? []) as SeasonWeekPlan[];
}

export async function fetchTrainingContent(
  ageGroup: string,
  trainingNumber: number
): Promise<TrainingLibraryRow | null> {
  const { data } = await supabase
    .from('training_library')
    .select('*')
    .eq('age_group', ageGroup)
    .eq('training_number', trainingNumber)
    .single();
  return data as TrainingLibraryRow | null;
}

export async function fetchClubWeekOverrides(
  clubId: string,
  ageGroup: string
): Promise<ClubWeekOverride[]> {
  const { data } = await supabase
    .from('club_week_overrides')
    .select('*')
    .eq('club_id', clubId)
    .eq('age_group', ageGroup);
  return (data ?? []) as ClubWeekOverride[];
}

export async function upsertWeekOverride(
  clubId: string,
  ageGroup: string,
  weekNumber: number,
  isEnabled: boolean,
  customNotes?: string
): Promise<void> {
  await supabase.from('club_week_overrides').upsert({
    club_id: clubId,
    age_group: ageGroup,
    week_number: weekNumber,
    is_enabled: isEnabled,
    custom_notes: customNotes ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'club_id,age_group,week_number' });
}

export async function setClubProStatus(clubId: string, isPro: boolean): Promise<void> {
  await supabase
    .from('clubs')
    .update({ subscription_tier: isPro ? 'pro' : 'free' })
    .eq('id', clubId);
}

// Determine which week of the season we're currently in
export function getCurrentSeasonWeek(
  plan: SeasonWeekPlan[],
  overrides: ClubWeekOverride[]
): SeasonWeekPlan | null {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const disabledWeeks = new Set(overrides.filter(o => !o.is_enabled).map(o => o.week_number));
  return plan.find(w => w.week_number === currentWeek && !w.is_vacation && !disabledWeeks.has(w.week_number)) ?? null;
}

export function getSeasonStatus(
  plan: SeasonWeekPlan[],
  config: ClubTrainingConfig
): 'not_started' | 'active' | 'break' | 'finished' {
  if (!plan.length) return 'not_started';
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = getISOWeekYear(now);

  const seasonStartYear = config.season_start_year;
  const firstWeek = plan[0].week_number;
  const lastWeek = plan[plan.length - 1].week_number;

  // Season spans two years (week 35 of year N to week 20 of year N+1)
  const isBeforeSeason = currentYear < seasonStartYear ||
    (currentYear === seasonStartYear && currentWeek < firstWeek);
  if (isBeforeSeason) return 'not_started';

  const isAfterSeason = currentYear > seasonStartYear + 1 ||
    (currentYear === seasonStartYear + 1 && currentWeek > lastWeek);
  if (isAfterSeason) return 'finished';

  const current = plan.find(w => w.week_number === currentWeek);
  if (current?.is_vacation) return 'break';
  return 'active';
}
