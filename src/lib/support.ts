import { authHeaders } from './apiAuth';

// Alle support/ticket-acties lopen via /api/support (service-role, met
// server-side identiteitscheck) — zie supabase/support_system.sql.

export interface SupportCategory {
  id: string;
  name: string;
  audience: 'club' | 'coach' | 'ouder' | 'speler';
  routes_to: 'coach' | 'club_admin' | 'platform';
  is_pro: boolean;
  sort_order: number;
}

export interface SupportTicket {
  id: string;
  club_id: string | null;
  category_id: string | null;
  subject: string;
  status: 'open' | 'in_behandeling' | 'opgelost' | 'gesloten';
  priority: 'normaal' | 'pro';
  source: 'manual' | 'widget' | 'ai_escalation';
  created_by_kind: string;
  created_by_id: string;
  created_by_name: string;
  assigned_to_kind: string | null;
  assigned_to_id: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_kind: string;
  sender_id: string;
  sender_name: string;
  body: string;
  is_internal_note: boolean;
  created_at: string;
}

const ENDPOINT = '/api/support';

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

export async function fetchSupportCategories(): Promise<SupportCategory[]> {
  const r = await call<{ categories: SupportCategory[] }>('listCategories');
  return r?.categories ?? [];
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
): Promise<{ sessionId: string; reply: string; escalate: boolean } | null> {
  return call('chat', { sessionId, message });
}

export async function escalateChatToTicket(
  sessionId: string,
  subject: string,
  categoryId?: string,
): Promise<{ ticketId: string } | null> {
  return call('escalate', { sessionId, subject, categoryId });
}

export async function createTicket(
  categoryId: string,
  subject: string,
  message: string,
): Promise<{ ticketId: string } | null> {
  return call('createTicket', { categoryId, subject, message });
}

export async function fetchMyTickets(): Promise<SupportTicket[]> {
  const r = await call<{ tickets: SupportTicket[] }>('listMyTickets');
  return r?.tickets ?? [];
}

export async function fetchInboxTickets(): Promise<SupportTicket[]> {
  const r = await call<{ tickets: SupportTicket[] }>('listInboxTickets');
  return r?.tickets ?? [];
}

export async function fetchTicket(
  ticketId: string,
): Promise<{ ticket: SupportTicket; messages: SupportMessage[] } | null> {
  return call('getTicket', { ticketId });
}

export async function sendTicketMessage(ticketId: string, body: string): Promise<SupportMessage | null> {
  const r = await call<{ message: SupportMessage }>('sendTicketMessage', { ticketId, body });
  return r?.message ?? null;
}

export async function updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<boolean> {
  const r = await call<{ ok: boolean }>('updateTicketStatus', { ticketId, status });
  return !!r?.ok;
}

export async function sendFaqFeedback(faqId: string, helpful: boolean): Promise<void> {
  await call('faqFeedback', { faqId, helpful });
}
