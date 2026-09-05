/**
 * Fase 6: wekelijkse "vragen zonder FAQ-match"-rapportage. Zelfde
 * afzender/stijl als adminReport.ts, maar een aparte lichte AI-analyse
 * (top thema's die een FAQ-antwoord missen) i.p.v. platformcijfers.
 */
import { Resend } from 'resend';
import { getAdminClient } from './supabaseAdmin.js';
import { MAIL_FROM } from './mailFrom.js';
import { callOpenRouter } from './openrouter.js';

const REPORT_TO = 'weareimpactnl@gmail.com';
const PERIOD_DAYS = 7;

interface ChatMessageRow {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  matched_faq_ids: string[] | null;
  created_at: string;
}

// Loopt chronologisch door alle chatberichten van de periode en verzamelt
// elke gebruikersvraag waarop het AI-antwoord géén FAQ-match had.
function findUnmatchedQuestions(rows: ChatMessageRow[]): string[] {
  const bySession = new Map<string, ChatMessageRow[]>();
  for (const r of rows) {
    if (!bySession.has(r.session_id)) bySession.set(r.session_id, []);
    bySession.get(r.session_id)!.push(r);
  }

  const unmatched: string[] = [];
  for (const msgs of bySession.values()) {
    msgs.sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (let i = 0; i < msgs.length - 1; i++) {
      const q = msgs[i];
      const a = msgs[i + 1];
      if (q.role === 'user' && a.role === 'assistant' && (!a.matched_faq_ids || a.matched_faq_ids.length === 0)) {
        unmatched.push(q.content.trim());
      }
    }
  }
  return unmatched;
}

async function summarizeGaps(questions: string[]): Promise<string> {
  if (questions.length === 0) return '';
  try {
    return await callOpenRouter([
      {
        role: 'system',
        content: 'Je bent de product-analist van Skillkaart, een jeugdvoetbal-platform. Je krijgt een lijst met vragen van gebruikers waarop de support-AI géén passend FAQ-antwoord kon vinden. Groepeer ze naar onderwerp en geef een genummerde lijst (max 10) van de belangrijkste thema\'s die een nieuw of beter FAQ-antwoord nodig hebben, gesorteerd op frequentie. Kort, geen inleiding, platte tekst.',
      },
      { role: 'user', content: questions.slice(0, 300).map((q, i) => `${i + 1}. ${q}`).join('\n') },
    ], { maxTokens: 500, temperature: 0.3 });
  } catch (err) {
    return `AI-analyse kon niet worden gegenereerd: ${err instanceof Error ? err.message : 'onbekende fout'}.`;
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildHtml(opts: {
  sessions: number; unmatchedCount: number; escalated: number; analysis: string;
}): string {
  const { sessions, unmatchedCount, escalated, analysis } = opts;
  const analysisHtml = analysis
    ? esc(analysis).replace(/\n/g, '<br>')
    : 'Geen vragen zonder passend FAQ-antwoord deze week — de kennisbank dekt de vraag goed.';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#090B0F;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#00FF9D;padding:20px 28px;">
            <div style="font-size:20px;font-weight:900;color:#000;letter-spacing:3px;">SKILLKAART · SUPPORT</div>
            <div style="font-size:12px;color:#00000080;margin-top:4px;">Wekelijkse FAQ-analyse — ${esc(new Date().toLocaleDateString('nl-NL'))}</div>
          </td></tr>

          <tr><td style="padding:28px 28px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#9ca3af;font-size:13px;">AI-chatgesprekken (7d)</td><td style="padding:6px 0;color:#fff;font-size:15px;font-weight:700;text-align:right;">${sessions}</td></tr>
              <tr><td style="padding:6px 0;color:#9ca3af;font-size:13px;">Vragen zonder FAQ-match</td><td style="padding:6px 0;color:#fff;font-size:15px;font-weight:700;text-align:right;">${unmatchedCount}</td></tr>
              <tr><td style="padding:6px 0;color:#9ca3af;font-size:13px;">Geëscaleerd naar ticket</td><td style="padding:6px 0;color:#fff;font-size:15px;font-weight:700;text-align:right;">${escalated}</td></tr>
            </table>
          </td></tr>

          <tr><td style="padding:8px 28px 28px;">
            <h2 style="margin:16px 0 12px;color:#00FF9D;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Thema's die een FAQ-antwoord missen</h2>
            <div style="color:#d1d5db;font-size:14px;line-height:1.8;background:#0f1318;border:1px solid #1f2937;border-radius:12px;padding:16px;">
              ${analysisHtml}
            </div>
          </td></tr>

          <tr><td style="padding:16px 28px;border-top:1px solid #1f2937;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Automatisch gegenereerd door <span style="color:#00FF9D;">Skillkaart Support</span>.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

export async function buildAndSendFaqGapsReport(): Promise<{ ok: boolean; sent?: boolean; error?: string }> {
  const admin = getAdminClient();
  const since = new Date(Date.now() - PERIOD_DAYS * 86400000).toISOString();

  const { data: sessionRows } = await admin.from('ai_chat_sessions').select('id').gte('started_at', since);
  const sessionIds = ((sessionRows ?? []) as { id: string }[]).map(s => s.id);

  let unmatched: string[] = [];
  if (sessionIds.length > 0) {
    const { data: msgRows } = await admin.from('ai_chat_messages')
      .select('session_id, role, content, matched_faq_ids, created_at')
      .in('session_id', sessionIds);
    unmatched = findUnmatchedQuestions((msgRows ?? []) as ChatMessageRow[]);
  }

  const { count: escalatedCount } = await admin.from('support_tickets')
    .select('id', { count: 'exact', head: true }).eq('source', 'ai_escalation').gte('created_at', since);

  const analysis = await summarizeGaps(unmatched);
  const html = buildHtml({
    sessions: sessionIds.length, unmatchedCount: unmatched.length,
    escalated: escalatedCount ?? 0, analysis,
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, error: 'RESEND_API_KEY ontbreekt.' };

  const resend = new Resend(resendKey);
  const { error: sendErr } = await resend.emails.send({
    from: MAIL_FROM,
    to: [REPORT_TO],
    subject: `Skillkaart wekelijkse FAQ-analyse — ${new Date().toLocaleDateString('nl-NL')}`,
    html,
  });
  if (sendErr) return { ok: false, error: sendErr.message };

  await admin.from('admin_audit_log').insert({
    actor_email: 'system:cron',
    action: 'faq_gaps_report_sent',
    target: REPORT_TO,
    meta: { sessions: sessionIds.length, unmatched: unmatched.length, escalated: escalatedCount ?? 0 },
  });

  return { ok: true, sent: true };
}
