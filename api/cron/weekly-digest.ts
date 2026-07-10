import { Resend } from 'resend';
import { verifyCron } from '../_lib/adminGuard.js';
import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { MAIL_FROM } from '../_lib/mailFrom.js';

interface Req { method: string; headers: Record<string, string | undefined> }
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

// ─── HTML template ──────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: 'zo', 1: 'ma', 2: 'di', 3: 'wo', 4: 'do', 5: 'vr', 6: 'za',
};

function renderDigest(data: {
  playerName: string; weekXP: number; totalXP: number; tier: string;
  weekCount: number; weekGoal: number; isComplete: boolean; bestWeek: number;
  attendPct: number | null; skillAreas: string; events: string[];
}): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#16A34A;padding:24px 28px;">
            <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:3px;">SKILLKAART</div>
            <div style="font-size:12px;color:#bbf7d0;margin-top:3px;">Wekelijkse update</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 28px 8px;">
            <h2 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#111827;">
              👋 Hoe gaat het met ${data.playerName}?
            </h2>
            <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">
              Dit was de week van ${data.playerName} op Skillkaart.
            </p>

            <!-- Streak -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="background:${data.isComplete ? '#f0fdf4' : '#fffbeb'};border-radius:12px;padding:16px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:28px;">${data.isComplete ? '🔥' : data.weekCount > 0 ? '💪' : '💤'}</span>
                    <div>
                      <div style="font-weight:800;color:#111827;font-size:15px;">
                        ${data.isComplete ? 'Weekdoel behaald! 🎉'
                        : data.weekCount > 0 ? data.weekCount + ' van ' + data.weekGoal + ' acties'
                        : 'Nog geen activiteit deze week'}
                      </div>
                      <div style="font-size:12px;color:#6b7280;margin-top:2px;">
                        Doel: ${data.weekGoal}x per week · Beste week: ${data.bestWeek}x
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Stats row -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="width:33%;text-align:center;padding:12px 4px;">
                  <div style="font-size:22px;font-weight:900;color:#111827;">${data.weekXP}</div>
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">XP deze week</div>
                </td>
                <td style="width:33%;text-align:center;padding:12px 4px;">
                  <div style="font-size:22px;font-weight:900;color:#111827;">${data.totalXP}</div>
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Totaal XP</div>
                </td>
                <td style="width:33%;text-align:center;padding:12px 4px;">
                  <div style="font-size:22px;font-weight:900;color:#111827;text-transform:capitalize;">${data.tier}</div>
                  <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Huidig niveau</div>
                </td>
              </tr>
            </table>

            ${data.attendPct !== null ? `
            <!-- Aanwezigheid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="background:#f9fafb;border-radius:12px;padding:12px 16px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:16px;">📅</span>
                    <span style="font-size:13px;color:#374151;">
                      Aanwezigheid: <strong>${data.attendPct}%</strong>
                    </span>
                  </div>
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Skills -->
            ${data.skillAreas ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="background:#f9fafb;border-radius:12px;padding:12px 16px;">
                  <div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;">🧬 Inzet-DNA</div>
                  <div style="font-size:13px;color:#374151;">${data.skillAreas}</div>
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Recente activiteit -->
            ${data.events.length > 0 ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td style="font-size:11px;font-weight:700;color:#6b7280;padding-bottom:8px;">📋 Activiteiten deze week</td>
              </tr>
              ${data.events.map(ev => `
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#374151;">• ${ev}</td>
              </tr>`).join('')}
            </table>
            ` : ''}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td align="center">
                  <a href="https://skillkaart.nl"
                     style="display:inline-block;background:#16A34A;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:50px;">
                    Open ouder-portaal →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:10px;color:#9ca3af;text-align:center;line-height:1.6;">
              Wekelijkse update van Skillkaart · <a href="https://skillkaart.nl" style="color:#16A34A;text-decoration:none;">Instellingen</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── RPC create (als ie nog niet bestaat) ───────────────────────────────────

async function ensureDigestRPC(db: ReturnType<typeof getAdminClient>): Promise<void> {
  try {
    await db.rpc('get_parent_weekly_digest', { p_parent_id: '00000000-0000-0000-0000-000000000000' });
  } catch {
    // RPC bestaat nog niet — maak hem aan via raw SQL (als service_role de rechten heeft)
    try {
      await db.rpc('exec_sql', {
        sql: `
        CREATE OR REPLACE FUNCTION get_parent_weekly_digest(p_parent_id UUID)
        RETURNS TABLE(
          player_id UUID, player_name TEXT,
          week_xp INT, total_xp INT, tier TEXT,
          week_count INT, week_goal INT, is_complete BOOLEAN, best_week INT,
          attend_pct NUMERIC, skill_areas TEXT, events TEXT[]
        )
        LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
        AS $$
        DECLARE
          v_week_start TEXT;
          v_team_id TEXT;
        BEGIN
          -- Koppeling ophalen
          SELECT pl.team_id INTO v_team_id FROM parent_links pl
          WHERE pl.parent_id = p_parent_id AND pl.verified = true
          LIMIT 1;
          IF NOT FOUND THEN RETURN; END IF;

          v_week_start := to_char(date_trunc('week', now()), 'YYYY-MM-DD');

          RETURN QUERY
          SELECT
            p.id, p.name::TEXT,
            COALESCE(wk.xp, 0)::INT, COALESCE(ps.total_xp, 0)::INT, COALESCE(ps.tier, 'brons')::TEXT,
            COALESCE(s.activities_count, 0)::INT, COALESCE(s.week_goal, 2)::INT,
            COALESCE(s.activities_count, 0) >= COALESCE(s.week_goal, 2),
            COALESCE(s.best_week_count, 0)::INT,
            ROUND(AVG(CASE WHEN a.present THEN 100 ELSE 0 END))::NUMERIC,
            CASE WHEN ps.total_xp > 0 THEN
              CONCAT('Consistentie ', ps.consistentie, '% · Werkethiek ', ps.werkethiek, '% · Techniek ', ps.techniek, '% · Focus ', ps.focus, '% · Teamspirit ', ps.team_spirit, '%')
            ELSE NULL END,
            ARRAY(
              SELECT CONCAT(e.event_type, '@', e.created_at) FROM stat_events e
              WHERE e.player_id = p.id AND e.created_at >= v_week_start::timestamptz
              ORDER BY e.created_at DESC LIMIT 10
            )
          FROM parent_links pl
          JOIN players p ON p.id = pl.player_id
          LEFT JOIN player_stats ps ON ps.player_id = p.id
          LEFT JOIN streaks s ON s.player_id = p.id
          LEFT JOIN attendance a ON a.player_id = p.id AND a.session_date >= v_week_start::timestamptz
          LEFT JOIN LATERAL (
            SELECT SUM(xp) as xp FROM stat_events se
            WHERE se.player_id = p.id AND se.created_at >= v_week_start::timestamptz
          ) wk ON true
          WHERE pl.parent_id = p_parent_id AND pl.verified = true
          GROUP BY p.id, p.name, ps.total_xp, ps.tier, ps.consistentie, ps.werkethiek, ps.techniek, ps.focus, ps.team_spirit, s.activities_count, s.week_goal, s.best_week_count, wk.xp;
        END;
        $$;
      ` } as unknown as Record<string, unknown>,
      );
    } catch { /* RPC bestaat al of DB heeft geen exec_sql — val terug */ }
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  // Vercel Cron roept dit endpoint aan met GET; handmatige/lokale tests met POST blijven ook werken.
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  if (!verifyCron(req.headers['authorization'])) {
    return res.status(401).json({ error: 'Ongeldige cron-token.' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY ontbreekt.' });

  const resend = new Resend(resendKey);
  const db = getAdminClient();

  try {
    // 1. Alle ouders met weekly_digest=true ophalen
    const { data: prefs } = await db
      .from('notification_prefs')
      .select('parent_id')
      .eq('weekly_digest', true);

    const parentIds = (prefs ?? []).map((p: { parent_id: string }) => p.parent_id);
    if (!parentIds.length) {
      return res.status(200).json({ ok: true, sent: 0, message: 'Geen ouders met digest-opt-in.' });
    }

    await ensureDigestRPC(db);

    let sent = 0;
    for (const parentId of parentIds) {
      try {
        // 2. Ouder email + data ophalen
        const { data: userRec } = await db.auth.admin.getUserById(parentId);
        const email = userRec?.user?.email;
        if (!email) continue;

        // 3. Digest data per speler
        const { data: digest } = await db.rpc('get_parent_weekly_digest', { p_parent_id: parentId });
        const rows = (digest ?? []) as Array<{
          player_id: string; player_name: string;
          week_xp: number; total_xp: number; tier: string;
          week_count: number; week_goal: number; is_complete: boolean; best_week: number;
          attend_pct: number | null; skill_areas: string | null; events: string[];
        }>;

        if (!rows.length) continue;

        // 4. Per speler een digest mail sturen (of 1 mail voor 1e kind als meerdere)
        const player = rows[0]; // eerste gekoppelde kind
        const eventLabels: Record<string, string> = {
          homework_done: '✅ Huiswerk ingeleverd',
          video_submitted: '🎥 Video ingestuurd',
          challenge_done: '🏆 Uitdaging voltooid',
          reflection: '💭 Reflectie gedeeld',
          teamspirit: '🤝 Teamspirit',
        };

        const formatted = (player.events ?? []).slice(0, 10).map((raw: string) => {
          const [type] = raw.split('@');
          return eventLabels[type] || `📢 ${type.replace(/_/g, ' ')}`;
        });

        await resend.emails.send({
          from: MAIL_FROM,
          to: [email],
          subject: `Skillkaart · De week van ${player.player_name}`,
          html: renderDigest({
            playerName: player.player_name,
            weekXP: player.week_xp,
            totalXP: player.total_xp,
            tier: player.tier,
            weekCount: player.week_count,
            weekGoal: player.week_goal,
            isComplete: player.is_complete,
            bestWeek: player.best_week,
            attendPct: player.attend_pct,
            skillAreas: player.skill_areas || '',
            events: formatted,
          }),
        });
        sent++;
      } catch {
        // Stil overslaan bij individuele fouten (1 ouder mag andere niet blokkeren)
        continue;
      }
    }

    return res.status(200).json({ ok: true, sent, parents: parentIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    return res.status(500).json({ error: message });
  }
}
