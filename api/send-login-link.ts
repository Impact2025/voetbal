import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const APP_URL = 'https://skillkaart.nl';

interface Req { method: string; body: { email?: string; linkCode?: string } }
interface Res {
  status: (c: number) => Res;
  json: (d: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

function renderHtml(magicLink: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#16A34A;padding:22px 28px;">
            <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:3px;">SKILLKAART</div>
            <div style="font-size:11px;color:#bbf7d0;margin-top:2px;">Ouder-portaal</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 16px;">
            <h2 style="margin:0 0 10px;font-size:20px;font-weight:800;color:#111827;">Jouw inloglink 🔑</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#4b5563;line-height:1.7;">
              Klik op de knop hieronder om direct in te loggen op Skillkaart — geen wachtwoord nodig.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${magicLink}" style="display:inline-block;background:#16A34A;color:#fff;font-size:15px;font-weight:900;text-decoration:none;padding:15px 40px;border-radius:50px;">
                    Inloggen op Skillkaart →
                  </a>
                </td>
              </tr>
              <tr><td align="center" style="padding-top:10px;font-size:11px;color:#9ca3af;">Link is 24 uur geldig</td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
              Werkt de knop niet? Kopieer en plak deze link in je browser:<br>
              <a href="${magicLink}" style="color:#16A34A;word-break:break-all;">${magicLink}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
              Je ontvangt deze mail omdat er een inlogverzoek is ingediend voor <strong>${email}</strong>.<br>
              Niet jij? Dan kun je deze e-mail negeren.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const email = (req.body?.email ?? '').trim();
  if (!email.includes('@')) {
    res.status(400).json({ error: 'Ongeldig e-mailadres.' });
    return;
  }
  const linkCode = (req.body?.linkCode ?? '').trim().toUpperCase();

  const resendKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendKey || !supabaseUrl || !serviceKey) {
    console.error('[send-login-link] Ontbrekende env vars');
    res.status(500).json({ error: 'Serverconfiguratie ontbreekt.' });
    return;
  }

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const redirectTo = linkCode ? `${APP_URL}?parentCode=${encodeURIComponent(linkCode)}` : APP_URL;
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      console.warn('[send-login-link] generateLink mislukt voor', email, error?.message);
      res.status(404).json({
        error: 'Geen account gevonden voor dit e-mailadres. Vraag de coach om een uitnodiging.',
      });
      return;
    }

    const magicLink = data.properties.action_link;
    const FROM = process.env.MAIL_FROM || 'Skillkaart <onboarding@resend.dev>';
    const resend = new Resend(resendKey);

    const { error: sendErr } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: 'Jouw inloglink voor Skillkaart',
      html: renderHtml(magicLink, email),
    });

    if (sendErr) {
      console.error('[send-login-link] Resend error:', sendErr.message);
      res.status(500).json({ error: 'E-mail versturen mislukt.' });
      return;
    }

    console.log('[send-login-link] Verstuurd naar', email);
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[send-login-link] Exception:', msg);
    res.status(500).json({ error: msg });
  }
}
