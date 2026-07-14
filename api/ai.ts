/**
 * Serverless AI-proxy — houdt de OpenRouter-key server-side.
 *
 * De client stuurde voorheen rechtstreeks naar OpenRouter met
 * VITE_OPENROUTER_API_KEY, die in de JS-bundle zat en dus voor iedereen
 * uitleesbaar (en misbruikbaar) was. Deze proxy accepteert een OpenRouter
 * `messages`-array (tekst én multimodaal image_url) en injecteert de key
 * uit de server-env.
 *
 * Toegang vereist een identiteit: een Supabase Bearer-token (coach, club,
 * ouder, superadmin) of een geldig speler-uuid in X-Player-Id (spelers
 * loggen in met PIN en hebben geen Supabase-sessie). Per identiteit geldt
 * een durable rate limit; middleware.ts doet daarbovenop een per-IP limiet.
 */
import { z } from 'zod';
import { withError } from './_lib/withError.js';
import { applyCors } from './_lib/cors.js';
import { getCallerProfile, verifyPlayerId } from './_lib/authn.js';
import { overRateLimit } from './_lib/rateLimit.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash';

// Eén tekstblok of een multimodaal blok (tekst + afbeeldingen).
const ContentPart = z.union([
  z.object({ type: z.literal('text'), text: z.string().max(20000) }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({ url: z.string().max(15_000_000) }),
  }),
]);

const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.union([z.string().max(20000), z.array(ContentPart).max(12)]),
});

const AiSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(12),
  max_tokens: z.number().int().min(1).max(2000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  model: z.string().max(120).optional(),
});

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: Req, res: Res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI-functie niet beschikbaar (server niet geconfigureerd).' });
  }

  // Identiteit vereist: Supabase-gebruiker óf geldig speler-uuid.
  let identity: string | null = null;
  const caller = await getCallerProfile(req.headers['authorization']);
  if (caller) {
    identity = `user:${caller.id}`;
  } else if (await verifyPlayerId(req.headers['x-player-id'])) {
    identity = `player:${req.headers['x-player-id']!.trim()}`;
  }
  if (!identity) {
    return res.status(401).json({ error: 'Geen toegang. Log opnieuw in en probeer het nog eens.' });
  }

  if (await overRateLimit(`ai:${identity}`, 40, 600)) {
    return res.status(429).json({ error: 'Te veel AI-aanvragen. Probeer het over een paar minuten opnieuw.' });
  }

  const parsed = AiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Ongeldige AI-aanvraag.' });
  }
  const { messages, max_tokens, temperature, model } = parsed.data;

  await withError(res, async () => {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.PUBLIC_BASE_URL || 'https://skillkaart.nl',
        'X-Title': 'Skillkaart',
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        max_tokens: max_tokens ?? 256,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`OpenRouter HTTP ${response.status}: ${detail.slice(0, 200)}`);
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = result.choices?.[0]?.message?.content;
    if (!text) throw new Error('Leeg AI-antwoord');

    res.status(200).json({ text });
  });
}
