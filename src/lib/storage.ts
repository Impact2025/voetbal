import { supabase } from './supabase';

export async function uploadAvatar(file: File, teamId: string, playerName: string): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error('Afbeelding mag maximaal 2 MB zijn.');
  const ext = file.name.split('.').pop() ?? 'jpg';
  const safeName = playerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const path = `${teamId}/${safeName}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadHomeworkVideo(
  file: File,
  teamId: string,
  playerId: string,
  homeworkId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
  if (file.size > MAX_SIZE) throw new Error('Video mag maximaal 100 MB zijn. Probeer een korte opname.');

  const ext = file.name.split('.').pop() ?? 'mp4';
  const path = `${teamId}/${playerId}/${homeworkId}_${Date.now()}.${ext}`;

  // Simulate progress for small files; real upload progress requires XHR
  onProgress?.(10);

  const { error } = await supabase.storage
    .from('homework-videos')
    .upload(path, file, { upsert: false, contentType: file.type || 'video/mp4' });

  if (error) throw error;

  onProgress?.(100);

  const { data } = supabase.storage.from('homework-videos').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadChallengeVideo(
  file: File,
  teamId: string,
  playerId: string,
  challengeId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) throw new Error('Video mag maximaal 100 MB zijn. Probeer een korte opname.');

  const ext = file.name.split('.').pop() ?? 'mp4';
  const path = `challenges/${teamId}/${playerId}/${challengeId}_${Date.now()}.${ext}`;

  onProgress?.(10);

  const { error } = await supabase.storage
    .from('homework-videos')
    .upload(path, file, { upsert: false, contentType: file.type || 'video/mp4' });

  if (error) throw error;

  onProgress?.(100);

  const { data } = supabase.storage.from('homework-videos').getPublicUrl(path);
  return data.publicUrl;
}
