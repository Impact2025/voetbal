import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service-role client voor server-side admin werk. Omzeilt RLS — mag
// NOOIT in de browser belanden. Vereist env vars in Vercel:
//   SUPABASE_URL                (zonder VITE_ prefix)
//   SUPABASE_SERVICE_ROLE_KEY
let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL en/of SUPABASE_SERVICE_ROLE_KEY ontbreken in de omgeving.');
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// Schrijft een regel naar het audit-log. Faalt stil — een mislukte log
// mag de eigenlijke actie nooit blokkeren.
export async function logAdminAction(params: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  target?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await getAdminClient().from('admin_audit_log').insert({
      actor_id: params.actorId ?? null,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      target: params.target ?? null,
      meta: params.meta ?? null,
    });
  } catch (err) {
    console.error('logAdminAction faalde:', err);
  }
}
