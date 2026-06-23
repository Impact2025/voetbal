import crypto from 'crypto';

// Geheim voor unsubscribe-tokens. Valt terug op CRON_SECRET zodat er niet
// per se een extra env var nodig is.
function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || 'skillkaart-fallback-secret';
}

// HMAC-token zodat een afmeldlink niet te vervalsen is.
export function unsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', secret()).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

// Bouwt een volledige unsubscribe-URL voor in de mailfooter.
export function unsubscribeUrl(baseUrl: string, email: string): string {
  const e = encodeURIComponent(email);
  const t = unsubscribeToken(email);
  return `${baseUrl}/api/unsubscribe?e=${e}&t=${t}`;
}
