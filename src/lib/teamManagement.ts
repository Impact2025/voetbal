import { supabase } from './supabase';
import type { Team, TeamCoach } from '../types';

export interface TeamDraft {
  id: string;
  team_name: string;
  team_class: string;
}

export async function createTeam(clubId: string, draft: TeamDraft): Promise<Team> {
  const { data: existing } = await supabase.from('teams').select('id').eq('id', draft.id).maybeSingle();
  if (existing) throw new Error('Deze Team ID is al in gebruik. Kies een andere.');

  const { data, error } = await supabase
    .from('teams')
    .insert({
      id: draft.id,
      club_id: clubId,
      team_name: draft.team_name,
      team_class: draft.team_class,
      coach_id: null,
      evaluation_periods: ['Check-in 1', 'Check-in 2', 'Check-in 3'],
      assigned_homework_ids: [],
      weekly_questions: [],
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Team;
}

export async function updateTeam(teamId: string, patch: Partial<Pick<Team, 'team_name' | 'team_class' | 'evaluation_periods'>>): Promise<void> {
  const { error } = await supabase.from('teams').update(patch).eq('id', teamId);
  if (error) throw new Error(error.message);
}

export async function archiveTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').update({ archived_at: new Date().toISOString() }).eq('id', teamId);
  if (error) throw new Error(error.message);
}

export async function unarchiveTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').update({ archived_at: null }).eq('id', teamId);
  if (error) throw new Error(error.message);
}

export async function fetchTeamCoaches(teamIds: string[]): Promise<TeamCoach[]> {
  if (!teamIds.length) return [];
  const { data, error } = await supabase
    .from('team_coaches')
    .select('*')
    .in('team_id', teamIds)
    .neq('status', 'removed')
    .order('invited_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamCoach[];
}

/** Alle actieve coaches binnen de club, gededupliceerd op coach_id — voor de "bestaande coach toewijzen"-picker. */
export async function fetchClubCoaches(clubId: string): Promise<{ coachId: string; email: string }[]> {
  const { data, error } = await supabase
    .from('team_coaches')
    .select('coach_id, email')
    .eq('club_id', clubId)
    .eq('status', 'active')
    .not('coach_id', 'is', null);
  if (error) throw new Error(error.message);
  const seen = new Map<string, string>();
  for (const row of (data ?? []) as { coach_id: string; email: string }[]) {
    if (!seen.has(row.coach_id)) seen.set(row.coach_id, row.email);
  }
  return [...seen.entries()].map(([coachId, email]) => ({ coachId, email }));
}

async function setTeamHeadIfEmpty(teamId: string, coachId: string): Promise<void> {
  const { data: team } = await supabase.from('teams').select('coach_id').eq('id', teamId).maybeSingle();
  if (team && !team.coach_id) {
    await supabase.from('teams').update({ coach_id: coachId }).eq('id', teamId);
  }
}

/** Koppelt een coach die al ergens anders in de club actief is aan een extra team (geen uitnodiging nodig). */
export async function addExistingCoachToTeam(params: {
  teamId: string; clubId: string; coachId: string; email: string; role: 'head' | 'assistant';
}): Promise<TeamCoach> {
  const { data, error } = await supabase
    .from('team_coaches')
    .insert({
      team_id: params.teamId,
      club_id: params.clubId,
      coach_id: params.coachId,
      email: params.email,
      role: params.role,
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (params.role === 'head') await setTeamHeadIfEmpty(params.teamId, params.coachId);
  return data as TeamCoach;
}

/** Maakt een uitnodiging aan voor een nog niet bestaande coach (nieuw account bij registratie). */
export async function inviteCoach(params: {
  teamId: string; clubId: string; email: string; role: 'head' | 'assistant';
}): Promise<TeamCoach> {
  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from('team_coaches')
    .insert({
      team_id: params.teamId,
      club_id: params.clubId,
      coach_id: null,
      email: params.email.trim().toLowerCase(),
      role: params.role,
      status: 'invited',
      invite_token: token,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TeamCoach;
}

/**
 * Verwijdert een uitnodiging die nooit is aangekomen (mail-verzending mislukt).
 * Hard delete in plaats van status 'removed': de coach heeft nooit iets ontvangen,
 * dus er is geen historie om te bewaren. De status-guard voorkomt dat een coach
 * die inmiddels geaccepteerd heeft alsnog wordt weggegooid.
 */
export async function deleteFailedInvite(teamCoachId: string): Promise<void> {
  const { error } = await supabase
    .from('team_coaches')
    .delete()
    .eq('id', teamCoachId)
    .eq('status', 'invited');
  if (error) throw new Error(error.message);
}

export async function removeCoachFromTeam(teamCoachId: string, teamId: string, coachId: string | null): Promise<void> {
  const { error } = await supabase
    .from('team_coaches')
    .update({ status: 'removed', removed_at: new Date().toISOString() })
    .eq('id', teamCoachId);
  if (error) throw new Error(error.message);

  // Als dit de hoofdcoach-pointer op teams was, loskoppelen zodat de club-admin een nieuwe kan aanwijzen.
  if (coachId) {
    const { data: team } = await supabase.from('teams').select('coach_id').eq('id', teamId).maybeSingle();
    if (team?.coach_id === coachId) {
      await supabase.from('teams').update({ coach_id: null }).eq('id', teamId);
    }
  }
}

/** Publieke weergave van een uitnodiging: bevat bewust géén invite_token. */
export interface CoachInvite {
  id: string;
  email: string;
  team_id: string;
  club_id: string;
  role: 'head' | 'assistant';
  team_name: string;
}

/**
 * Een uitnodiging kan om drie redenen niet bruikbaar zijn, en die moeten
 * uit elkaar te houden zijn: een verlopen link vraagt om een andere melding
 * dan een netwerkstoring. Vandaar een expliciet resultaat in plaats van null.
 */
export type InviteLookup =
  | { status: 'ok'; invite: CoachInvite }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export async function fetchInviteByToken(token: string): Promise<InviteLookup> {
  const { data, error } = await supabase.rpc('get_coach_invite', { p_token: token });
  if (error) return { status: 'error', message: error.message };
  const row = (data as CoachInvite[] | null)?.[0];
  if (!row) return { status: 'not_found' };
  return { status: 'ok', invite: row };
}

/**
 * Rondt een coach-uitnodiging af nadat het account is aangemaakt. Draait
 * server-side in één transactie (zie supabase/secure_team_coaches.sql), zodat
 * team_coaches, teams.coach_id en profiles niet half bijgewerkt kunnen raken.
 */
export async function acceptCoachInvite(token: string, coachId: string, email: string): Promise<{ teamId: string; clubId: string }> {
  const { data, error } = await supabase.rpc('accept_coach_invite', {
    p_token: token,
    p_coach_id: coachId,
    p_email: email,
  });
  if (error) throw new Error(error.message);
  const row = (data as { team_id: string; club_id: string }[] | null)?.[0];
  if (!row) throw new Error('Deze uitnodiging is niet meer geldig.');
  return { teamId: row.team_id, clubId: row.club_id };
}
