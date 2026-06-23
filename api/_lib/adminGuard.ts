import { getAdminClient } from './supabaseAdmin.js';

const SUPERADMIN_EMAIL = 'v.munster@weareimpact.nl';

export interface AdminIdentity {
  id: string;
  email: string;
}

// Verifieert de Bearer-token uit de Authorization header en geeft de
// gebruiker terug als (en alleen als) die de superadmin is. Anders null.
export async function verifySuperadmin(authHeader?: string): Promise<AdminIdentity | null> {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const admin = getAdminClient();

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;

  const user = data.user;
  const emailMatch = (user.email || '').toLowerCase() === SUPERADMIN_EMAIL;

  let roleMatch = false;
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role === 'superadmin') roleMatch = true;

  if (!emailMatch && !roleMatch) return null;

  return { id: user.id, email: user.email || '' };
}

// Verifieert dat een cron-request van Vercel komt (Authorization: Bearer <CRON_SECRET>).
export function verifyCron(authHeader?: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  return token === secret;
}
