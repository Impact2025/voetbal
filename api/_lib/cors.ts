// Gedeelde CORS-afhandeling met een origin-allowlist. Vervangt de eerdere
// wildcard (Access-Control-Allow-Origin: *) waarmee elke willekeurige site
// onze endpoints vanuit de browser kon aanroepen.
//
// Same-origin requests (de SPA zelf) sturen geen Origin-header mee of hebben
// dezelfde origin — die hebben geen CORS-headers nodig en blijven werken.

const STATIC_ALLOWED = [
  'https://skillkaart.nl',
  'https://www.skillkaart.nl',
  'http://localhost:5173', // vite dev
  'http://localhost:4173', // vite preview
  'http://localhost:3000', // vercel dev
];

interface CorsReq {
  method: string;
  headers: Record<string, string | undefined>;
}
interface CorsRes {
  status: (code: number) => { end: () => void; json?: (data: unknown) => void };
  setHeader: (name: string, value: string) => void;
  end?: () => void;
}

/**
 * Zet CORS-headers (alleen voor origins op de allowlist) en handelt de
 * OPTIONS-preflight af. Retourneert true als de request al beantwoord is
 * (preflight) — de handler moet dan direct stoppen.
 */
export function applyCors(req: CorsReq, res: CorsRes): boolean {
  const origin = req.headers['origin'];
  const allowed = new Set(STATIC_ALLOWED);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '');
  if (base) allowed.add(base);

  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Player-Id');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
