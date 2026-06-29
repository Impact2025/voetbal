-- ─── Parent Notifications Queue ─────────────────────────────────────────────
-- Run in Supabase SQL Editor. Creates:
--   1. parent_notifications table (queue for outbound emails)
--   2. Function + trigger on stat_events to auto-queue notifications
--   3. unsubscribe-based exclusions

-- ── 1. Queue table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL,
  team_id     TEXT NOT NULL,
  event_type  TEXT NOT NULL CHECK (event_type IN ('homework_done','video_submitted','challenge_done','inactivity_alert')),
  event_id    UUID,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent        BOOLEAN NOT NULL DEFAULT false,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_notifications_unsent
  ON parent_notifications(sent, created_at)
  WHERE sent = false;

CREATE INDEX IF NOT EXISTS idx_parent_notifications_player
  ON parent_notifications(player_id, created_at DESC);

ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON parent_notifications;
CREATE POLICY "service_role_all"
  ON parent_notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 2. Trigger function: auto-queue on relevant stat_events ─────────────────

CREATE OR REPLACE FUNCTION notify_parent_on_stat_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
  v_name  TEXT;
BEGIN
  -- Alleen bepaalde event types triggeren een ouder-notificatie
  IF NEW.event_type NOT IN ('homework_done', 'video_submitted', 'challenge_done') THEN
    RETURN NEW;
  END IF;

  -- Alleen als er een gekoppelde, geverifieerde ouder bestaat
  IF NOT EXISTS (
    SELECT 1 FROM parent_links pl
    WHERE pl.player_id = NEW.player_id
      AND pl.verified = true
      AND pl.parent_id IS NOT NULL
  ) THEN
    RETURN NEW;
  END IF;

  -- Bepaal titel en body op basis van event type
  CASE NEW.event_type
    WHEN 'homework_done' THEN
      v_title := '✅ Huiswerk ingeleverd';
      v_body  := 'Je kind heeft zijn of haar huiswerk ingeleverd.';
    WHEN 'video_submitted' THEN
      v_title := '🎥 Video ingestuurd';
      v_body  := 'Je kind heeft een trainingsvideo ingestuurd. Kijk mee en geef een compliment!';
    WHEN 'challenge_done' THEN
      v_title := '🏆 Uitdaging voltooid';
      v_body  := 'Je kind heeft een voetbal-uitdaging afgerond. Goed bezig!';
  END CASE;

  INSERT INTO parent_notifications (player_id, team_id, event_type, event_id, title, body)
  VALUES (NEW.player_id, NEW.team_id, NEW.event_type, NEW.id, v_title, v_body);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_parent_on_stat_event ON stat_events;
CREATE TRIGGER trg_notify_parent_on_stat_event
  AFTER INSERT ON stat_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_parent_on_stat_event();

-- ── 3. RPC: onverwerkte notificaties ophalen (voor cron) ────────────────────

CREATE OR REPLACE FUNCTION get_unsent_parent_notifications()
RETURNS TABLE(
  id            UUID,
  player_id     UUID,
  team_id       TEXT,
  event_type    TEXT,
  title         TEXT,
  body          TEXT,
  parent_email  TEXT,
  parent_id     UUID,
  player_name   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pn.id,
    pn.player_id,
    pn.team_id,
    pn.event_type,
    pn.title,
    pn.body,
    u.email::TEXT AS parent_email,
    pl.parent_id,
    pl2.name::TEXT AS player_name
  FROM parent_notifications pn
  JOIN parent_links pl ON pl.player_id = pn.player_id AND pl.verified = true AND pl.parent_id IS NOT NULL
  JOIN auth.users u ON u.id = pl.parent_id
  LEFT JOIN players pl2 ON pl2.id = pn.player_id
  WHERE pn.sent = false
  ORDER BY pn.created_at ASC
  LIMIT 100;
END;
$$;

-- ── 4. RPC: notificaties markeren als verstuurd ─────────────────────────────

CREATE OR REPLACE FUNCTION mark_notifications_sent(p_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE parent_notifications
  SET sent = true, sent_at = now()
  WHERE id = ANY(p_ids);
END;
$$;
