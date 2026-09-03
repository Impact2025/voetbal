/**
 * Serverless proxy voor het support/ticketsysteem (Fase 2/3 van het
 * PRO-supportplan). Zelfde beveiligingsmodel als team-chat: spelers hebben
 * geen Supabase-sessie (PIN-login), dus resolveIdentity() verifieert de
 * aanroeper server-side en de service-role key doet daarna het werk.
 * RLS staat aan zonder policies (zie supabase/support_system.sql) — directe
 * client-toegang tot deze tabellen is dicht.
 *
 * Acties:
 *  - listCategories        : publieke lijst met support-categorieën
 *  - chat                   : AI-agent, put uit faq_items, escaleert bij lage confidence
 *  - escalate                : zet een AI-chatsessie om in een ticket
 *  - createTicket            : handmatig ticket aanmaken (zonder AI)
 *  - listMyTickets           : eigen tickets van de aanroeper
 *  - listInboxTickets        : tickets die deze coach/club_admin/superadmin moet behandelen
 *  - getTicket                : ticket + berichten (met toegangscheck)
 *  - sendTicketMessage       : reageren op een ticket
 *  - updateTicketStatus      : status wijzigen (alleen behandelaars)
 *  - faqFeedback              : "was dit nuttig?"-knop op /faq
 */
import { withError } from './_lib/withError.js';
import { applyCors } from './_lib/cors.js';
import { overRateLimit } from './_lib/rateLimit.js';
import { getAdminClient } from './_lib/supabaseAdmin.js';
import { resolveIdentity, type Identity } from './_lib/teamAccess.js';
import { callOpenRouter } from './_lib/openrouter.js';
import { SupportActionSchema, validateOrError } from './_lib/validate.js';
import { notifyNewTicket, notifyReplyToCreator, notifyStatusChange } from './_lib/supportNotify.js';

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

// Mens-leesbare rol → FAQ-categorie ("club" = clubbestuur/-admin, ook
// zichtbaar voor coach/club_admin/superadmin naast hun eigen categorie).
function faqAudiencesFor(kind: Identity['kind']): string[] {
  switch (kind) {
    case 'player': return ['speler'];
    case 'parent': return ['ouder'];
    case 'coach': return ['coach', 'club'];
    case 'club_admin':
    case 'superadmin': return ['club', 'coach', 'ouder', 'speler'];
    default: return [];
  }
}

async function resolveClubId(identity: Identity): Promise<string | null> {
  const admin = getAdminClient();
  if (identity.caller?.club_id) return identity.caller.club_id;

  if (identity.kind === 'player') {
    const { data } = await admin.from('players').select('team_id').eq('id', identity.id).maybeSingle();
    const teamId = (data as { team_id?: string } | null)?.team_id;
    if (!teamId) return null;
    const { data: team } = await admin.from('teams').select('club_id').eq('id', teamId).maybeSingle();
    return (team as { club_id?: string } | null)?.club_id ?? null;
  }

  if (identity.kind === 'parent') {
    const { data } = await admin.from('parent_links').select('team_id').eq('parent_id', identity.id).limit(1).maybeSingle();
    const teamId = (data as { team_id?: string } | null)?.team_id;
    if (!teamId) return null;
    const { data: team } = await admin.from('teams').select('club_id').eq('id', teamId).maybeSingle();
    return (team as { club_id?: string } | null)?.club_id ?? null;
  }

  if (identity.kind === 'coach') {
    const { data } = await admin.from('teams').select('club_id').eq('coach_id', identity.id).limit(1).maybeSingle();
    return (data as { club_id?: string } | null)?.club_id ?? null;
  }

  return null;
}

// Fase 5: PRO-clubs krijgen priority-tickets (SLA-badge, bovenaan de inbox).
// Server-side gecontroleerd bij aanmaak, zelfde patroon als de bestaande
// PRO-gating (secure_club_billing.sql) — nooit een client-vlag vertrouwen.
async function resolveTicketPriority(clubId: string | null): Promise<'normaal' | 'pro'> {
  if (!clubId) return 'normaal';
  const { data } = await getAdminClient().from('clubs').select('subscription_tier').eq('id', clubId).maybeSingle();
  const tier = (data as { subscription_tier?: string } | null)?.subscription_tier;
  return tier === 'pro' ? 'pro' : 'normaal';
}

// Simpele trefwoord-retrieval over faq_items (geen embeddings nodig voor v1
// — de embedding-kolom in support_system.sql staat klaar voor later).
async function findRelevantFaq(question: string, audiences: string[]): Promise<{ id: string; question: string; answer: string }[]> {
  const admin = getAdminClient();
  const words = [...new Set(
    question.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3),
  )].slice(0, 8);
  if (words.length === 0 || audiences.length === 0) return [];

  const orClause = words.map(w => `question.ilike.%${w}%,answer.ilike.%${w}%`).join(',');
  const { data } = await admin
    .from('faq_items')
    .select('id, question, answer')
    .eq('published', true)
    .in('category', audiences)
    .or(orClause)
    .limit(5);

  return (data ?? []) as { id: string; question: string; answer: string }[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default async function handler(req: Req, res: Res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await withError(res, async () => {
    if (req.body && typeof req.body === 'object' && (req.body as { action?: string }).action === 'listCategories') {
      // Categorieën zijn publiek — geen identiteit vereist (widget toont ze
      // vóórdat iemand ingelogd is op de marketing-site).
      const admin = getAdminClient();
      const { data } = await admin.from('support_categories').select('*').order('audience').order('sort_order');
      return res.json({ categories: data ?? [] });
    }

    const resolved = await resolveIdentity(req.headers);
    if (!resolved) {
      return res.status(401).json({ error: 'Geen toegang. Log opnieuw in en probeer het nog eens.' });
    }
    const identity: Identity = resolved;

    if (await overRateLimit(`support:${identity.kind}:${identity.id}`, 60, 60)) {
      return res.status(429).json({ error: 'Te veel aanvragen. Wacht even.' });
    }

    if (!validateOrError(SupportActionSchema, req.body, res)) return;
    const body = req.body as { action: string } & Record<string, unknown>;
    const admin = getAdminClient();

    async function requireTicketAccess(ticketId: string): Promise<{ id: string; club_id: string | null; created_by_kind: string; created_by_id: string; created_by_name: string; assigned_to_kind: string | null; assigned_to_id: string | null; category_id: string | null; subject: string } | null> {
      const { data } = await admin.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
      if (!data) return null;
      const t = data as { club_id: string | null; created_by_kind: string; created_by_id: string; created_by_name: string; assigned_to_kind: string | null; assigned_to_id: string | null; category_id: string | null; subject: string };

      const isOwner = t.created_by_kind === identity.kind && t.created_by_id === identity.id;
      if (isOwner) return { id: ticketId, ...t };

      if (identity.kind === 'superadmin') return { id: ticketId, ...t };

      if ((identity.kind === 'coach' || identity.kind === 'club_admin') && t.club_id) {
        const myClub = await resolveClubId(identity);
        if (myClub && myClub === t.club_id) return { id: ticketId, ...t };
      }

      return null;
    }

    switch (body.action) {
      case 'chat': {
        const { sessionId, message } = body as unknown as { sessionId?: string; message: string };
        const clubId = await resolveClubId(identity);

        let session: { id: string } | null = null;
        if (sessionId) {
          const { data } = await admin.from('ai_chat_sessions').select('id').eq('id', sessionId)
            .eq('user_kind', identity.kind).eq('user_id', identity.id).maybeSingle();
          session = data as { id: string } | null;
        }
        if (!session) {
          const { data } = await admin.from('ai_chat_sessions').insert({
            club_id: clubId, user_kind: identity.kind, user_id: identity.id,
          }).select('id').single();
          session = data as { id: string };
        }

        await admin.from('ai_chat_messages').insert({ session_id: session.id, role: 'user', content: message });

        const faqMatches = await findRelevantFaq(message, faqAudiencesFor(identity.kind));
        const context = faqMatches.map(f => `Vraag: ${f.question}\nAntwoord: ${stripHtml(f.answer)}`).join('\n\n');

        const { data: history } = await admin.from('ai_chat_messages')
          .select('role, content').eq('session_id', session.id).order('created_at', { ascending: true }).limit(12);

        const systemPrompt = context
          ? `Je bent de support-assistent van Skillkaart, een jeugdvoetbal-platform. Beantwoord de vraag van de gebruiker (rol: ${identity.kind}) kort en vriendelijk, uitsluitend op basis van onderstaande FAQ-fragmenten. Als het antwoord er niet duidelijk in staat, zeg dat eerlijk en stel voor om een medewerker erbij te halen — verzin niets.\n\n${context}`
          : `Je bent de support-assistent van Skillkaart, een jeugdvoetbal-platform. Er is geen passend FAQ-antwoord gevonden voor deze vraag van de gebruiker (rol: ${identity.kind}). Zeg dat eerlijk in één zin en stel voor om een medewerker erbij te halen.`;

        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...((history ?? []) as { role: 'user' | 'assistant'; content: string }[]),
        ];

        const reply = await callOpenRouter(messages, { maxTokens: 350, temperature: 0.3 });
        await admin.from('ai_chat_messages').insert({
          session_id: session.id, role: 'assistant', content: reply,
          matched_faq_ids: faqMatches.map(f => f.id),
        });

        const escalate = faqMatches.length === 0;
        return res.json({ sessionId: session.id, reply, escalate });
      }

      case 'escalate': {
        const { sessionId, subject, categoryId } = body as unknown as { sessionId: string; subject: string; categoryId?: string };
        const { data: sessionRow } = await admin.from('ai_chat_sessions').select('*').eq('id', sessionId)
          .eq('user_kind', identity.kind).eq('user_id', identity.id).maybeSingle();
        if (!sessionRow) return res.status(404).json({ error: 'Gesprek niet gevonden.' });
        const session = sessionRow as { id: string; club_id: string | null; escalated_ticket_id: string | null };
        if (session.escalated_ticket_id) return res.json({ ticketId: session.escalated_ticket_id });

        const { data: msgs } = await admin.from('ai_chat_messages').select('role, content')
          .eq('session_id', sessionId).order('created_at', { ascending: true });
        const transcript = ((msgs ?? []) as { role: string; content: string }[])
          .map(m => `${m.role === 'user' ? identity.name : 'AI'}: ${m.content}`).join('\n');

        let summary = transcript.slice(0, 1000);
        try {
          summary = await callOpenRouter([
            { role: 'system', content: 'Vat dit supportgesprek samen in maximaal 3 zinnen voor een medewerker die het gaat overnemen. Geen inleiding, direct de samenvatting.' },
            { role: 'user', content: transcript.slice(0, 6000) },
          ], { maxTokens: 200, temperature: 0.2 });
        } catch { /* val terug op ruwe transcript-snippet */ }

        const clubId = session.club_id ?? await resolveClubId(identity);
        const { data: ticket, error } = await admin.from('support_tickets').insert({
          club_id: clubId,
          category_id: categoryId ?? null,
          subject: subject.trim(),
          source: 'ai_escalation',
          priority: await resolveTicketPriority(clubId),
          created_by_kind: identity.kind,
          created_by_id: identity.id,
          created_by_name: identity.name,
          ai_summary: summary,
        }).select('id, club_id, category_id, subject, created_by_kind, created_by_id, created_by_name').single();
        if (error || !ticket) return res.status(500).json({ error: 'Ticket aanmaken mislukt.' });
        const newTicket = ticket as { id: string; club_id: string | null; category_id: string | null; subject: string; created_by_kind: string; created_by_id: string; created_by_name: string };

        await admin.from('support_messages').insert({
          ticket_id: newTicket.id, sender_kind: identity.kind, sender_id: identity.id,
          sender_name: identity.name, body: transcript.slice(0, 4000),
        });
        await admin.from('ai_chat_sessions').update({ resolved: true, escalated_ticket_id: newTicket.id }).eq('id', sessionId);
        await notifyNewTicket(newTicket).catch(() => {});

        return res.json({ ticketId: newTicket.id });
      }

      case 'createTicket': {
        const { categoryId, subject, message } = body as unknown as { categoryId: string; subject: string; message: string };
        if (identity.kind !== 'player' && identity.kind !== 'parent' && identity.kind !== 'coach' && identity.kind !== 'club_admin') {
          return res.status(403).json({ error: 'Deze rol kan geen ticket aanmaken.' });
        }
        const clubId = await resolveClubId(identity);
        const { data: ticket, error } = await admin.from('support_tickets').insert({
          club_id: clubId, category_id: categoryId, subject: subject.trim(),
          source: 'widget', priority: await resolveTicketPriority(clubId),
          created_by_kind: identity.kind, created_by_id: identity.id, created_by_name: identity.name,
        }).select('id, club_id, category_id, subject, created_by_kind, created_by_id, created_by_name').single();
        if (error || !ticket) return res.status(500).json({ error: 'Ticket aanmaken mislukt.' });
        const newTicket = ticket as { id: string; club_id: string | null; category_id: string | null; subject: string; created_by_kind: string; created_by_id: string; created_by_name: string };

        await admin.from('support_messages').insert({
          ticket_id: newTicket.id, sender_kind: identity.kind, sender_id: identity.id,
          sender_name: identity.name, body: message.trim(),
        });
        await notifyNewTicket(newTicket).catch(() => {});
        return res.json({ ticketId: newTicket.id });
      }

      case 'listMyTickets': {
        const { data } = await admin.from('support_tickets').select('*')
          .eq('created_by_kind', identity.kind).eq('created_by_id', identity.id)
          .order('updated_at', { ascending: false });
        return res.json({ tickets: data ?? [] });
      }

      case 'listInboxTickets': {
        if (identity.kind !== 'coach' && identity.kind !== 'club_admin' && identity.kind !== 'superadmin') {
          return res.status(403).json({ error: 'Geen toegang tot de support-inbox.' });
        }
        if (identity.kind === 'superadmin') {
          const { data } = await admin.from('support_tickets').select('*')
            .order('priority', { ascending: false }).order('updated_at', { ascending: false }).limit(200);
          return res.json({ tickets: data ?? [] });
        }
        const routesTo = identity.kind === 'coach' ? 'coach' : 'club_admin';
        const clubId = await resolveClubId(identity);
        if (!clubId) return res.json({ tickets: [] });
        const { data: cats } = await admin.from('support_categories').select('id').eq('routes_to', routesTo);
        const categoryIds = ((cats ?? []) as { id: string }[]).map(c => c.id);
        if (categoryIds.length === 0) return res.json({ tickets: [] });
        // 'pro' > 'normaal' alfabetisch, dus priority desc zet PRO-tickets bovenaan.
        const { data } = await admin.from('support_tickets').select('*')
          .eq('club_id', clubId).in('category_id', categoryIds)
          .order('priority', { ascending: false }).order('updated_at', { ascending: false });
        return res.json({ tickets: data ?? [] });
      }

      case 'getTicket': {
        const { ticketId } = body as unknown as { ticketId: string };
        const ticket = await requireTicketAccess(ticketId);
        if (!ticket) return res.status(403).json({ error: 'Geen toegang tot dit ticket.' });
        const { data: messages } = await admin.from('support_messages').select('*')
          .eq('ticket_id', ticketId).order('created_at', { ascending: true });
        return res.json({ ticket, messages: messages ?? [] });
      }

      case 'sendTicketMessage': {
        const { ticketId, body: text } = body as unknown as { ticketId: string; body: string };
        const ticket = await requireTicketAccess(ticketId);
        if (!ticket) return res.status(403).json({ error: 'Geen toegang tot dit ticket.' });
        const { data, error } = await admin.from('support_messages').insert({
          ticket_id: ticketId, sender_kind: identity.kind, sender_id: identity.id,
          sender_name: identity.name, body: text.trim(),
        }).select().single();
        if (error) return res.status(500).json({ error: 'Bericht versturen mislukt.' });

        // Alleen mailen als een behandelaar reageert op iemand anders z'n ticket
        // — niet wanneer de melder zelf een vervolgvraag stelt.
        const isStaffReply = ['coach', 'club_admin', 'superadmin'].includes(identity.kind)
          && !(ticket.created_by_kind === identity.kind && ticket.created_by_id === identity.id);
        if (isStaffReply) await notifyReplyToCreator(ticket, text.trim(), identity.name).catch(() => {});

        return res.json({ message: data });
      }

      case 'updateTicketStatus': {
        const { ticketId, status } = body as unknown as { ticketId: string; status: 'open' | 'in_behandeling' | 'opgelost' | 'gesloten' };
        if (identity.kind !== 'coach' && identity.kind !== 'club_admin' && identity.kind !== 'superadmin') {
          return res.status(403).json({ error: 'Alleen behandelaars kunnen de status wijzigen.' });
        }
        const ticket = await requireTicketAccess(ticketId);
        if (!ticket) return res.status(403).json({ error: 'Geen toegang tot dit ticket.' });
        await admin.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
        await notifyStatusChange(ticket, status).catch(() => {});
        return res.json({ ok: true });
      }

      case 'faqFeedback': {
        const { faqId, helpful } = body as unknown as { faqId: string; helpful: boolean };
        const column = helpful ? 'helpful_count' : 'unhelpful_count';
        await admin.rpc('increment_faq_feedback', { p_faq_id: faqId, p_column: column });
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: 'Onbekende actie.' });
    }
  });
}
