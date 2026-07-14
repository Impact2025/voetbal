import { verifySuperadmin } from '../_lib/adminGuard.js';
import { getAdminClient, logAdminAction } from '../_lib/supabaseAdmin.js';
import { SetClubTierSchema, validateOrError } from '../_lib/validate.js';
import { applyCors } from '../_lib/cors.js';

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: { clubId: string; tier: 'free' | 'pro' };
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

// Superadmin: zet de PRO-status van een club (handmatige activatie door de
// accountmanager). Dit verving de directe client-side update op
// clubs.subscription_tier — die wordt nu door een DB-trigger geweigerd
// (zie supabase/secure_club_billing.sql). Stripe-betalingen zetten de tier
// automatisch via api/stripe/webhook.ts.
export default async function handler(req: Req, res: Res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const admin = await verifySuperadmin(req.headers['authorization']);
  if (!admin) return res.status(401).json({ error: 'Geen toegang.' });

  if (!validateOrError(SetClubTierSchema, req.body, res)) return;
  const { clubId, tier } = req.body;

  const db = getAdminClient();
  const { data: club, error } = await db
    .from('clubs')
    .update({ subscription_tier: tier })
    .eq('id', clubId)
    .select('id')
    .maybeSingle();

  if (error) return res.status(500).json({ error: `Bijwerken mislukt: ${error.message}` });
  if (!club) return res.status(404).json({ error: 'Club niet gevonden.' });

  await logAdminAction({
    actorId: admin.id,
    actorEmail: admin.email,
    action: 'set_club_tier',
    target: clubId,
    meta: { tier },
  });

  return res.status(200).json({ ok: true, tier });
}
