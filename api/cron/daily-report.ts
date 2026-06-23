import { verifyCron } from '../_lib/adminGuard.js';
import { buildAndSendReport } from '../_lib/adminReport.js';

interface Req { method: string; headers: Record<string, string | undefined> }
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
}

// Vercel Cron roept dit dagelijks aan (zie vercel.json) en stuurt
// automatisch `Authorization: Bearer <CRON_SECRET>` mee.
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();
  if (!verifyCron(req.headers['authorization'])) return res.status(401).json({ error: 'Ongeldige cron-token.' });

  const result = await buildAndSendReport('daily');
  return res.status(result.ok ? 200 : 500).json(result);
}
