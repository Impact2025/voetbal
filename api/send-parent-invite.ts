import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.MAIL_FROM || 'Skillkaart <onboarding@resend.dev>';
const APP_URL = 'https://skills.weareimpact.nl';

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

function renderHtml(playerName: string, linkCode: string, expiresAt: string, senderName: string): string {
  const expiry = new Date(expiresAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
  const codeChars = linkCode.split('').join(' ');

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
              ${senderName ? `<strong>${senderName}</strong> heeft` : 'De coach heeft'} een account voor je klaargezet waarmee je de groei, huiswerk en trainingsvoortgang van <strong>${playerName}</strong> kunt volgen in de voetbalapp.
            </p>

            <!-- Code block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f0fdf4;border:2px dashed #86efac;border-radius:14px;padding:20px 24px;text-align:center;">
                  <div style="font-size:11px;font-weight:700;color:#16A34A;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Jouw koppelcode</div>
                  <div style="font-size:38px;font-weight:900;color:#111827;letter-spacing:10px;font-family:Courier New,monospace;">${codeChars}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:8px;">Geldig t/m ${expiry}</div>
                </td>
              </tr>
            </table>

            <!-- Steps -->
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">Zo ga je aan de slag</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ['1', 'Open de app', APP_URL],
                ['2', 'Kies <strong>Ouder-portaal</strong> → <em>Account aanmaken</em>', null],
                ['3', 'Vul bovenstaande code in en maak je account aan', null],
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

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${APP_URL}" style="display:inline-block;background:#16A34A;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
                    Open Skillkaart →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Je ontvangt deze mail omdat een coach of clubbeheerder een koppelcode voor je heeft aangemaakt.<br>
              Vragen? Stuur een bericht naar de coach.
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

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY ontbreekt in Vercel omgevingsvariabelen.' });
  }

  const { to, playerName, linkCode, expiresAt, senderName } = req.body;

  if (!to?.includes('@') || !playerName || !linkCode || !expiresAt) {
    return res.status(400).json({ error: 'Ontbrekende verplichte velden.' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `Volg de voortgang van ${playerName} op Skillkaart`,
      html: renderHtml(playerName, linkCode, expiresAt, senderName ?? ''),
    });

    if (error) {
      console.error('[send-parent-invite] Resend error:', JSON.stringify(error));
      return res.status(500).json({ error: `Resend: ${error.message}` });
    }

    console.log('[send-parent-invite] Verstuurd naar', to, '| id:', (data as { id?: string } | null)?.id);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[send-parent-invite] Exception:', message);
    res.status(500).json({ error: message });
  }
}
