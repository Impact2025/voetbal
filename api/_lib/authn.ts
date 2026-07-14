import { getAdminClient } from './supabaseAdmin.js';

// Gedeelde authenticatie voor serverless endpoints. Verifieert de Supabase
// Bearer-token en levert het bijbehorende profiel (rol + club/team) op.

export interface CallerProfile {
  id: string;
  email: string;
  role: string;
  club_id: string | null;
  team_id: string | null;
}

/** Verifieert de Authorization-header en geeft het profiel terug, of null. */
export async function getCallerProfile(authHeader?: string): Promise<CallerProfile | null> {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return null;

    const { data: profile } = await admin
      .from('profiles')
      .select('role, club_id, team_id')
      .eq('id', data.user.id)
      .maybeSingle();
    if (!profile) return null;

    const p = profile as { role?: string; club_id?: string | null; team_id?: string | null };
    return {
      id: data.user.id,
      email: data.user.email || '',
      role: p.role || '',
      club_id: p.club_id ?? null,
      team_id: p.team_id ?? null,
    };
  } catch {
    return null;
  }
}

/** Als getCallerProfile, maar alleen voor de opgegeven rollen. */
export async function getCallerWithRole(
  authHeader: string | undefined,
  roles: string[],
): Promise<CallerProfile | null> {
  const caller = await getCallerProfile(authHeader);
  if (!caller || !roles.includes(caller.role)) return null;
  return caller;
}

/**
 * Speler-"auth": spelers hebben geen Supabase-sessie (PIN-login), maar hun
 * speler-uuid is onraadbaar en fungeert als capability-token. We checken dat
 * het uuid daadwerkelijk bij een speler hoort.
 */
export async function verifyPlayerId(playerId?: string): Promise<boolean> {
  const id = playerId?.trim();
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return false;
  try {
    const { data } = await getAdminClient()
      .from('players')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}
