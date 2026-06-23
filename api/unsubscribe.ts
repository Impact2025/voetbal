import { getAdminClient } from './_lib/supabaseAdmin.js';
import { verifyUnsubToken } from './_lib/mailToken.js';

interface Req {
  method: string;
  query: Record<string, string | string[] | undefined>;
}
interface Res {
  status: (code: number) => Res;
  send: (html: string) => void;
  setHeader: (n: string, v: string) => void;
  end: () => void;
}

const page = (title: string, msg: string) => `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#0D0D0D;color:#fff;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="text-align:center;padding:32px;max-width:420px;">
    <div style="font-size:22px;font-weight:900;color:#00FF9D;letter-spacing:3px;margin-bottom:16px;">SKILLKAART</div>
    <h1 style="font-size:20px;margin:0 0 8px;">${title}</h1>
    <p style="color:#9ca3af;font-size:14px;line-height:1.6;">${msg}</p>
  </div>
</body></html>`;

export default async function handler(req: Req, res: Res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).send(page('Fout', 'Ongeldige aanvraag.'));

  const email = (Array.isArray(req.query.e) ? req.query.e[0] : req.query.e) || '';
  const token = (Array.isArray(req.query.t) ? req.query.t[0] : req.query.t) || '';

  if (!email || !token || !verifyUnsubToken(email, token)) {
    return res.status(400).send(page('Ongeldige link', 'Deze afmeldlink is niet geldig of verlopen.'));
  }

  try {
    await getAdminClient().from('email_unsubscribes').upsert({ email: email.toLowerCase() }, { onConflict: 'email' });
  } catch {
    return res.status(500).send(page('Er ging iets mis', 'Probeer het later opnieuw.'));
  }

  return res.status(200).send(page('Afgemeld', `${email} ontvangt geen e-mails meer van Skillkaart.`));
}
