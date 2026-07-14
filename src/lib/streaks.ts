import { supabase } from './supabase';
import type { Streak } from '../types';

export function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = zondag
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  return sunday.toISOString().split('T')[0];
}

export async function getOrCreateStreak(playerId: string): Promise<Streak | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') return null;
  if (!data) return null;

  // Als week_start ouder is dan huidige week → reset client-side view
  const currentWeek = getWeekStart();
  if (data.week_start < currentWeek) {
    // Vorige week gemist (0 activiteiten) → sleep-state zodat Revive-knop verschijnt
    const prevCount = (data as Streak).activities_count ?? 0;
    const flameState: Streak['flame_state'] = prevCount === 0 ? 'sleep' : 'active';
    return { ...data as Streak, activities_count: 0, flame_state: flameState, recovery_used: false, week_start: currentWeek };
  }

  return data as Streak;
}

export async function reviveStreak(playerId: string): Promise<Streak | null> {
  const currentWeek = getWeekStart();
  const { data } = await supabase
    .from('streaks')
    .update({ flame_state: 'active', recovery_used: true })
    .eq('player_id', playerId)
    .eq('week_start', currentWeek)
    .select()
    .single();
  return (data as Streak) ?? null;
}

export async function incrementStreak(playerId: string): Promise<Streak | null> {
  const currentWeek = getWeekStart();

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  const isNewWeek = !existing || existing.week_start < currentWeek;

  const prevBest = existing?.best_week_count ?? 0;
  const prevCount = isNewWeek ? 0 : (existing?.activities_count ?? 0);
  const weekGoal = existing?.week_goal ?? 2;

  const newCount = prevCount + 1;
  const flameState: Streak['flame_state'] = newCount >= weekGoal ? 'complete' : 'active';
  const newBest = Math.max(prevBest, isNewWeek ? (existing?.activities_count ?? 0) : newCount);

  const row: Omit<Streak, 'updated_at'> = {
    player_id:       playerId,
    week_start:      currentWeek,
    activities_count: newCount,
    week_goal:       weekGoal,
    best_week_count: newBest,
    recovery_used:   false,
    flame_state:     flameState,
  };

  const { data } = await supabase
    .from('streaks')
    .upsert(row, { onConflict: 'player_id' })
    .select()
    .single();

  return (data as Streak) ?? null;
}

/**
 * Trekt één activiteit van de huidige week-streak af (coach trekt goedkeuring in).
 * Clampt op 0 — we verlagen nooit onder nul, en corrigeert best_week_count niet
 * achteraf (vermijdt straf bij een onschuldige "un-approve").
 */
export async function decrementStreak(playerId: string): Promise<Streak | null> {
  const currentWeek = getWeekStart();

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  // Geen streak-rij (bijv. op een verse DB) → niets om af te trekken.
  if (!existing) return null;

  const isCurrentWeek = (existing.week_start ?? '') === currentWeek;
  const prevCount = isCurrentWeek ? (existing.activities_count ?? 0) : 0;
  const newCount = Math.max(0, prevCount - 1);
  const weekGoal = existing.week_goal ?? 2;
  const flameState: Streak['flame_state'] = newCount >= weekGoal ? 'complete' : 'active';

  const { data } = await supabase
    .from('streaks')
    .upsert(
      {
        player_id:       playerId,
        week_start:      currentWeek,
        activities_count: newCount,
        week_goal:       weekGoal,
        best_week_count: existing.best_week_count ?? 0,
        recovery_used:   existing.recovery_used ?? false,
        flame_state:     flameState,
      },
      { onConflict: 'player_id' },
    )
    .select()
    .single();

  return (data as Streak) ?? null;
}
