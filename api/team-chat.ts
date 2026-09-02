/**
 * Serverless proxy voor teamchat — vervangt directe client→Supabase toegang.
 *
 * Waarom: team_chat.sql had RLS-policies met `USING (true)`, waardoor elke
 * ingelogde gebruiker (van elke club) alle teamchats kon lezen en er berichten
 * in kon plaatsen namens om het even wie. Spelers hebben bovendien geen
 * Supabase-sessie (PIN-login), dus RLS op auth.uid() kan hun toegang sowieso
 * niet afdwingen. Dit endpoint verifieert per aanvraag dat de aanroeper
 * daadwerkelijk lid is van het team achter het channel, en gebruikt daarna de
 * service-role key om de actie uit te voeren. supabase/fix_team_chat_rls.sql
 * zet de client-directe RLS-policies dicht.
 */
import { withError } from './_lib/withError.js';
import { applyCors } from './_lib/cors.js';
import { overRateLimit } from './_lib/rateLimit.js';
import { getAdminClient } from './_lib/supabaseAdmin.js';
import { resolveIdentity, accessibleTeamIds, identityUserType } from './_lib/teamAccess.js';
import { TeamChatActionSchema, validateOrError } from './_lib/validate.js';

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

  await withError(res, async () => {
    const identity = await resolveIdentity(req.headers);
    if (!identity) {
      return res.status(401).json({ error: 'Geen toegang. Log opnieuw in en probeer het nog eens.' });
    }

    if (await overRateLimit(`team-chat:${identity.kind}:${identity.id}`, 120, 60)) {
      return res.status(429).json({ error: 'Te veel aanvragen. Wacht even.' });
    }

    if (!validateOrError(TeamChatActionSchema, req.body, res)) return;
    const body = req.body as { action: string } & Record<string, unknown>;
    const admin = getAdminClient();

    // ── Helpers ────────────────────────────────────────────────────────────

    async function requireTeamAccess(teamId: string): Promise<boolean> {
      const ids = await accessibleTeamIds(identity!);
      return ids.includes(teamId);
    }

    async function teamIdForChannel(channelId: string): Promise<string | null> {
      const { data } = await admin.from('team_channels').select('team_id').eq('id', channelId).maybeSingle();
      return (data as { team_id?: string } | null)?.team_id ?? null;
    }

    async function requireChannelAccess(channelId: string): Promise<boolean> {
      const teamId = await teamIdForChannel(channelId);
      if (!teamId) return false;
      return requireTeamAccess(teamId);
    }

    // ── Actions ────────────────────────────────────────────────────────────

    switch (body.action) {
      case 'listChannels': {
        const teamId = body.teamId as string;
        if (!(await requireTeamAccess(teamId))) return res.status(403).json({ error: 'Geen toegang tot dit team.' });
        const { data } = await admin
          .from('team_channels').select('*').eq('team_id', teamId)
          .order('is_default', { ascending: false }).order('created_at', { ascending: true });
        return res.json({ channels: data ?? [] });
      }

      case 'ensureChannels': {
        const teamId = body.teamId as string;
        if (!(await requireTeamAccess(teamId))) return res.status(403).json({ error: 'Geen toegang tot dit team.' });
        await admin.rpc('ensure_team_channels', { p_team_id: teamId });
        return res.json({ ok: true });
      }

      case 'joinChannel': {
        const channelId = body.channelId as string;
        if (!(await requireChannelAccess(channelId))) return res.status(403).json({ error: 'Geen toegang tot dit kanaal.' });
        await admin.from('team_channel_members').upsert(
          { channel_id: channelId, user_id: identity.id, user_type: identityUserType(identity), last_read_at: new Date().toISOString() },
          { onConflict: 'channel_id,user_id' },
        );
        return res.json({ ok: true });
      }

      case 'listMessages': {
        const { channelId, before, after, limit } = body as unknown as { channelId: string; before?: string; after?: string; limit?: number };
        if (!(await requireChannelAccess(channelId))) return res.status(403).json({ error: 'Geen toegang tot dit kanaal.' });
        let query = admin.from('team_channel_messages').select('*').eq('channel_id', channelId);
        if (after) {
          query = query.gt('created_at', after).order('created_at', { ascending: true }).limit(limit ?? 50);
        } else {
          query = query.order('created_at', { ascending: false }).limit(limit ?? 50);
          if (before) query = query.lt('created_at', before);
        }
        const { data } = await query;
        const rows = (data ?? []) as { created_at: string }[];
        return res.json({ messages: after ? rows : rows.slice().reverse() });
      }

      case 'sendMessage': {
        const { channelId, content, senderName, mentions, replyTo } = body as unknown as {
          channelId: string; content: string; senderName?: string; mentions?: string[]; replyTo?: string;
        };
        if (!(await requireChannelAccess(channelId))) return res.status(403).json({ error: 'Geen toegang tot dit kanaal.' });
        if (await overRateLimit(`team-chat-send:${identity.kind}:${identity.id}`, 30, 60)) {
          return res.status(429).json({ error: 'Te veel berichten. Wacht even.' });
        }
        const { data, error } = await admin.from('team_channel_messages').insert({
          channel_id: channelId,
          sender_id: identity.id,
          // sender_id/sender_role komen van de geverifieerde identiteit (niet
          // te spoofen); sender_name is puur cosmetisch, zoals voorheen.
          sender_name: senderName?.trim() || identity.name,
          sender_role: identityUserType(identity),
          content: content.trim(),
          mentions: mentions?.length ? mentions : null,
          reply_to: replyTo ?? null,
        }).select().single();
        if (error) return res.status(500).json({ error: 'Bericht versturen mislukt.' });
        return res.json({ message: data });
      }

      case 'editMessage': {
        const { messageId, content } = body as unknown as { messageId: string; content: string };
        const { data: msg } = await admin.from('team_channel_messages').select('id, sender_id').eq('id', messageId).maybeSingle();
        if (!msg) return res.status(404).json({ error: 'Bericht niet gevonden.' });
        if ((msg as { sender_id: string }).sender_id !== identity.id) {
          return res.status(403).json({ error: 'Je kunt alleen je eigen berichten bewerken.' });
        }
        await admin.from('team_channel_messages').update({ content, edited_at: new Date().toISOString() }).eq('id', messageId);
        return res.json({ ok: true });
      }

      case 'updateLastRead': {
        const channelId = body.channelId as string;
        if (!(await requireChannelAccess(channelId))) return res.status(403).json({ error: 'Geen toegang tot dit kanaal.' });
        await admin.from('team_channel_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('channel_id', channelId).eq('user_id', identity.id);
        return res.json({ ok: true });
      }

      case 'toggleMute': {
        const { channelId, muted } = body as unknown as { channelId: string; muted: boolean };
        if (!(await requireChannelAccess(channelId))) return res.status(403).json({ error: 'Geen toegang tot dit kanaal.' });
        await admin.from('team_channel_members').update({ muted }).eq('channel_id', channelId).eq('user_id', identity.id);
        return res.json({ ok: true });
      }

      case 'unreadCounts': {
        const { data: memberships } = await admin
          .from('team_channel_members').select('channel_id, last_read_at').eq('user_id', identity.id);
        const result: Record<string, number> = {};
        for (const m of (memberships ?? []) as { channel_id: string; last_read_at: string }[]) {
          let q = admin.from('team_channel_messages').select('id', { count: 'exact', head: true }).eq('channel_id', m.channel_id);
          if (m.last_read_at) q = q.gt('created_at', m.last_read_at);
          const { count } = await q;
          result[m.channel_id] = count ?? 0;
        }
        return res.json({ counts: result });
      }

      default:
        return res.status(400).json({ error: 'Onbekende actie.' });
    }
  });
}
