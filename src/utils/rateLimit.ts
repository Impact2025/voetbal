const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minuten

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
}

function getKey(teamId: string) {
  return `rl_${teamId}`;
}

export function checkRateLimit(teamId: string): void {
  const raw = localStorage.getItem(getKey(teamId));
  if (!raw) return;

  const entry: RateLimitEntry = JSON.parse(raw);
  const elapsed = Date.now() - entry.firstAttemptAt;

  if (elapsed > WINDOW_MS) {
    localStorage.removeItem(getKey(teamId));
    return;
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    const remaining = Math.ceil((WINDOW_MS - elapsed) / 60000);
    throw new Error(`Te veel pogingen. Probeer het over ${remaining} minuut${remaining !== 1 ? 'en' : ''} opnieuw.`);
  }
}

export function recordFailedAttempt(teamId: string): void {
  const raw = localStorage.getItem(getKey(teamId));
  const now = Date.now();

  if (!raw) {
    localStorage.setItem(getKey(teamId), JSON.stringify({ attempts: 1, firstAttemptAt: now }));
    return;
  }

  const entry: RateLimitEntry = JSON.parse(raw);
  if (Date.now() - entry.firstAttemptAt > WINDOW_MS) {
    localStorage.setItem(getKey(teamId), JSON.stringify({ attempts: 1, firstAttemptAt: now }));
    return;
  }

  localStorage.setItem(getKey(teamId), JSON.stringify({ ...entry, attempts: entry.attempts + 1 }));
}

export function clearAttempts(teamId: string): void {
  localStorage.removeItem(getKey(teamId));
}
