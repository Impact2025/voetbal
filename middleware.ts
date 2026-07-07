/**
 * Vercel Edge Middleware — rate limiting + security headers
 *
 * Voor Vite SPA + Vercel Serverless projecten.
 * Geen Next.js dependency nodig — werkt met native Request/Response.
 *
 * Plaatsing: root van het Vercel-project (naast vercel.json, niet in src/)
 */

// ─── Config ────────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const STRICT: Record<string, number> = {
  '/api/send-email': 10,
  '/api/send-parent-invite': 15,
  '/api/admin/send-campaign': 5,
  '/api/send-login-link': 10,
  '/api/ai': 20,
};

// ─── State (in-memory per edge node) ───────────────────────────────────────

const buckets = new Map<string, number[]>();

function check(ip: string, path: string, now: number): {
  allowed: boolean; remaining: number; resetIn: number;
} {
  let ts = buckets.get(ip);
  if (!ts) { ts = []; buckets.set(ip, ts); }

  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  ts = ts.filter(t => t >= cutoff);
  buckets.set(ip, ts);

  const limit = STRICT[path] ?? RATE_LIMIT_MAX;
  if (ts.length < limit) {
    ts.push(now);
    return { allowed: true, remaining: limit - ts.length - 1, resetIn: 60 };
  }

  const resetIn = Math.max(1, Math.ceil((ts[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
  return { allowed: false, remaining: 0, resetIn };
}

function getIp(request: Request): string {
  const headers = request.headers;
  if (headers && typeof headers.get === 'function') {
    return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headers.get('x-real-ip')
      || '127.0.0.1';
  }
  return '127.0.0.1';
}

// ─── Middleware ─────────────────────────────────────────────────────────────

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url);
  const path = url.pathname;

  // Alleen /api/*, behalve cron en optioneel
  if (!path.startsWith('/api/') || path.startsWith('/api/cron/')) {
    return undefined;
  }

  const ip = getIp(request);
  const result = check(ip, path, Date.now());

  if (!result.allowed) {
    return new Response(JSON.stringify({
      error: 'Te veel aanvragen. Probeer het over een moment opnieuw.',
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.resetIn),
        'X-RateLimit-Limit': String(STRICT[path] ?? RATE_LIMIT_MAX),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // Doorgestuurd (passthrough) — rate limit is al gecontroleerd hierboven.
  return undefined;
}

export const config = {
  matcher: '/api/:path*',
};
