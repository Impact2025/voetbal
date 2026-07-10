import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { MAIL_FROM } from './_lib/mailFrom.js';

const APP_URL = 'https://skillkaart.nl';

interface Req {
  method: string;
  body: {
    to: string;
    coachName?: string;
    teamName: string;
    clubName: string;
    inviteToken: string;
    role: 'head' | 'assistant';
    senderName?: string;
  };
}

interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

/**
 * Genereert een Supabase "invite" magic-link. Die bevestigt het e-mailadres
 * meteen én logt in via één klik — de coach hoeft géén wachtwoord te kiezen
 * en kan nooit meer vastlopen op "Email not confirmed". De link bevat het
 * coachInvite-token in de querystring, zodat AuthComponent de uitnodiging
 * kan afronden zodra de sessie via de hash is hersteld.
 */
async function getInviteMagicLink(email: string, inviteToken: string): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const redirectTo = `${APP_URL}/?coachInvite=${inviteToken}`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo, data: { role: 'coach' } },
    });
    return error || !data?.properties?.action_link ? null : data.properties.action_link;
  } catch (err) {
    console.error('[send-coach-invite] generateLink failed:', err);
    return null;
  }
}

function renderHtml(
  coachName: string,
  teamName: string,
  clubName: string,
  roleLabel: string,
  senderName: string,
  magicLink: string | null,
): string {
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
            <div style="font-size:12px;color:#bbf7d0;margin-top:3px;">Uitnodiging als coach</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 28px 8px;">
            <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111827;line-height:1.3;">
              ${coachName ? `Hoi ${coachName},` : 'Je bent uitgenodigd'}
            </h2>
            <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.7;">
              ${senderName ? `<strong>${senderName}</strong> nodigt je uit` : 'Je wordt uitgenodigd'} om als <strong>${roleLabel}</strong> aan de slag te gaan bij <strong>${teamName}</strong> (${clubName}).${isMagic ? ' Klik hieronder om direct in te loggen — <strong>geen wachtwoord nodig</strong>.' : ''}
            </p>

            ${isMagic ? `
            <!-- Magic link CTA (primary) -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${ctaUrl}" style="display:inline-block;background:#16A34A;color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;">
                    Accepteer uitnodiging →
                  </a>
                </td>
              </tr>
              <tr><td align="center" style="padding-top:10px;font-size:11px;color:#9ca3af;">Deze link is éénmalig en 24 uur geldig</td></tr>
            </table>

            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">Werkt de knop niet?</p>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
              Open <a href="${APP_URL}" style="color:#16A34A;text-decoration:none;font-weight:700;">${APP_URL}</a> en log in met je e-mailadres. Je account is al aangemaakt.
            </p>
            ` : `
            <!-- Fallback: handmatige link (magic-link generatie mislukt) -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${ctaUrl}" style="display:inline-block;background:#16A34A;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
                    Open Skillkaart →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">Zo ga je aan de slag</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ['1', `Ga naar <a href="${APP_URL}" style="color:#16A34A;text-decoration:none;">${APP_URL}</a>`],
                ['2', 'Kies <strong>Coach</strong> en maak je account aan met dit e-mailadres'],
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
            `}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Je ontvangt deze mail omdat een clubbeheerder je heeft uitgenodigd als coach.<br>
              Vragen? Neem contact op met je clubbeheerder.
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

  const { to, coachName, teamName, clubName, inviteToken, role, senderName } = req.body;

  if (!to?.includes('@') || !teamName || !clubName || !inviteToken || (role !== 'head' && role !== 'assistant')) {
    return res.status(400).json({ error: 'Ontbrekende verplichte velden.' });
  }

  // Supabase invite-magic-link (bevestigt e-mail + logt in). Fails silently → fallback naar handmatieke link.
  const magicLink = await getInviteMagicLink(to, inviteToken);
  if (magicLink) {
    console.log('[send-coach-invite] Magic link gegenereerd voor', to);
  } else {
    console.warn('[send-coach-invite] Magic link generatie mislukt — stuur fallback-mail');
  }

  const roleLabel = role === 'assistant' ? 'assistent-trainer' : 'hoofdcoach';

  try {
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [to],
      subject: `Uitnodiging als ${roleLabel} van ${teamName}`,
      html: renderHtml(coachName ?? '', teamName, clubName, roleLabel, senderName ?? '', magicLink),
    });

    if (error) {
      console.error('[send-coach-invite] Resend error:', JSON.stringify(error));
      return res.status(500).json({ error: `Resend: ${error.message}` });
    }

    console.log('[send-coach-invite] Verstuurd naar', to, '| id:', (data as { id?: string } | null)?.id, '| magic:', !!magicLink);
    res.json({ ok: true, magic: !!magicLink });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[send-coach-invite] Exception:', message);
    res.status(500).json({ error: message });
  }
}
