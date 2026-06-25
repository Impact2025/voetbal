import { supabase } from './supabase';
import type { TeamChallenge } from '../types';

function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().split('T')[0];
}

export async function getActiveTeamChallenge(teamId: string): Promise<TeamChallenge | null> {
  const week = currentWeekStart();
  const { data } = await supabase
    .from('team_challenges')
    .select('*')
    .eq('team_id', teamId)
    .eq('week_start', week)
    .maybeSingle();
  return (data as TeamChallenge) ?? null;
}

export async function getTeamChallengeProgress(teamId: string, weekStart: string): Promise<{ total: number; mine: number }> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data, error } = await supabase
    .from('stat_events')
    .select('id, player_id')
    .eq('team_id', teamId)
    .in('event_type', ['homework_done', 'challenge_done'])
    .gte('created_at', weekStart)
    .lt('created_at', weekEnd.toISOString().split('T')[0]);

  if (error || !data) return { total: 0, mine: 0 };
  return { total: data.length, mine: 0 };
}

export async function getTeamChallengeProgressWithPlayer(
  teamId: string,
  weekStart: string,
  playerId: string,
): Promise<{ total: number; mine: number }> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data, error } = await supabase
    .from('stat_events')
    .select('id, player_id')
    .eq('team_id', teamId)
    .in('event_type', ['homework_done', 'challenge_done'])
    .gte('created_at', weekStart)
    .lt('created_at', weekEnd.toISOString().split('T')[0]);

  if (error || !data) return { total: 0, mine: 0 };
  return {
    total: data.length,
    mine: data.filter(e => e.player_id === playerId).length,
  };
}

export async function upsertTeamChallenge(
  teamId: string,
  payload: Pick<TeamChallenge, 'title' | 'description' | 'emoji' | 'target_count'>,
): Promise<TeamChallenge | null> {
  const week = currentWeekStart();
  const { data } = await supabase
    .from('team_challenges')
    .upsert(
      { team_id: teamId, week_start: week, ...payload },
      { onConflict: 'team_id,week_start' },
    )
    .select()
    .single();
  return (data as TeamChallenge) ?? null;
}

export async function deleteTeamChallenge(teamId: string): Promise<void> {
  const week = currentWeekStart();
  await supabase
    .from('team_challenges')
    .delete()
    .eq('team_id', teamId)
    .eq('week_start', week);
}
