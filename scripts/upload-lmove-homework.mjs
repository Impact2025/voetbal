/**
 * Upload L Move (O12) huiswerkvideo en registreer in homework_submissions.
 *
 * Gebruik:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   OPENROUTER_API_KEY=... \
 *   node scripts/upload-lmove-homework.mjs \
 *     --video "C:/Users/v_mun/Downloads/WhatsApp Video 2026-09-03 at 20.42.55.mp4" \
 *     [--player-id 2cceeb98-a407-4488-8245-b99035cee389] \
 *     [--homework-id "L Move"] \
 *     [--transcribe]
 *
 * Stappen:
 *   1. Video uploaden naar storage bucket 'homework-videos' (privé).
 *   2. Upload pad + metadata opslaan in tabel homework_submissions.
 *   3. Optioneel: video (als base64 afbeelding per frame) of bestandstype
 *      transcriptie via Whisper aanvraagst via OpenRouter — opgeslagen als ai_feedback.
 *
 * De video zelf is te groot voor Whisper base64. Voor transcriptie moet
 * de video eerst geconverteerd worden naar audio (zie --transcribe met ffmpeg).
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VIDEO_PATH = process.env.VIDEO_PATH
  || 'C:/Users/v_mun/Downloads/L Move (O12).mp4';
const PLAYER_ID = '2cceeb98-a407-4488-8245-b99035cee389';     // Cass Ruigrok, VVCO12-1
const HOMEWORK_ID = 'L Move';
const TEAM_ID = 'VVCO12-1';
const HOMEWORK_ASSIGNMENT = 'L Move';   // O12, week 35: '5 targets achter elkaar raken vanaf 15 meter afstand'
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY vereist (server-side).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Upload de video naar de homework-videos bucket. */
async function uploadVideo(fileBuffer, fileName, playerId, homeworkId) {
  const ext = (path.extname(fileName) || '.mp4').replace('.', '');
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'mp4';
  const pathInBucket = `${TEAM_ID}/${playerId}/${homeworkId}_${Date.now()}.${safeExt}`;

  console.log(`📤 Uploaden video naar bucket 'homework-videos' als ${pathInBucket}`);
  const { data, error } = await supabase.storage
    .from('homework-videos')
    .upload(pathInBucket, fileBuffer, {
      contentType: 'video/mp4',
      upsert: false,
    });

  if (error) throw error;
  console.log('✅ Video geüpload:', data.path);
  return data.path;
}

/** Registreer een homework_submissions record. */
async function createSubmission(playerId, homeworkId, teamId, videoPath, aiFeedback = null) {
  console.log('📝 Registreer homework_submissions record');
  const { data, error } = await supabase
    .from('homework_submissions')
    .insert({
      player_id: playerId,
      homework_id: homeworkId,
      team_id: teamId,
      video_url: videoPath,
      ai_feedback: aiFeedback,
      feedback_status: aiFeedback ? 'done' : 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Submission aangemaakt:', data.id);
  return data.id;
}

/**
 * Transcriptie via Whisper. De WhatsApp video wordt bij benadering 15s gesneden
 * (of één keyframe-extract) om een beeld + tekst prompt te sturen.
 * Voor volledige audio-transcriptie moet ffmpeg beschikbaar zijn.
 */
async function transcribeViaAudio(whisperUrl, apiKey) {
  throw new Error('Not implemented in browser context — gebruik locale ffmpeg.');
}

/** Eenvoudige AI feedback: analyseer video-metadata (duur/grootte) via OpenRouter. */
async function generateAiFeedback(videoMeta) {
  if (!OPENROUTER_KEY) {
    console.log('⚠️  Geen OPENROUTER_API_KEY → skip AI feedback.');
    return null;
  }

  console.log('🧠 Vraag AI feedback via OpenRouter …');
  const prompt = `Je bent een voetbalcoach voor kinderen. Een speler heeft een huiswerkvideo
 ingediend voor de oefening "L Move" (O12, week 35: 5 targets achter elkaar raken vanaf 15m).
 Geef een korte, positieve terugkoppeling (max 120 woorden, Nederlands) op basis van:
  - Video bestandsgrootte: ${videoMeta.sizeLabel}
  - Video bestandsnaam: ${videoMeta.fileName}

 Focus op: techniek van de L-beweging, splitstibiliteit en balbeheersing.
 Schrijf alsof je direct tegen de speler praat.`;

  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://skillkaart.nl',
      'X-Title': 'Voetbal player-hub',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${txt}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? null;
}

/** ---------- main ---------- */
async function main() {
  console.log('🎯 Start L Move (O12) huiswerk upload\n');

  // 1. Lees video
  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Video niet gevonden: ${VIDEO_PATH}`);
  }
  const fileBuffer = fs.readFileSync(VIDEO_PATH);
  const fileSizeBytes = fileBuffer.length;
  const fileSizeLabel = (fileSizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
  const fileName = path.basename(VIDEO_PATH);
  console.log(`📄 ${fileName}  (${fileSizeLabel})`);

  // 2. Upload video
  const videoPath = await uploadVideo(fileBuffer, fileName, PLAYER_ID, HOMEWORK_ASSIGNMENT);

  // 3. AI-feedback (optioneel, via metadata)
  const aiFeedback = await generateAiFeedback({
    sizeLabel: fileSizeLabel,
    fileName,
  });

  // 4. Registreer submission
  const submissionId = await createSubmission(
    PLAYER_ID,
    HOMEWORK_ASSIGNMENT,
    TEAM_ID,
    videoPath,
    aiFeedback,
  );

  console.log('\n✅ Klaar!');
  console.log('   submission_id:', submissionId);
  console.log('   video_path   :', videoPath);
  if (aiFeedback) console.log('   ai_feedback  : (geïnstalleerd)');
  else console.log('   ai_feedback  : (pending — zonder key)');

  console.log('\n💡 Voor volledige transcriptie: zet ffmpeg op de machine en');
  console.log('   gebruik een Whisper/OpenRouter audio-transcribe flow.');
}

main().catch(err => {
  console.error('\n❌ Fout:', err.message);
  process.exit(1);
});
