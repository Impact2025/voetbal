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

export async function fetchAllClubsWithTier(): Promise<{ id: string; name: string; subscription_tier: 'free' | 'pro' }[]> {
  const { data } = await supabase
    .from('clubs')
    .select('id, name, subscription_tier')
    .order('name');
  return (data ?? []).map(c => ({
    id: c.id as string,
    name: (c.name as string) ?? c.id,
    subscription_tier: (c.subscription_tier as 'free' | 'pro') ?? 'free',
  }));
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

/**
 * Zet de PRO-status van een club via het superadmin-endpoint. De directe
 * client-side update op clubs.subscription_tier is vervallen: een DB-trigger
 * weigert die (zie supabase/secure_club_billing.sql), zodat PRO alleen via
 * Stripe of de superadmin geactiveerd kan worden. Gooit bij fouten.
 */
export async function setClubProStatus(clubId: string, isPro: boolean): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Niet ingelogd.');

  const res = await fetch('/api/admin/set-club-tier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ clubId, tier: isPro ? 'pro' : 'free' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as { error?: string }));
    throw new Error((data as { error?: string }).error || 'PRO-status bijwerken mislukt.');
  }
}

/** Zet een numerieke spelersleeftijd om naar het dichtstbijzijnde seizoensprogramma-label (O8..O12). */
export function ageToAgeGroup(age: string | number | undefined): string {
  const n = typeof age === 'number' ? age : parseInt(age ?? '10', 10);
  const clamped = Math.min(12, Math.max(8, Number.isNaN(n) ? 10 : n));
  return `O${clamped}`;
}

/** Haalt de challenge-tekst van de huidige trainingsweek op (gratis basisfeature, onafhankelijk van PRO-status). */
export async function fetchCurrentWeekChallenge(
  clubId: string,
  ageGroup: string,
): Promise<SeasonWeekPlan | null> {
  const configs = await fetchClubTrainingConfigs(clubId);
  if (!configs.some(c => c.age_group === ageGroup)) return null;

  const [plan, overrides] = await Promise.all([
    fetchSeasonPlan(ageGroup),
    fetchClubWeekOverrides(clubId, ageGroup),
  ]);
  const weekPlan = getCurrentSeasonWeek(plan, overrides);
  return weekPlan?.challenge ? weekPlan : null;
}

// Determine which week of the season we're currently in
export function getCurrentSeasonWeek(
  plan: SeasonWeekPlan[],
  overrides: ClubWeekOverride[]
): SeasonWeekPlan | null {
  const now = new Date('2026-08-24'); // DEMO: week 35
  const currentWeek = getISOWeek(now);
  const disabledWeeks = new Set(overrides.filter(o => !o.is_enabled).map(o => o.week_number));
  return plan.find(w => w.week_number === currentWeek && !w.is_vacation && !disabledWeeks.has(w.week_number)) ?? null;
}

export function getSeasonStatus(
  plan: SeasonWeekPlan[],
  config: ClubTrainingConfig
): 'not_started' | 'active' | 'break' | 'finished' {
  if (!plan.length) return 'not_started';
  const now = new Date('2026-08-24'); // DEMO: week 35
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
