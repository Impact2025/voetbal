import { supabase } from './supabase';
import type { TeamChannel, TeamChannelMember, TeamChannelMessage } from '../types';

// ─── Types (hergebruik de generieke types uit ../types) ─────────────────────

export type TeamChannelRow = TeamChannel;
export type TeamChannelMemberRow = TeamChannelMember;
export type TeamChannelMessageRow = TeamChannelMessage;

// ─── Channels ───────────────────────────────────────────────────────────────

export async function fetchChannels(teamId: string): Promise<TeamChannelRow[]> {
  const { data } = await supabase
    .from('team_channels')
    .select('*')
    .eq('team_id', teamId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  return (data ?? []) as TeamChannelRow[];
}

export async function ensureChannels(teamId: string): Promise<void> {
  // Als er nog geen channels zijn, worden default channels aangemaakt via RPC.
  await supabase.rpc('ensure_team_channels', { p_team_id: teamId });
}

// ─── Membership ─────────────────────────────────────────────────────────────

export async function fetchMemberships(userId: string): Promise<TeamChannelMemberRow[]> {
  const { data } = await supabase
    .from('team_channel_members')
    .select('*')
    .eq('user_id', userId);
  return (data ?? []) as TeamChannelMemberRow[];
}

export async function joinChannel(channelId: string, userId: string, userType: TeamChannelMemberRow['user_type']): Promise<void> {
  await supabase.from('team_channel_members').upsert(
    { channel_id: channelId, user_id: userId, user_type: userType, last_read_at: new Date().toISOString() },
    { onConflict: 'channel_id,user_id' },
  );
}

export async function updateLastRead(channelId: string, userId: string): Promise<void> {
  await supabase.from('team_channel_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('channel_id', channelId)
    .eq('user_id', userId);
}

export async function toggleMute(channelId: string, userId: string, muted: boolean): Promise<void> {
  await supabase.from('team_channel_members')
    .update({ muted })
    .eq('channel_id', channelId)
    .eq('user_id', userId);
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function fetchMessages(
  channelId: string,
  opts?: { before?: string; limit?: number },
): Promise<TeamChannelMessageRow[]> {
  let query = supabase
    .from('team_channel_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.before) {
    query = query.lt('created_at', opts.before);
  }

  const { data } = await query;
  return ((data ?? []) as TeamChannelMessageRow[]).reverse();
}

export async function sendMessage(
  channelId: string,
  senderId: string,
  senderName: string,
  senderRole: TeamChannelMessageRow['sender_role'],
  content: string,
  mentions?: string[],
  replyTo?: string,
): Promise<TeamChannelMessageRow | null> {
  // Parse @mentions uit de content
  const detectedMentions = mentions?.map(m => m) ?? [];

  const { data } = await supabase
    .from('team_channel_messages')
    .insert({
      channel_id: channelId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      content: content.trim(),
      mentions: detectedMentions.length > 0 ? detectedMentions : null,
      reply_to: replyTo ?? null,
    })
    .select()
    .single();

  return (data as TeamChannelMessageRow) ?? null;
}

export async function editMessage(messageId: string, content: string): Promise<void> {
  await supabase.from('team_channel_messages')
    .update({ content, edited_at: new Date().toISOString() })
    .eq('id', messageId);
}

// ─── Unread counts ──────────────────────────────────────────────────────────

export async function fetchUnreadCounts(
  userId: string,
): Promise<Record<string, number>> {
  const { data: memberships } = await supabase
    .from('team_channel_members')
    .select('channel_id, last_read_at')
    .eq('user_id', userId);

  if (!memberships?.length) return {};

  const result: Record<string, number> = {};

  for (const m of memberships) {
    const channelId = m.channel_id as string;
    const lastRead = m.last_read_at as string;

    let query = supabase
      .from('team_channel_messages')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', channelId);

    if (lastRead) {
      query = query.gt('created_at', lastRead);
    }

    const { count } = await query;
    result[channelId] = count ?? 0;
  }

  return result;
}

// ─── Real-time subscription ─────────────────────────────────────────────────

export function subscribeToChannel(
  channelId: string,
  onMessage: (msg: TeamChannelMessageRow) => void,
): { unsubscribe: () => void } {
  const sub = supabase
    .channel(`team_channel_messages:channel_id=eq.${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'team_channel_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onMessage(payload.new as TeamChannelMessageRow);
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(sub);
    },
  };
}
