const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';

interface AICallOptions {
  max_tokens?: number;
  temperature?: number;
}

export const callAI = async (prompt: string, retries = 3, delay = 1000, options?: AICallOptions): Promise<string> => {
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
          max_tokens: options?.max_tokens ?? 256,
          temperature: options?.temperature ?? 0.7,
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

// Extracts evenly distributed frames from a video file as base64 JPEG strings
export async function extractVideoFrames(videoFile: File, frameCount = 6): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas niet beschikbaar')); return; }

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(objectUrl);
    const frames: string[] = [];
    let captured = 0;

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Frame extractie time-out — probeer een kortere video'));
    }, 45000);

    const captureNext = () => {
      if (captured >= frameCount) {
        clearTimeout(timeoutId);
        cleanup();
        resolve(frames);
        return;
      }
      // Spread frames across 10%–90% of duration to avoid blank start/end
      const duration = Math.min(video.duration, 60);
      const pct = frameCount === 1 ? 0.5 : 0.1 + (captured / (frameCount - 1)) * 0.8;
      video.currentTime = pct * duration;
    };

    video.onloadedmetadata = () => {
      const MAX_DIM = 640;
      const scale = Math.min(MAX_DIM / video.videoWidth, MAX_DIM / video.videoHeight, 1);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      captureNext();
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      frames.push(dataUrl.split(',')[1]); // base64 only, strip data: prefix
      captured++;
      captureNext();
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error('Video laden mislukt'));
    };
  });
}

interface MovementAnalysisOptions {
  homework: { title: string; description: string };
  player: { name: string; age: string; position: string };
  frames: string[];
}

export const analyzeMovementVideo = async (
  { homework, player, frames }: MovementAnalysisOptions
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string;

  if (!apiKey || apiKey.startsWith('sk-or-vervang')) {
    return 'AI-functie niet beschikbaar: configureer VITE_OPENROUTER_API_KEY in .env.local';
  }

  const ageLabel = player.age ? `${player.age} jaar` : 'jeugdspeler';
  const positionLabel = player.position || 'speler';

  const textPrompt = `Je bent een enthousiaste jeugdvoetbalcoach die video-feedback geeft aan kinderen.

SPELER: ${player.name}, ${ageLabel}, ${positionLabel}
HUISWERKOPDRACHT: "${homework.title}"
OMSCHRIJVING: ${homework.description}

Ik stuur je ${frames.length} beelden uit de video van de speler. Analyseer de beweging en geef feedback in dit EXACTE formaat:

⭐ WAT GAAT GOED
[Noem 1-2 concrete dingen die je ziet dat goed gaat. Wees specifiek.]

🎯 ÉÉN VERBETERPUNT
[Noem SLECHTS 1 ding om aan te werken. Concreet en uitvoerbaar.]

💡 TIP VOOR VOLGENDE KEER
[1 praktische tip hoe ze het volgende keer beter kunnen doen.]

🔥 MOTIVATIE
[1 korte aanmoedigingszin, persoonlijk en enthousiast.]

Schrijf in eenvoudig Nederlands voor een ${ageLabel}. Max 120 woorden totaal.`;

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: textPrompt },
    ...frames.map(b64 => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    })),
  ];

  for (let attempt = 0; attempt < 3; attempt++) {
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
          messages: [{ role: 'user', content }],
          max_tokens: 600,
          temperature: 0.6,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = result.choices?.[0]?.message?.content;
      if (!text) throw new Error('Leeg API-antwoord');
      return text;
    } catch (error) {
      console.error(`Video analyse poging ${attempt + 1} mislukt:`, error);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
      else return `Feedback genereren mislukt: ${error instanceof Error ? error.message : 'onbekende fout'}. Probeer het later opnieuw.`;
    }
  }

  return 'Feedback genereren mislukt. Probeer het later opnieuw.';
};
