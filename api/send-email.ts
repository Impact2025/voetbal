import { Resend } from 'resend';
import { getAdminClient } from './_lib/supabaseAdmin.js';
import { SendEmailSchema, validateOrError } from './_lib/validate.js';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: {
    to: string[];
    toNames: string[];
    subject: string;
    body: string;
    clubName: string;
    senderEmail: string;
  };
}

interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

// Verifieer dat de gebruiker is ingelogd en club_admin of superadmin is.
// Zonder geldige token: 401. Zonder juiste rol: 403.
async function verifyAuth(authHeader?: string): Promise<{ id: string; role: string } | null> {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return null;
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    const role = (profile as { role: string } | null)?.role || '';
    if (role !== 'club_admin' && role !== 'superadmin') return null;
    return { id: data.user.id, role };
  } catch {
    return null;
  }
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Auth-check: club_admin of superadmin vereist
  const user = await verifyAuth(req.headers['authorization']);
  if (!user) {
    return res.status(401).json({ error: 'Geen toegang. Alleen club-beheerders kunnen e-mail versturen.' });
  }

  // Input-validatie met zod
  if (!validateOrError(SendEmailSchema, req.body, res)) return;

  const { to, toNames, subject, body, clubName, senderEmail } = req.body;

  if (!to?.length || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Ontbrekende verplichte velden.' });
  }
  if (to.length > 50) {
    return res.status(400).json({ error: 'Te veel ontvangers (max 50).' });
  }

  const safeBody = body.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#090B0F;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#00FF9D;padding:20px 28px;">
                <div style="font-size:20px;font-weight:900;color:#000;letter-spacing:3px;">SKILLKAART</div>
                <div style="font-size:12px;color:#00000080;margin-top:4px;">${clubName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h2 style="margin:0 0 20px;color:#ffffff;font-size:18px;font-weight:700;">${subject.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
                <div style="color:#d1d5db;font-size:14px;line-height:1.8;">${safeBody}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #1f2937;">
                <p style="margin:0;font-size:11px;color:#6b7280;">
                  Verstuurd via <span style="color:#00FF9D;">Skillkaart</span> door ${clubName}
                  · Reageer op: <a href="mailto:${senderEmail}" style="color:#00FF9D;">${senderEmail}</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `${clubName} via Skillkaart <onboarding@resend.dev>`,
      to,
      replyTo: senderEmail || undefined,
      subject,
      html,
    });

    if (error) throw new Error(error.message);

    res.json({ ok: true, sent: to.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    res.status(500).json({ error: message });
  }
}
