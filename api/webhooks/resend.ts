import { getAdminClient } from '../_lib/supabaseAdmin.js';

interface Req {
  method: string;
  query: Record<string, string | string[] | undefined>;
  body: { type?: string; data?: { email_id?: string } };
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
}

// Resend stuurt hier open/click/bounce-events naartoe. Beveiligd met een
// token in de URL: stel de webhook-URL in Resend in als
//   https://<jouw-domein>/api/webhooks/resend?token=<WEBHOOK_TOKEN>
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  if (!process.env.WEBHOOK_TOKEN || token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Ongeldige webhook-token.' });
  }

  const type = req.body?.type || '';
  const providerId = req.body?.data?.email_id;
  if (!providerId) return res.status(200).json({ ok: true, ignored: true });

  const db = getAdminClient();
  const { data: send } = await db
    .from('email_sends')
    .select('id, campaign_id, opened_at, clicked_at')
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!send) return res.status(200).json({ ok: true, unmatched: true });

  const now = new Date().toISOString();
  const sendRow = send as { id: string; campaign_id: string; opened_at: string | null; clicked_at: string | null };

  // Log het ruwe event.
  await db.from('email_events').insert({ send_id: sendRow.id, campaign_id: sendRow.campaign_id, type, meta: req.body as Record<string, unknown> });

  // Eén keer per send tellen (idempotent op opened_at/clicked_at).
  const bump = async (col: 'opened_count' | 'clicked_count' | 'bounced_count') => {
    const { data: c } = await db.from('email_campaigns').select(col).eq('id', sendRow.campaign_id).single();
    const current = (c as Record<string, number> | null)?.[col] ?? 0;
    await db.from('email_campaigns').update({ [col]: current + 1 }).eq('id', sendRow.campaign_id);
  };

  if (type === 'email.opened' && !sendRow.opened_at) {
    await db.from('email_sends').update({ opened_at: now }).eq('id', sendRow.id);
    await bump('opened_count');
  } else if (type === 'email.clicked' && !sendRow.clicked_at) {
    await db.from('email_sends').update({ clicked_at: now }).eq('id', sendRow.id);
    await bump('clicked_count');
  } else if (type === 'email.bounced') {
    await db.from('email_sends').update({ status: 'bounced' }).eq('id', sendRow.id);
    await bump('bounced_count');
  }

  return res.status(200).json({ ok: true });
}
