import { supabase } from './supabase';
import { computeTier } from './cardTier';
import type { StatAxis, CardTier, PlayerStats, StatEvent, ChallengeCategory } from '../types';

export const STAT_XP: Record<string, Array<{ axis: StatAxis; xp: number }>> = {
  homework_done:   [{ axis: 'consistentie', xp: 15 }, { axis: 'werkethiek', xp: 10 }],
  video_submitted: [{ axis: 'werkethiek',   xp: 15 }, { axis: 'techniek',   xp: 10 }],
  reflection:      [{ axis: 'focus',        xp: 10 }],
  teamspirit:      [{ axis: 'team_spirit',  xp: 15 }],
  challenge_done:  [{ axis: 'techniek',     xp: 20 }, { axis: 'werkethiek', xp: 10 }],
};

const STAT_AXES: StatAxis[] = ['consistentie', 'werkethiek', 'techniek', 'focus', 'team_spirit'];

function isStatAxis(v: string): v is StatAxis {
  return (STAT_AXES as string[]).includes(v);
}

export function computeStats(events: Pick<StatEvent, 'axis' | 'xp'>[]): {
  consistentie: number; werkethiek: number; techniek: number;
  focus: number; team_spirit: number; tier: CardTier; total_xp: number;
} {
  const axisXP: Record<StatAxis, number> = {
    consistentie: 0, werkethiek: 0, techniek: 0, focus: 0, team_spirit: 0,
  };
  let total_xp = 0;
  for (const e of events) {
    if (isStatAxis(e.axis)) {
      axisXP[e.axis] += e.xp;
      total_xp += e.xp;
    }
  }
  return {
    consistentie:  Math.min(100, axisXP.consistentie),
    werkethiek:    Math.min(100, axisXP.werkethiek),
    techniek:      Math.min(100, axisXP.techniek),
    focus:         Math.min(100, axisXP.focus),
    team_spirit:   Math.min(100, axisXP.team_spirit),
    tier:          computeTier(total_xp),
    total_xp,
  };
}

export async function insertStatEvents(
  playerId: string,
  teamId: string,
  eventType: StatEvent['event_type'],
  meta?: Record<string, unknown>,
): Promise<void> {
  const contributions = STAT_XP[eventType];
  if (!contributions?.length) return;

  const rows = contributions.map(({ axis, xp }) => ({
    player_id: playerId,
    team_id:   teamId,
    event_type: eventType,
    axis,
    xp,
    meta: meta ?? null,
  }));

  await supabase.from('stat_events').insert(rows);
}

export const CHALLENGE_CATEGORY_XP: Record<ChallengeCategory, Array<{ axis: StatAxis; xp: number }>> = {
  techniek:    [{ axis: 'techniek',     xp: 20 }, { axis: 'werkethiek', xp: 10 }],
  inzicht:     [{ axis: 'focus',        xp: 20 }, { axis: 'werkethiek', xp: 10 }],
  snelheid:    [{ axis: 'consistentie', xp: 15 }, { axis: 'werkethiek', xp: 10 }],
  mentaliteit: [{ axis: 'team_spirit',  xp: 15 }, { axis: 'werkethiek', xp: 10 }],
};

export async function insertChallengeEvents(
  playerId: string,
  teamId: string,
  category: ChallengeCategory,
  challengeId: string,
): Promise<void> {
  const contributions = CHALLENGE_CATEGORY_XP[category];
  const rows = contributions.map(({ axis, xp }) => ({
    player_id: playerId,
    team_id: teamId,
    event_type: 'challenge_done' as const,
    axis,
    xp,
    meta: { challenge_id: challengeId },
  }));
  await supabase.from('stat_events').insert(rows);
}

/**
 * Verwijdert stat_events die horen bij één specifieke voltooiing (coach trekt
 * goedkeuring in). We matchen op event_type + meta.homework_id / meta.challenge_id,
 * zodat alleen de XP-as bijdrages van díe ene opdracht wegvallen en de rest van de
 * speler-historie intact blijft.
 */
export async function removeStatEvents(
  playerId: string,
  teamId: string,
  eventType: StatEvent['event_type'],
  refKey: 'homework_id' | 'challenge_id',
  refId: string,
): Promise<void> {
  await supabase
    .from('stat_events')
    .delete()
    .eq('player_id', playerId)
    .eq('team_id', teamId)
    .eq('event_type', eventType)
    .contains('meta', { [refKey]: refId });
}

/**
 * Gate-functie: pas bij coach-goedkeuring wordt de huiswerk-voltooiing
 * (completed_homework_ids) + XP + streak toegekend. Idempotent: als het al
 * voltooid is, gebeurt er niets.
 */
export async function grantHomeworkCompletion(
  playerId: string,
  teamId: string,
  hwId: string,
  currentCompleted: string[],
  onStatsRecomputed: (stats: PlayerStats, oldTier: PlayerStats['tier']) => void,
  onStreak: (s: Streak | null) => void,
): Promise<void> {
  if (currentCompleted.includes(hwId)) return;

  const newCompleted = [...currentCompleted, hwId];
  await supabase.from('players').update({ completed_homework_ids: newCompleted }).eq('id', playerId);

  const oldTier = (await fetchAndRecomputeStats(playerId, teamId))?.tier ?? 'brons';
  await Promise.all([
    insertStatEvents(playerId, teamId, 'homework_done', { homework_id: hwId }),
    insertStatEvents(playerId, teamId, 'video_submitted', { homework_id: hwId }),
    incrementStreak(playerId).then(onStreak),
  ]);
  const updated = await fetchAndRecomputeStats(playerId, teamId);
  if (updated) onStatsRecomputed(updated, oldTier);
}

/**
 * Gate-functie: pas bij coach-goedkeuring wordt de challenge-voltooiing + XP + streak
 * toegekend. Idempotent via de bestaande challenge_completions-rij.
 */
export async function grantChallengeCompletion(
  completionId: string,
  playerId: string,
  teamId: string,
  category: Challenge['category'],
  challengeId: string,
  onStatsRecomputed: (stats: PlayerStats, oldTier: PlayerStats['tier']) => void,
  onStreak: (s: Streak | null) => void,
): Promise<void> {
  const { data: existing } = await supabase
    .from('challenge_completions')
    .select('*')
    .eq('id', completionId)
    .maybeSingle();
  if (existing?.granted) return;

  const oldTier = (await fetchAndRecomputeStats(playerId, teamId))?.tier ?? 'brons';
  await Promise.all([
    insertChallengeEvents(playerId, teamId, category, challengeId),
    incrementStreak(playerId).then(onStreak),
  ]);
  await supabase.from('challenge_completions').update({ granted: true }).eq('id', completionId);
  const updated = await fetchAndRecomputeStats(playerId, teamId);
  if (updated) onStatsRecomputed(updated, oldTier);
}

/**
 * Trekt een eerdere goedkeuring in: verwijdert XP-events + decrementeert streak.
 * Zonder straf (geen tier-verlaging door penalty, wel natuurlijke herberekening).
 */
export async function revokeCompletionRewards(
  playerId: string,
  teamId: string,
  ref:
    | { kind: 'homework'; hwId: string }
    | { kind: 'challenge'; completionId: string; challengeId: string },
  onStreak: (s: Streak | null) => void,
): Promise<void> {
  if (ref.kind === 'homework') {
    await removeStatEvents(playerId, teamId, 'homework_done', 'homework_id', ref.hwId);
    await removeStatEvents(playerId, teamId, 'video_submitted', 'homework_id', ref.hwId);
  } else {
    await removeStatEvents(playerId, teamId, 'challenge_done', 'challenge_id', ref.challengeId);
  }
  await decrementStreak(playerId).then(onStreak);
  await fetchAndRecomputeStats(playerId, teamId);
}

export async function fetchAndRecomputeStats(
  playerId: string,
  teamId: string,
): Promise<PlayerStats | null> {
  const { data: events } = await supabase
    .from('stat_events')
    .select('axis, xp')
    .eq('player_id', playerId);

  if (!events) return null;

  const computed = computeStats(events as Pick<StatEvent, 'axis' | 'xp'>[]);

  const row: Omit<PlayerStats, 'prev_snapshot' | 'snapshot_at'> & {
    prev_snapshot: null; snapshot_at: null; updated_at: string;
  } = {
    player_id:   playerId,
    team_id:     teamId,
    ...computed,
    prev_snapshot: null,
    snapshot_at:   null,
    updated_at:    new Date().toISOString(),
  };

  const { data: upserted } = await supabase
    .from('player_stats')
    .upsert(row, { onConflict: 'player_id' })
    .select()
    .single();

  return (upserted as PlayerStats) ?? null;
}
