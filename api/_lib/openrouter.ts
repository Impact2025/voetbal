// Gedeelde OpenRouter-call, gebruikt door api/ai.ts (client-proxy) en
// api/support.ts (server-side AI-agent). Geen HTTP-omweg via elkaar —
// beide roepen deze functie direct aan.

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callOpenRouter(
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number; temperature?: number },
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('AI-functie niet beschikbaar (server niet geconfigureerd).');

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.PUBLIC_BASE_URL || 'https://skillkaart.nl',
      'X-Title': 'Skillkaart',
    },
    body: JSON.stringify({
      model: opts?.model || DEFAULT_AI_MODEL,
      messages,
      max_tokens: opts?.maxTokens ?? 400,
      temperature: opts?.temperature ?? 0.4,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }

  const result = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = result.choices?.[0]?.message?.content;
  if (!text) throw new Error('Leeg AI-antwoord');
  return text;
}
