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
