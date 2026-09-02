import { supabase } from './supabase';
import { authHeaders } from './apiAuth';

// Huiswerk-/challenge-video's van kinderen gaan naar een privé bucket. De
// speler vraagt via /api/media een kortlevende signed upload-URL aan (server
// verifieert dat de speler zichzelf is en bepaalt het pad zelf, geen
// client-gestuurd pad meer) en uploadt daarna rechtstreeks naar Supabase
// Storage. Voor het bekijken wordt telkens een nieuwe signed URL opgehaald
// via getSignedVideoUrl — zie src/components/ui/SignedVideo.tsx.
// Zie supabase/fix_media_storage.sql voor de bucket-lockdown.

async function requestUploadUrl(
  playerId: string,
  kind: 'homework' | 'challenge',
  refId: string,
  ext: string,
): Promise<{ path: string; token: string }> {
  const auth = await authHeaders();
  const res = await fetch('/api/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ action: 'uploadUrl', playerId, kind, refId, ext }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as { error?: string }));
    throw new Error((data as { error?: string }).error || 'Upload-link genereren mislukt.');
  }
  return await res.json() as { path: string; token: string };
}

/** Vraag een kortlevende signed URL op voor een opgeslagen video-pad (of legacy publieke URL). */
export async function getSignedVideoUrl(pathOrUrl: string): Promise<string | null> {
  if (!pathOrUrl) return null;
  const auth = await authHeaders();
  try {
    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ action: 'viewUrl', path: pathOrUrl }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

async function uploadVideo(
  file: File,
  playerId: string,
  kind: 'homework' | 'challenge',
  refId: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
  if (file.size > MAX_SIZE) throw new Error('Video mag maximaal 100 MB zijn. Probeer een korte opname.');

  const ext = file.name.split('.').pop() ?? 'mp4';
  onProgress?.(5);

  const { path, token } = await requestUploadUrl(playerId, kind, refId, ext);
  onProgress?.(15);

  const { error } = await supabase.storage
    .from('homework-videos')
    .uploadToSignedUrl(path, token, file, { contentType: file.type || 'video/mp4' });
  if (error) throw error;

  onProgress?.(100);
  // Sla het pad op (niet een publieke URL — de bucket is privé). Consumenten
  // gebruiken <SignedVideo /> om er vlak voor weergave een geldige URL bij te halen.
  return path;
}

export async function uploadHomeworkVideo(
  file: File,
  _teamId: string,
  playerId: string,
  homeworkId: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return uploadVideo(file, playerId, 'homework', homeworkId, onProgress);
}

export async function uploadChallengeVideo(
  file: File,
  _teamId: string,
  playerId: string,
  challengeId: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return uploadVideo(file, playerId, 'challenge', challengeId, onProgress);
}
