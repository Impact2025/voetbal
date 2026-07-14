import { getAdminClient } from './supabaseAdmin.js';

// Durable rate-limiting via de api_rate_limits-tabel (zie
// supabase/api_rate_limits.sql). Anders dan middleware.ts — dat in-memory per
// edge-node telt en dus over nodes heen lek is — telt deze limiter centraal
// in de database. Fail-open: een DB-storing mag features niet platleggen.

/**
 * Registreert één hit voor `key` en geeft true terug als de limiet
 * (max hits per windowSeconds) daarmee overschreden is.
 */
export async function overRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const db = getAdminClient();
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

    const { count, error } = await db
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', since);
    if (error) {
      console.error('[rateLimit] telling mislukt:', error.message);
      return false;
    }
    if ((count ?? 0) >= max) return true;

    await db.from('api_rate_limits').insert({ key });

    // Opportunistische opschoning: rijen ouder dan 24u voor deze key.
    await db
      .from('api_rate_limits')
      .delete()
      .eq('key', key)
      .lt('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());

    return false;
  } catch (err) {
    console.error('[rateLimit] onbereikbaar:', err instanceof Error ? err.message : err);
    return false;
  }
}
