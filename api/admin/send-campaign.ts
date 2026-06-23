import { Resend } from 'resend';
import { verifySuperadmin } from '../_lib/adminGuard.js';
import { getAdminClient, logAdminAction } from '../_lib/supabaseAdmin.js';
import { unsubscribeUrl } from '../_lib/mailToken.js';

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: {
    campaignId?: string;
    name?: string;
    subject?: string;
    body?: string;
    segment?: string;
    segment_stage?: string | null;
  };
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderHtml(subject: string, body: string, name: string, unsubUrl: string): string {
  const personalized = body.replace(/\{\{\s*na(a)?m\s*\}\}/gi, name || '');
  const safeBody = esc(personalized).replace(/\n/g, '<br>');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#090B0F;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#00FF9D;padding:20px 28px;">
            <div style="font-size:20px;font-weight:900;color:#000;letter-spacing:3px;">SKILLKAART</div>
          </td></tr>
          <tr><td style="padding:32px 28px;">
            <h2 style="margin:0 0 20px;color:#fff;font-size:18px;font-weight:700;">${esc(subject)}</h2>
            <div style="color:#d1d5db;font-size:14px;line-height:1.8;">${safeBody}</div>
          </td></tr>
          <tr><td style="padding:16px 28px;border-top:1px solid #1f2937;">
            <p style="margin:0;font-size:11px;color:#6b7280;">
              Skillkaart · <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Afmelden</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const admin = await verifySuperadmin(req.headers['authorization']);
  if (!admin) return res.status(401).json({ error: 'Geen toegang.' });

  const { campaignId, name, subject, body, segment, segment_stage } = req.body;
  const db = getAdminClient();

  // 1. Campagne ophalen of aanmaken.
  let campaign: { id: string; subject: string; body: string; segment: string; segment_stage: string | null };
  if (campaignId) {
    const { data, error } = await db.from('email_campaigns').select('*').eq('id', campaignId).single();
    if (error || !data) return res.status(404).json({ error: 'Campagne niet gevonden.' });
    campaign = data as typeof campaign;
  } else {
    if (!subject?.trim() || !body?.trim() || !segment) {
      return res.status(400).json({ error: 'subject, body en segment zijn verplicht.' });
    }
    const { data, error } = await db.from('email_campaigns')
      .insert({ name: name?.trim() || subject.trim(), subject: subject.trim(), body, segment, segment_stage: segment_stage ?? null })
      .select().single();
    if (error || !data) return res.status(500).json({ error: error?.message || 'Aanmaken mislukt.' });
    campaign = data as typeof campaign;
  }

  // 2. Ontvangers oplossen (server-side, minus afmeldingen).
  const { data: recips, error: recipErr } = await db.rpc('email_resolve_recipients', {
    p_segment: campaign.segment, p_stage: campaign.segment_stage,
  });
  if (recipErr) return res.status(500).json({ error: recipErr.message });
  const recipients = (recips ?? []) as { email: string; name: string }[];
  if (recipients.length === 0) {
    await db.from('email_campaigns').update({ status: 'sent', recipients_count: 0, sent_at: new Date().toISOString() }).eq('id', campaign.id);
    return res.status(200).json({ ok: true, sent: 0, message: 'Geen ontvangers.' });
  }

  await db.from('email_campaigns').update({ status: 'sending', recipients_count: recipients.length }).eq('id', campaign.id);

  // 3. send-rijen aanmaken (queued).
  const sendRows = recipients.map((r) => ({ campaign_id: campaign.id, email: r.email, name: r.name, status: 'queued' as const }));
  const { data: inserted } = await db.from('email_sends').insert(sendRows).select('id, email');
  const idByEmail = new Map((inserted ?? []).map((s: { id: string; email: string }) => [s.email, s.id]));

  // 4. Versturen via Resend in batches van 100.
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY ontbreekt.' });
  const resend = new Resend(resendKey);
  const from = process.env.MAIL_FROM || 'Skillkaart <onboarding@resend.dev>';
  const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.headers['host'] || ''}`;

  let sent = 0;
  let failed = 0;

  for (const group of chunk(recipients, 100)) {
    const payload = group.map((r) => {
      const url = unsubscribeUrl(baseUrl, r.email);
      return {
        from,
        to: [r.email],
        subject: campaign.subject,
        html: renderHtml(campaign.subject, campaign.body, r.name, url),
        headers: { 'List-Unsubscribe': `<${url}>` },
      };
    });

    try {
      const result = await resend.batch.send(payload);
      const ids = ((result as { data?: { data?: { id: string }[] } }).data?.data) ?? [];
      for (let i = 0; i < group.length; i++) {
        const r = group[i];
        const sendId = idByEmail.get(r.email);
        const providerId = ids[i]?.id ?? null;
        if (sendId) {
          await db.from('email_sends').update({ status: 'sent', provider_id: providerId }).eq('id', sendId);
        }
        sent++;
      }
    } catch (err) {
      for (const r of group) {
        const sendId = idByEmail.get(r.email);
        if (sendId) await db.from('email_sends').update({ status: 'failed', error: err instanceof Error ? err.message : 'fout' }).eq('id', sendId);
        failed++;
      }
    }
  }

  // 5. Campagne afronden.
  await db.from('email_campaigns').update({
    status: failed === recipients.length ? 'failed' : 'sent',
    sent_count: sent,
    sent_at: new Date().toISOString(),
  }).eq('id', campaign.id);

  await logAdminAction({
    actorId: admin.id, actorEmail: admin.email,
    action: 'campaign_sent', target: campaign.id,
    meta: { recipients: recipients.length, sent, failed, segment: campaign.segment },
  });

  return res.status(200).json({ ok: true, campaignId: campaign.id, recipients: recipients.length, sent, failed });
}
