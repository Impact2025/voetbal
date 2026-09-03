/**
 * Mail-notificaties voor het ticketsysteem (Fase 4). Zelfde afzender/stijl
 * als api/send-email.ts en api/_lib/adminReport.ts. Fire-and-forget vanuit
 * api/support.ts — een mailfout mag een ticket-actie nooit laten falen.
 */
import { Resend } from 'resend';
import { MAIL_FROM } from './mailFrom.js';
import { getAdminClient } from './supabaseAdmin.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const PLATFORM_SUPPORT_EMAIL = 'v.munster@weareimpact.nl';
const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://skillkaart.nl';

function escapeHtml(s: string): string {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function shell(eyebrow: string, title: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#090B0F;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#00FF9D;padding:20px 28px;">
                <div style="font-size:20px;font-weight:900;color:#000;letter-spacing:3px;">SKILLKAART</div>
                <div style="font-size:12px;color:#00000080;margin-top:4px;">${escapeHtml(eyebrow)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h2 style="margin:0 0 16px;color:#ffffff;font-size:18px;font-weight:700;">${escapeHtml(title)}</h2>
                <div style="color:#d1d5db;font-size:14px;line-height:1.8;">${bodyHtml}</div>
                <a href="${BASE_URL}" style="display:inline-block;margin-top:24px;padding:10px 20px;background:#00FF9D;color:#000;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">
                  Bekijk in Skillkaart
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

async function send(to: string[], subject: string, html: string): Promise<void> {
  const recipients = [...new Set(to)].filter(Boolean).slice(0, 10);
  if (recipients.length === 0) return;
  try {
    await resend.emails.send({ from: MAIL_FROM, to: recipients, subject, html });
  } catch (err) {
    console.error('[supportNotify] verzenden mislukt:', err instanceof Error ? err.message : err);
  }
}

/** Spelers hebben geen e-mail (PIN-login) — geeft dan null terug. */
async function resolveEmail(kind: string, id: string): Promise<string | null> {
  if (kind === 'player') return null;
  try {
    const { data } = await getAdminClient().auth.admin.getUserById(id);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

async function resolveStaffEmails(clubId: string | null, role: 'coach' | 'club_admin'): Promise<string[]> {
  if (!clubId) return [];
  const admin = getAdminClient();
  const { data } = await admin.from('profiles').select('id').eq('role', role).eq('club_id', clubId).limit(10);
  const ids = ((data ?? []) as { id: string }[]).map(r => r.id);
  const emails = await Promise.all(ids.map(id => resolveEmail(role, id)));
  return emails.filter((e): e is string => !!e);
}

interface TicketLike {
  id: string;
  club_id: string | null;
  category_id: string | null;
  subject: string;
  created_by_kind: string;
  created_by_id: string;
  created_by_name: string;
}

/** Nieuw ticket → mail naar de doelgroep uit support_categories.routes_to. */
export async function notifyNewTicket(ticket: TicketLike): Promise<void> {
  const admin = getAdminClient();
  const { data: cat } = await admin.from('support_categories').select('routes_to, name')
    .eq('id', ticket.category_id ?? '').maybeSingle();
  const routesTo = (cat as { routes_to?: string } | null)?.routes_to ?? 'platform';
  const categoryName = (cat as { name?: string } | null)?.name ?? 'Support';

  const bodyHtml = `
    <p><strong>${escapeHtml(ticket.created_by_name)}</strong> heeft een nieuw ticket aangemaakt.</p>
    <p style="margin-top:12px;padding:12px 16px;background:#111827;border-radius:8px;">
      <span style="color:#9ca3af;font-size:12px;">${escapeHtml(categoryName)}</span><br>
      <strong>${escapeHtml(ticket.subject)}</strong>
    </p>
  `;

  if (routesTo === 'platform') {
    await send([PLATFORM_SUPPORT_EMAIL], `Nieuw ticket: ${ticket.subject}`, shell('Platform-support', 'Nieuw support-ticket', bodyHtml));
    return;
  }

  const emails = await resolveStaffEmails(ticket.club_id, routesTo as 'coach' | 'club_admin');
  await send(emails, `Nieuw ticket: ${ticket.subject}`, shell('Support', 'Nieuw support-ticket', bodyHtml));
}

/** Nieuw bericht van staff → mail naar de melder (als die een e-mailadres heeft). */
export async function notifyReplyToCreator(ticket: TicketLike, replyBody: string, replierName: string): Promise<void> {
  const email = await resolveEmail(ticket.created_by_kind, ticket.created_by_id);
  if (!email) return;
  const bodyHtml = `
    <p><strong>${escapeHtml(replierName)}</strong> heeft gereageerd op je ticket "${escapeHtml(ticket.subject)}":</p>
    <p style="margin-top:12px;padding:12px 16px;background:#111827;border-radius:8px;white-space:pre-wrap;">${escapeHtml(replyBody.slice(0, 500))}</p>
  `;
  await send([email], `Reactie op je ticket: ${ticket.subject}`, shell('Support', 'Nieuwe reactie', bodyHtml));
}

/** Status gewijzigd naar opgelost/gesloten → mail naar de melder. */
export async function notifyStatusChange(ticket: TicketLike, status: string): Promise<void> {
  if (status !== 'opgelost' && status !== 'gesloten') return;
  const email = await resolveEmail(ticket.created_by_kind, ticket.created_by_id);
  if (!email) return;
  const label = status === 'opgelost' ? 'opgelost' : 'gesloten';
  const bodyHtml = `<p>Je ticket "${escapeHtml(ticket.subject)}" is zojuist gemarkeerd als <strong>${label}</strong>.</p>`;
  await send([email], `Ticket ${label}: ${ticket.subject}`, shell('Support', `Ticket ${label}`, bodyHtml));
}
