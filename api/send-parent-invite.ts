import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { MAIL_FROM } from './_lib/mailFrom.js';

const APP_URL = 'https://skillkaart.nl';

interface Req {
  method: string;
  body: {
    to: string;
    playerName: string;
    linkCode: string;
    expiresAt: string;
    senderName?: string;
  };
}

interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

async function getMagicLink(email: string, linkCode: string): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const redirectTo = `${APP_URL}/?parentCode=${linkCode}`;

    // Try invite (creates new user if they don't exist)
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo, data: { role: 'parent' } },
    });

    if (!error && data?.properties?.action_link) return data.properties.action_link;

    // Existing user — fall back to magic link
    const { data: ml } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });

    return ml?.properties?.action_link ?? null;
  } catch (err) {
    console.error('[send-parent-invite] generateLink failed:', err);
    return null;
  }
}

function renderHtml(
  playerName: string,
  linkCode: string,
  expiresAt: string,
  senderName: string,
  magicLink: string | null,
): string {
  const expiry = new Date(expiresAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
  const ctaUrl = magicLink ?? APP_URL;
  const isMagic = !!magicLink;

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#16A34A;padding:24px 28px;">
            <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:3px;">SKILLKAART</div>
            <div style="font-size:12px;color:#bbf7d0;margin-top:3px;">Ouder-portaal uitnodiging</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 28px 8px;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111827;line-height:1.3;">
              Volg de voortgang van ${playerName} 👟
            </h2>
            <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.7;">
              ${senderName ? `<strong>${senderName}</strong> heeft` : 'De coach heeft'} toegang klaargezet zodat je de groei, huiswerk en trainingsvoortgang van <strong>${playerName}</strong> kunt volgen.${isMagic ? ' Klik hieronder om direct in te loggen — <strong>geen wachtwoord nodig</strong>.' : ''}
            </p>

            ${isMagic ? `
            <!-- Magic link CTA (primary) -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${ctaUrl}" style="display:inline-block;background:#16A34A;color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;">
                    Volg ${playerName} →
                  </a>
                </td>
              </tr>
              <tr><td align="center" style="padding-top:10px;font-size:11px;color:#9ca3af;">Link is geldig t/m ${expiry}</td></tr>
            </table>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td style="border-top:1px solid #f3f4f6;padding-top:20px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">Werkt de knop niet?</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                    Open <a href="${APP_URL}" style="color:#16A34A;text-decoration:none;font-weight:700;">${APP_URL}</a>, kies <strong>Ouder-portaal → Account aanmaken</strong> en vul de koppelcode in:
                  </p>
                  <div style="margin-top:12px;background:#f0fdf4;border:2px dashed #86efac;border-radius:10px;padding:12px 16px;text-align:center;">
                    <div style="font-size:11px;font-weight:700;color:#16A34A;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">Koppelcode</div>
                    <div style="font-size:28px;font-weight:900;color:#111827;letter-spacing:3px;font-family:Courier New,monospace;">${linkCode}</div>
                  </div>
                </td>
              </tr>
            </table>
            ` : `
            <!-- Fallback: code-based flow -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f0fdf4;border:2px dashed #86efac;border-radius:14px;padding:20px 24px;text-align:center;">
                  <div style="font-size:11px;font-weight:700;color:#16A34A;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Jouw koppelcode</div>
                  <div style="font-size:38px;font-weight:900;color:#111827;letter-spacing:3px;font-family:Courier New,monospace;">${linkCode}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:8px;">Geldig t/m ${expiry}</div>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">Zo ga je aan de slag</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ['1', `Ga naar <a href="${APP_URL}" style="color:#16A34A;text-decoration:none;">${APP_URL}</a>`],
                ['2', 'Kies <strong>Ouder-portaal</strong> → <em>Account aanmaken</em>'],
                ['3', 'Vul bovenstaande code in en maak je account aan'],
              ].map(([num, text]) => `
              <tr>
                <td style="padding:6px 0;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;height:28px;border-radius:50%;background:#16A34A;text-align:center;vertical-align:middle;">
                        <span style="font-size:12px;font-weight:900;color:#fff;">${num}</span>
                      </td>
                      <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.5;">${text}</td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${APP_URL}" style="display:inline-block;background:#16A34A;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
                    Open Skillkaart →
                  </a>
                </td>
              </tr>
            </table>
            `}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Je ontvangt deze mail omdat een coach of clubbeheerder een uitnodiging voor je heeft aangemaakt.<br>
              Vragen? Neem contact op met de coach.
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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY ontbreekt in Vercel omgevingsvariabelen.' });
  }

  const { to, playerName, linkCode, expiresAt, senderName } = req.body;

  if (!to?.includes('@') || !playerName || !linkCode || !expiresAt) {
    return res.status(400).json({ error: 'Ontbrekende verplichte velden.' });
  }

  // Generate Supabase magic link (fails silently → falls back to code email)
  const magicLink = await getMagicLink(to, linkCode);
  if (magicLink) {
    console.log('[send-parent-invite] Magic link gegenereerd voor', to);
  } else {
    console.warn('[send-parent-invite] Magic link generatie mislukt — stuur code-email als fallback');
  }

  try {
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [to],
      subject: `Volg de voortgang van ${playerName} op Skillkaart`,
      html: renderHtml(playerName, linkCode, expiresAt, senderName ?? '', magicLink),
    });

    if (error) {
      console.error('[send-parent-invite] Resend error:', JSON.stringify(error));
      return res.status(500).json({ error: `Resend: ${error.message}` });
    }

    console.log('[send-parent-invite] Verstuurd naar', to, '| id:', (data as { id?: string } | null)?.id, '| magic:', !!magicLink);
    res.json({ ok: true, magic: !!magicLink });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[send-parent-invite] Exception:', message);
    res.status(500).json({ error: message });
  }
}
