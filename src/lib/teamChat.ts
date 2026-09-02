import { authHeaders } from './apiAuth';
import type { TeamChannel, TeamChannelMember, TeamChannelMessage } from '../types';

// Alle teamchat-acties lopen via /api/team-chat (service-role, met
// server-side membership-check) in plaats van rechtstreeks naar Supabase —
// zie supabase/fix_team_chat_rls.sql voor de reden.

export type TeamChannelRow = TeamChannel;
export type TeamChannelMemberRow = TeamChannelMember;
export type TeamChannelMessageRow = TeamChannelMessage;

const ENDPOINT = '/api/team-chat';

async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T | null> {
  const auth = await authHeaders();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// ─── Channels ───────────────────────────────────────────────────────────────

export async function fetchChannels(teamId: string): Promise<TeamChannelRow[]> {
  const r = await call<{ channels: TeamChannelRow[] }>('listChannels', { teamId });
  return r?.channels ?? [];
}

export async function ensureChannels(teamId: string): Promise<void> {
  await call('ensureChannels', { teamId });
}

// ─── Membership ─────────────────────────────────────────────────────────────

export async function joinChannel(channelId: string): Promise<void> {
  await call('joinChannel', { channelId });
}

export async function updateLastRead(channelId: string): Promise<void> {
  await call('updateLastRead', { channelId });
}

export async function toggleMute(channelId: string, muted: boolean): Promise<void> {
  await call('toggleMute', { channelId, muted });
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function fetchMessages(
  channelId: string,
  opts?: { before?: string; limit?: number },
): Promise<TeamChannelMessageRow[]> {
  const r = await call<{ messages: TeamChannelMessageRow[] }>('listMessages', {
    channelId, before: opts?.before, limit: opts?.limit,
  });
  return r?.messages ?? [];
}

export async function sendMessage(
  channelId: string,
  senderName: string,
  content: string,
  mentions?: string[],
  replyTo?: string,
): Promise<TeamChannelMessageRow | null> {
  const r = await call<{ message: TeamChannelMessageRow }>('sendMessage', {
    channelId, content: content.trim(), senderName, mentions, replyTo,
  });
  return r?.message ?? null;
}

export async function editMessage(messageId: string, content: string): Promise<void> {
  await call('editMessage', { messageId, content });
}

// ─── Unread counts ──────────────────────────────────────────────────────────

export async function fetchUnreadCounts(): Promise<Record<string, number>> {
  const r = await call<{ counts: Record<string, number> }>('unreadCounts');
  return r?.counts ?? {};
}

// ─── "Live" updates via polling ─────────────────────────────────────────────
// Supabase Realtime (postgres_changes) leunt op RLS, en RLS staat nu voor de
// anon/authenticated rol dicht (zie fix_team_chat_rls.sql) — spelers hebben
// sowieso geen Supabase-sessie om realtime mee te authenticeren. Polling via
// hetzelfde beveiligde endpoint is het simpelste correcte alternatief.

const POLL_INTERVAL_MS = 4000;

export function subscribeToChannel(
  channelId: string,
  onMessage: (msg: TeamChannelMessageRow) => void,
): { unsubscribe: () => void } {
  let cursor = new Date().toISOString();
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    const r = await call<{ messages: TeamChannelMessageRow[] }>('listMessages', {
      channelId, after: cursor, limit: 50,
    });
    const msgs = r?.messages ?? [];
    for (const m of msgs) {
      onMessage(m);
      if (m.created_at > cursor) cursor = m.created_at;
    }
  };

  const interval = setInterval(() => { void tick(); }, POLL_INTERVAL_MS);

  return {
    unsubscribe: () => { stopped = true; clearInterval(interval); },
  };
}
