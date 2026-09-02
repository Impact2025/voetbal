/**
 * Serverless proxy voor de private 'homework-videos' bucket.
 *
 * Waarom: video's van huiswerk- en challenge-opdrachten (kinderen 7-12 jaar)
 * stonden via getPublicUrl() op een publieke, onbeveiligde URL — wie het pad
 * kende (voorspelbaar: teamId/playerId/...) kon de video bekijken zonder
 * in te loggen. De bucket is nu privé (zie supabase/fix_media_storage.sql);
 * dit endpoint geeft alleen een kortlevende signed URL uit nadat is
 * geverifieerd dat de aanvrager daadwerkelijk bij het team van de speler
 * hoort (coach, club_admin, gekoppelde ouder, of de speler zelf).
 */
import { withError } from './_lib/withError.js';
import { applyCors } from './_lib/cors.js';
import { overRateLimit } from './_lib/rateLimit.js';
import { getAdminClient } from './_lib/supabaseAdmin.js';
import { resolveIdentity, accessibleTeamIds } from './_lib/teamAccess.js';
import { z } from 'zod';
import { validateOrError } from './_lib/validate.js';

const BUCKET = 'homework-videos';

const MediaActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('uploadUrl'),
    playerId: z.string().uuid(),
    kind: z.enum(['homework', 'challenge']),
    refId: z.string().min(1).max(200),
    ext: z.string().min(1).max(10),
  }),
  z.object({ action: z.literal('viewUrl'), path: z.string().min(1).max(2000) }),
]);

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

/** Legacy rijen bevatten een volledige (voorheen publieke) URL; nieuwe rijen slaan alleen het pad op. */
function extractPath(stored: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = stored.indexOf(marker);
  if (idx === -1) {
    // Geen URL — waarschijnlijk al een kaal pad.
    return stored.startsWith('http') ? null : stored;
  }
  const withQuery = stored.slice(idx + marker.length);
  return withQuery.split('?')[0];
}

/** teamId staat als eerste (homework) of tweede (challenges/...) segment van het pad. */
function teamIdFromPath(path: string): string | null {
  const parts = path.split('/');
  if (parts[0] === 'challenges') return parts[1] ?? null;
  return parts[0] ?? null;
}

export default async function handler(req: Req, res: Res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await withError(res, async () => {
    const identity = await resolveIdentity(req.headers);
    if (!identity) return res.status(401).json({ error: 'Geen toegang. Log opnieuw in en probeer het nog eens.' });

    if (await overRateLimit(`media:${identity.kind}:${identity.id}`, 60, 60)) {
      return res.status(429).json({ error: 'Te veel aanvragen. Wacht even.' });
    }

    if (!validateOrError(MediaActionSchema, req.body, res)) return;
    const body = req.body as { action: string } & Record<string, unknown>;
    const admin = getAdminClient();

    if (body.action === 'uploadUrl') {
      const { playerId, kind, refId, ext } = body as unknown as { playerId: string; kind: string; refId: string; ext: string };
      // Alleen de speler zelf mag zijn eigen huiswerk-/challenge-video uploaden.
      if (identity.kind !== 'player' || identity.id !== playerId) {
        return res.status(403).json({ error: 'Alleen de speler zelf kan een video uploaden.' });
      }
      const { data: player } = await admin.from('players').select('team_id').eq('id', playerId).maybeSingle();
      const teamId = (player as { team_id?: string } | null)?.team_id;
      if (!teamId) return res.status(404).json({ error: 'Speler niet gevonden.' });

      const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'mp4';
      const safeRefId = refId.replace(/[^a-zA-Z0-9_-]/g, '');
      const path = kind === 'challenge'
        ? `challenges/${teamId}/${playerId}/${safeRefId}_${Date.now()}.${safeExt}`
        : `${teamId}/${playerId}/${safeRefId}_${Date.now()}.${safeExt}`;

      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !data) return res.status(500).json({ error: 'Upload-link genereren mislukt.' });
      return res.json({ path, token: data.token, signedUrl: data.signedUrl });
    }

    if (body.action === 'viewUrl') {
      const { path: stored } = body as unknown as { path: string };
      const path = extractPath(stored);
      if (!path) return res.status(400).json({ error: 'Ongeldig video-pad.' });
      const teamId = teamIdFromPath(path);
      if (!teamId) return res.status(400).json({ error: 'Ongeldig video-pad.' });

      const teamIds = await accessibleTeamIds(identity);
      if (!teamIds.includes(teamId)) return res.status(403).json({ error: 'Geen toegang tot deze video.' });

      const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 300);
      if (error || !data) return res.status(404).json({ error: 'Video niet gevonden.' });
      return res.json({ url: data.signedUrl });
    }

    return res.status(400).json({ error: 'Onbekende actie.' });
  });
}
