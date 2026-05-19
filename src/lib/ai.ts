const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-preview-05-20';

export const callAI = async (prompt: string, retries = 3, delay = 1000): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string;

  if (!apiKey || apiKey.startsWith('sk-or-vervang')) {
    return 'AI-functie niet beschikbaar: configureer VITE_OPENROUTER_API_KEY in .env.local';
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Skillkaart',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 256,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = result.choices?.[0]?.message?.content;
      if (!text) throw new Error('Onverwacht API-antwoord formaat');
      return text;
    } catch (error) {
      console.error(`AI aanroep poging ${i + 1} mislukt:`, error);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
      } else {
        return `Kon geen suggestie genereren: ${error instanceof Error ? error.message : 'Onbekende fout'}. Probeer het later opnieuw.`;
      }
    }
  }

  return 'Kon geen suggestie genereren. Probeer het later opnieuw.';
};
