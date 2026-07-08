// AI loopt via de serverless proxy /api/ai — de OpenRouter-key blijft server-side.
const AI_PROXY_URL = '/api/ai';

interface AICallOptions {
  max_tokens?: number;
  temperature?: number;
}

// OpenRouter-message: string-content (tekst) of multimodaal (tekst + afbeeldingen).
type AIContent =
  | string
  | Array<{ type: string; text?: string; image_url?: { url: string } }>;
interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: AIContent;
}

/**
 * Post één of meer messages naar de AI-proxy met retry/backoff.
 * Retourneert de tekst, of gooit na de laatste poging.
 */
async function postAI(
  messages: AIMessage[],
  opts: { max_tokens?: number; temperature?: number; retries?: number; delay?: number } = {},
): Promise<string> {
  const { max_tokens, temperature, retries = 3, delay = 1000 } = opts;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, max_tokens, temperature }),
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const body = await response.json() as { error?: string };
          if (body?.error) msg = body.error;
        } catch { /* geen JSON */ }
        throw new Error(msg);
      }

      const result = await response.json() as { text?: string };
      if (!result.text) throw new Error('Leeg AI-antwoord');
      return result.text;
    } catch (error) {
      console.error(`AI aanroep poging ${i + 1} mislukt:`, error);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
      } else {
        throw error instanceof Error ? error : new Error('Onbekende fout');
      }
    }
  }
  throw new Error('AI onbereikbaar');
}

export const callAI = async (prompt: string, retries = 3, delay = 1000, options?: AICallOptions): Promise<string> => {
  try {
    return await postAI([{ role: 'user', content: prompt }], {
      max_tokens: options?.max_tokens ?? 256,
      temperature: options?.temperature ?? 0.7,
      retries,
      delay,
    });
  } catch (error) {
    return `Kon geen suggestie genereren: ${error instanceof Error ? error.message : 'Onbekende fout'}. Probeer het later opnieuw.`;
  }
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

interface ChallengeAIOptions {
  challengeTitle: string;
  reflection: string;
  playerName: string;
  playerAge: string;
  hint?: string;
}

export const getChallengeAIFeedback = async ({
  challengeTitle, reflection, playerName, playerAge, hint,
}: ChallengeAIOptions): Promise<string> => {
  const prompt = `Je bent een enthousiaste jeugdvoetbalcoach die feedback geeft aan een kind na een zelfstandige uitdaging.

SPELER: ${playerName}, ${playerAge} jaar
UITDAGING: "${challengeTitle}"
REFLECTIE VAN DE SPELER: "${reflection}"
${hint ? `COACH TIP: ${hint}` : ''}

Geef persoonlijke feedback in dit formaat:

⭐ WAT IK ZIE
[1 zin over wat de reflectie zegt over de speler als voetballer]

🔥 WAAROM DIT TELT
[1 zin waarom deze actie bijdraagt aan echte groei]

💪 VOLGENDE STAP
[1 concrete tip voor de volgende keer]

Schrijf in eenvoudig, enthousiast Nederlands. Max 60 woorden totaal. NOOIT negatief of beschamend.`;

  return callAI(prompt, 2, 1000, { max_tokens: 200, temperature: 0.65 });
};

interface ChallengeVideoOptions {
  challenge: { title: string; setup: string; win_condition: string };
  player: { name: string; age: string; position: string };
  frames: string[];
}

export const analyzeChallengeVideo = async (
  { challenge, player, frames }: ChallengeVideoOptions
): Promise<string> => {
  const ageLabel = player.age ? `${player.age} jaar` : 'jeugdspeler';
  const positionLabel = player.position || 'speler';

  const textPrompt = `Je bent een enthousiaste jeugdvoetbalcoach die video-feedback geeft aan kinderen na een uitdaging.

SPELER: ${player.name}, ${ageLabel}, ${positionLabel}
UITDAGING: "${challenge.title}"
SETUP: ${challenge.setup}
WIN-CONDITIE: ${challenge.win_condition}

Ik stuur je ${frames.length} beelden uit de video van de speler. Analyseer de beweging/techniek en geef feedback in dit EXACTE formaat:

⭐ WAT GAAT GOED
[Noem 1-2 concrete dingen die je ziet dat goed gaat. Wees specifiek over de techniek.]

🎯 ÉÉN VERBETERPUNT
[Noem SLECHTS 1 ding om aan te werken. Concreet en uitvoerbaar.]

💡 TIP VOOR VOLGENDE KEER
[1 praktische tip hoe ze het volgende keer beter kunnen doen.]

🔥 MOTIVATIE
[1 korte aanmoedigingszin, persoonlijk en enthousiast. Koppel aan de uitdaging.]

Schrijf in eenvoudig Nederlands voor een ${ageLabel}. Max 120 woorden totaal.`;

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: textPrompt },
    ...frames.map(b64 => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    })),
  ];

  try {
    return await postAI([{ role: 'user', content }], {
      max_tokens: 600, temperature: 0.6, retries: 3, delay: 1500,
    });
  } catch (error) {
    return `Feedback genereren mislukt: ${error instanceof Error ? error.message : 'onbekende fout'}. Probeer het later opnieuw.`;
  }
};

export const analyzeMovementVideo = async (
  { homework, player, frames }: MovementAnalysisOptions
): Promise<string> => {
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

  try {
    return await postAI([{ role: 'user', content }], {
      max_tokens: 600, temperature: 0.6, retries: 3, delay: 1500,
    });
  } catch (error) {
    return `Feedback genereren mislukt: ${error instanceof Error ? error.message : 'onbekende fout'}. Probeer het later opnieuw.`;
  }
};
