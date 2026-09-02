import { getAdminClient } from './supabaseAdmin.js';
import { getCallerProfile, verifyPlayerId, type CallerProfile } from './authn.js';

// Gedeelde identiteits- en team-toegangsresolutie voor endpoints die
// teamgebonden data van kinderen serveren (bv. team-chat). Bepaalt op basis
// van de Supabase-sessie (coach/club_admin/ouder) of het speler-uuid
// (X-Player-Id) tot welke team_id's de aanroeper toegang heeft, zodat een
// gebruiker nooit chat/data van een ander team kan lezen of schrijven.

export interface Identity {
  kind: 'coach' | 'club_admin' | 'parent' | 'player' | 'superadmin';
  id: string;       // auth.uid() voor coach/club_admin/ouder, player.id voor spelers
  name: string;
  caller?: CallerProfile;
}

export async function resolveIdentity(headers: Record<string, string | undefined>): Promise<Identity | null> {
  const caller = await getCallerProfile(headers['authorization']);
  if (caller) {
    if (caller.role === 'superadmin') return { kind: 'superadmin', id: caller.id, name: caller.email, caller };
    if (caller.role === 'club_admin') return { kind: 'club_admin', id: caller.id, name: caller.email, caller };
    if (caller.role === 'parent') return { kind: 'parent', id: caller.id, name: caller.email, caller };
    if (caller.role === 'coach') return { kind: 'coach', id: caller.id, name: caller.email, caller };
    return null;
  }

  const playerId = headers['x-player-id'];
  if (await verifyPlayerId(playerId)) {
    const id = playerId!.trim();
    const { data } = await getAdminClient().from('players').select('name').eq('id', id).maybeSingle();
    return { kind: 'player', id, name: (data as { name?: string } | null)?.name ?? 'Speler' };
  }

  return null;
}

/** Team-id's waar deze identiteit chat-toegang toe heeft. Lege array = geen toegang. */
export async function accessibleTeamIds(identity: Identity): Promise<string[]> {
  const admin = getAdminClient();

  if (identity.kind === 'superadmin') {
    const { data } = await admin.from('teams').select('id');
    return ((data ?? []) as { id: string }[]).map(t => t.id);
  }

  if (identity.kind === 'club_admin') {
    if (!identity.caller?.club_id) return [];
    const { data } = await admin.from('teams').select('id').eq('club_id', identity.caller.club_id);
    return ((data ?? []) as { id: string }[]).map(t => t.id);
  }

  if (identity.kind === 'coach') {
    const [viaJunction, viaLegacy] = await Promise.all([
      admin.from('team_coaches').select('team_id').eq('coach_id', identity.id).eq('status', 'active'),
      admin.from('teams').select('id').eq('coach_id', identity.id),
    ]);
    const ids = new Set<string>();
    for (const r of (viaJunction.data ?? []) as { team_id: string }[]) ids.add(r.team_id);
    for (const r of (viaLegacy.data ?? []) as { id: string }[]) ids.add(r.id);
    return [...ids];
  }

  if (identity.kind === 'parent') {
    const { data } = await admin.from('parent_links').select('team_id').eq('parent_id', identity.id);
    return [...new Set(((data ?? []) as { team_id: string }[]).map(r => r.team_id))];
  }

  if (identity.kind === 'player') {
    const { data } = await admin.from('players').select('team_id').eq('id', identity.id).maybeSingle();
    const teamId = (data as { team_id?: string } | null)?.team_id;
    return teamId ? [teamId] : [];
  }

  return [];
}

/** Rol zoals opgeslagen in team_channel_members / messages (user_type / sender_role). */
export function identityUserType(identity: Identity): 'player' | 'parent' | 'coach' | 'club_admin' {
  if (identity.kind === 'superadmin') return 'club_admin';
  return identity.kind;
}
