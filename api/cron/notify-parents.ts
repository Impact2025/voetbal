import { Resend } from 'resend';
import webpush from 'web-push';
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

// ─── Email render ────────────────────────────────────────────────────────────

const EVENT_EMOJI: Record<string, string> = {
  homework_done: '✅',
  video_submitted: '🎥',
  challenge_done: '🏆',
  inactivity_alert: '⚠️',
};

const EVENT_COLOR: Record<string, string> = {
  homework_done: '#16A34A',
  video_submitted: '#2563EB',
  challenge_done: '#D97706',
  inactivity_alert: '#DC2626',
};

function renderEmail(notifications: {
  title: string; body: string; event_type: string; player_name: string;
}[]): string {
  const items = notifications.map((n) => {
    const emoji = EVENT_EMOJI[n.event_type] ?? '📢';
    const color = EVENT_COLOR[n.event_type] ?? '#16A34A';
    return `
    <tr>
      <td style="padding:12px 20px;border-left:3px solid ${color};background:#f9fafb;border-radius:8px;margin-bottom:8px;display:block;">
        <div style="font-size:24px;margin-bottom:4px;">${emoji}</div>
        <div style="font-weight:700;color:#111827;font-size:15px;">${n.title}</div>
        <div style="color:#6b7280;font-size:13px;margin-top:2px;">${n.body}</div>
        <div style="color:#9ca3af;font-size:11px;margin-top:4px;">${n.player_name}</div>
      </td>
    </tr>`;
  }).join('');

  const multiple = notifications.length > 1;

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
            <div style="font-size:12px;color:#bbf7d0;margin-top:3px;">
              ${multiple ? `${notifications.length} nieuwe updates` : 'Nieuwe activiteit'}
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 28px 8px;">
            <h2 style="margin:0 0 6px;font-size:18px;font-weight:800;color:#111827;">
              ${multiple ? 'Voortgangsupdate' : 'Je kind was actief! 👟'}
            </h2>
            <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
              ${multiple
                ? `${notifications[0].player_name} was actief op Skillkaart. Hier zijn de laatste updates:`
                : `${notifications[0].player_name} is actief geweest op Skillkaart.`
              }
            </p>

            ${items}

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td align="center">
                  <a href="https://skillkaart.nl"
                     style="display:inline-block;background:#16A34A;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:50px;">
                    Open Skillkaart →
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
              Je ontvangt deze mail omdat je als ouder bent gekoppeld aan Skillkaart.<br>
              <a href="https://skillkaart.nl" style="color:#16A34A;text-decoration:none;">Instellingen wijzigen</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  // Vercel Cron roept dit endpoint aan met GET; handmatige/lokale tests met POST blijven ook werken.
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  // Alleen Vercel Cron mag dit endpoint aanroepen
  if (!verifyCron(req.headers['authorization'])) {
    return res.status(401).json({ error: 'Ongeldige cron-token.' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY ontbreekt.' });
  }
  const resend = new Resend(resendKey);
  const db = getAdminClient();

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const pushEnabled = !!(vapidPublic && vapidPrivate);
  if (pushEnabled) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL || 'noreply@skillkaart.app'}`,
      vapidPublic!,
      vapidPrivate!,
    );
  }

  try {
    // 1. Onverwerkte notificaties ophalen (via RPC)
    const { data: unsent, error: fetchErr } = await db.rpc('get_unsent_parent_notifications');
    if (fetchErr) {
      return res.status(500).json({ error: `RPC-fout: ${fetchErr.message}` });
    }

    const rows = (unsent ?? []) as Array<{
      id: string; player_id: string; team_id: string;
      event_type: string; title: string; body: string;
      parent_email: string; parent_id: string; player_name: string;
    }>;

    if (!rows.length) {
      return res.status(200).json({ ok: true, processed: 0, message: 'Geen notificaties.' });
    }

    // 2. Groepeer per ouder (één email per ouder met alle meldingen)
    const byParent = new Map<string, typeof rows>();
    for (const row of rows) {
      const existing = byParent.get(row.parent_email) ?? [];
      existing.push(row);
      byParent.set(row.parent_email, existing);
    }

    // 3. Check notification_prefs — stuur alleen als critical_alerts aan staat
    const parentIds = [...new Set(rows.map(r => r.parent_id))];
    const { data: prefs } = await db
      .from('notification_prefs')
      .select('parent_id, critical_alerts, channel')
      .in('parent_id', parentIds);

    const optOut = new Set(
      (prefs ?? [])
        .filter((p: { critical_alerts: boolean }) => p.critical_alerts === false)
        .map((p: { parent_id: string }) => p.parent_id),
    );
    const channelByParent = new Map(
      (prefs ?? []).map((p: { parent_id: string; channel: string }) => [p.parent_id, p.channel]),
    );

    let sent = 0;
    let skipped = 0;
    let pushed = 0;
    const allIds: string[] = [];

    for (const email of [...byParent.keys()]) {
      const group = byParent.get(email)!;
      allIds.push(...group.map(r => r.id));

      // Check opt-out
      const parentOptOut = group.some(r => optOut.has(r.parent_id));
      if (parentOptOut) {
        skipped += group.length;
        continue;
      }

      const parentId = group[0]!.parent_id;
      const channel = channelByParent.get(parentId) ?? 'email';
      const playerName = group[0]?.player_name || 'Je kind';

      if (channel === 'email' || channel === 'both') {
        try {
          await resend.emails.send({
            from: MAIL_FROM,
            to: [email],
            subject: `Skillkaart · ${playerName} was actief 👟`,
            html: renderEmail(group.map(r => ({
              title: r.title,
              body: r.body,
              event_type: r.event_type,
              player_name: r.player_name || 'Je kind',
            }))),
          });
          sent += group.length;
        } catch {
          skipped += group.length;
        }
      }

      if (pushEnabled && (channel === 'push' || channel === 'both')) {
        try {
          const { data: subs } = await db
            .from('parent_push_subscriptions')
            .select('subscription')
            .eq('parent_id', parentId);

          const title = group.length > 1 ? `${playerName} was actief 👟` : group[0]!.title;
          const body = group.length > 1
            ? `${group.length} nieuwe updates — bekijk ze in Skillkaart`
            : group[0]!.body;

          await Promise.allSettled(
            (subs ?? []).map((s: { subscription: object }) =>
              webpush.sendNotification(
                s.subscription as webpush.PushSubscription,
                JSON.stringify({ title, body, url: 'https://skillkaart.nl' }),
              ),
            ),
          );
          pushed += 1;
        } catch {
          // Push-fout blokkeert de e-mail-flow niet
        }
      }
    }

    // 4. Markeer als verstuurd
    if (allIds.length > 0) {
      await db.rpc('mark_notifications_sent', { p_ids: allIds });
    }

    return res.status(200).json({
      ok: true,
      total: rows.length,
      sent,
      pushed,
      skipped,
      parents: byParent.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    return res.status(500).json({ error: message });
  }
}
