/**
 * Error wrapper voor Vercel Serverless Functions.
 * Vangt alle errors, stuurt naar Sentry (indien geconfigureerd),
 * en retourneert een consistente JSON-error response.
 *
 * Gebruik:
 *   export default async function handler(req, res) {
 *     await withError(res, async () => {
 *       // jouw code — throw mag, return is optioneel
 *     });
 *   }
 */

/** Capture een exception naar Sentry (fire-and-forget) */
function capture(err: Error): void {
  if (!process.env.SENTRY_DSN) { console.error('[withError]', err); return; }
  import('@sentry/vercel-edge').then(
    (sentry) => { try { sentry.captureException(err, { level: 'error' }); } catch { /* ignore */ } },
    () => console.error('[withError]', err),
  );
}

interface Res {
  status: (code: number) => { json: (data: unknown) => void };
}

export async function withError<T>(
  res: Res,
  fn: () => Promise<T>,
  opts?: { status?: (e: Error) => number },
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const statusCode = opts?.status?.(error) ?? 500;

    capture(error);

    const message = process.env.VERCEL_ENV === 'production'
      ? 'Er is een fout opgetreden.'
      : error.message || 'Onbekende fout';

    res.status(statusCode).json({ error: message });
  }
}
