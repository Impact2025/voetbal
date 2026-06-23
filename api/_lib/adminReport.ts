import { Resend } from 'resend';
import { getAdminClient } from './supabaseAdmin.js';

const REPORT_TO = 'v.munster@weareimpact.nl';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = 'google/gemini-2.5-flash';

interface Metrics {
  totals: { clubs: number; teams: number; players: number; coaches: number; club_admins: number; parents: number };
  signups: { today: number; last_7d: number; last_30d: number };
  activity: { events_7d: number; events_30d: number; submissions_7d: number; videos_7d: number };
  engagement: { active_players_7d: number; active_players_30d: number; active_teams_30d: number; active_clubs_30d: number; dormant_clubs: number };
  generated_at: string;
}

// Roept OpenRouter aan voor een management-samenvatting + systeemanalyse.
// Faalt soft: bij een fout krijg je nog steeds de cijfers, alleen zonder AI-tekst.
async function generateAnalysis(period: 'daily' | 'monthly', m: Metrics): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return 'AI-analyse niet beschikbaar (OPENROUTER_API_KEY ontbreekt).';

  const periodNl = period === 'daily' ? 'dagelijks' : 'maandelijks';
  const prompt = `Je bent de data-analist van Skillkaart, een SaaS-app voor jeugdvoetbal (clubs, teams, coaches, spelers, ouders).
Schrijf een beknopt ${periodNl} management-rapport in het Nederlands op basis van deze cijfers (JSON):

${JSON.stringify(m, null, 2)}

Lever exact deze structuur in platte tekst (geen markdown-koppen, geen sterretjes):
1. KERN — 2-3 zinnen met de belangrijkste conclusie.
2. GROEI — wat valt op aan signups en activiteit?
3. RISICO'S — slapende clubs, dalende betrokkenheid, of opvallende gaten. Wees eerlijk.
4. SYSTEEMANALYSE — beoordeel of de cijfers gezond ogen; noem als iets op nul/leeg staat want dat kan op een storing wijzen.
5. ACTIES — 2-4 concrete, prioriteerbare aanbevelingen.
Houd het zakelijk en scanbaar. Maximaal ~250 woorden.`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Skillkaart Admin Report',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() || 'Geen analyse gegenereerd.';
  } catch (err) {
    console.error('AI-analyse faalde:', err);
    return `AI-analyse kon niet worden gegenereerd: ${err instanceof Error ? err.message : 'onbekende fout'}.`;
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function kpiRow(label: string, value: number | string): string {
  return `<tr>
    <td style="padding:8px 0;color:#9ca3af;font-size:13px;">${esc(label)}</td>
    <td style="padding:8px 0;color:#ffffff;font-size:15px;font-weight:700;text-align:right;">${value}</td>
  </tr>`;
}

function buildHtml(period: 'daily' | 'monthly', m: Metrics, analysis: string): string {
  const title = period === 'daily' ? 'Dagrapport' : 'Maandrapport';
  const dateStr = new Date(m.generated_at).toLocaleString('nl-NL', { dateStyle: 'full', timeStyle: 'short' });
  const analysisHtml = esc(analysis).replace(/\n/g, '<br>');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#090B0F;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#00FF9D;padding:20px 28px;">
            <div style="font-size:20px;font-weight:900;color:#000;letter-spacing:3px;">SKILLKAART · ADMIN</div>
            <div style="font-size:12px;color:#00000080;margin-top:4px;">${title} — ${esc(dateStr)}</div>
          </td></tr>

          <tr><td style="padding:28px 28px 8px;">
            <h2 style="margin:0 0 12px;color:#00FF9D;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Kerncijfers</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${kpiRow('Clubs (actief / totaal)', `${m.engagement.active_clubs_30d} / ${m.totals.clubs}`)}
              ${kpiRow('Teams', m.totals.teams)}
              ${kpiRow('Spelers', m.totals.players)}
              ${kpiRow('Coaches', m.totals.coaches)}
              ${kpiRow('Club-admins', m.totals.club_admins)}
              ${kpiRow('Ouders', m.totals.parents)}
              ${kpiRow('Slapende clubs (30d geen activiteit)', m.engagement.dormant_clubs)}
            </table>
          </td></tr>

          <tr><td style="padding:8px 28px;">
            <h2 style="margin:16px 0 12px;color:#00FF9D;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Groei & activiteit</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${kpiRow('Nieuwe accounts vandaag', m.signups.today)}
              ${kpiRow('Nieuwe accounts (7d / 30d)', `${m.signups.last_7d} / ${m.signups.last_30d}`)}
              ${kpiRow('Actieve spelers (7d / 30d)', `${m.engagement.active_players_7d} / ${m.engagement.active_players_30d}`)}
              ${kpiRow('Acties (events) 7d / 30d', `${m.activity.events_7d} / ${m.activity.events_30d}`)}
              ${kpiRow('Video-inzendingen (7d)', m.activity.videos_7d)}
            </table>
          </td></tr>

          <tr><td style="padding:8px 28px 28px;">
            <h2 style="margin:16px 0 12px;color:#00FF9D;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Management & systeemanalyse</h2>
            <div style="color:#d1d5db;font-size:14px;line-height:1.8;background:#0f1318;border:1px solid #1f2937;border-radius:12px;padding:16px;">
              ${analysisHtml}
            </div>
          </td></tr>

          <tr><td style="padding:16px 28px;border-top:1px solid #1f2937;">
            <p style="margin:0;font-size:11px;color:#6b7280;">
              Automatisch gegenereerd door <span style="color:#00FF9D;">Skillkaart Admin</span>.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

// Bouwt het rapport, verstuurt het naar de eigenaar en logt de actie.
export async function buildAndSendReport(period: 'daily' | 'monthly'): Promise<{ ok: boolean; sent?: boolean; error?: string }> {
  const admin = getAdminClient();

  const { data, error } = await admin.rpc('admin_metrics');
  if (error || !data) {
    return { ok: false, error: error?.message || 'admin_metrics gaf geen data terug.' };
  }
  const metrics = data as Metrics;

  const analysis = await generateAnalysis(period, metrics);
  const html = buildHtml(period, metrics, analysis);

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, error: 'RESEND_API_KEY ontbreekt.' };

  const resend = new Resend(resendKey);
  const title = period === 'daily' ? 'Dagrapport' : 'Maandrapport';
  const today = new Date().toLocaleDateString('nl-NL');

  const { error: sendErr } = await resend.emails.send({
    from: 'Skillkaart Admin <onboarding@resend.dev>',
    to: [REPORT_TO],
    subject: `Skillkaart ${title} — ${today}`,
    html,
  });

  if (sendErr) return { ok: false, error: sendErr.message };

  await admin.from('admin_audit_log').insert({
    actor_email: 'system:cron',
    action: `report_${period}_sent`,
    target: REPORT_TO,
    meta: metrics as unknown as Record<string, unknown>,
  });

  return { ok: true, sent: true };
}
