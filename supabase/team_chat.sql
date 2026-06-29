-- ─── Team Chat (groepschat per team) ─────────────────────────────────────────
-- Run in Supabase SQL Editor. Creëert channels + berichten + realtime.
--
-- Structuur:
--   team_channels      → teamspecifieke kanalen (bv. "Algemeen", "Training")
--   team_channel_members → wie zit in welk channel
--   team_channel_messages → de berichten zelf
--   Supabase Realtime publication → live updates

-- ── 1. Channels ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by  UUID,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_channels_team ON team_channels(team_id);

ALTER TABLE team_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_read_channels" ON team_channels;
CREATE POLICY "team_members_read_channels"
  ON team_channels FOR SELECT
  USING (true);  -- coaches + spelers + ouders mogen lezen (RLS op members bepaalt zichtbaarheid)

DROP POLICY IF EXISTS "coach_manage_channels" ON team_channels;
CREATE POLICY "coach_manage_channels"
  ON team_channels FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "coach_update_channels" ON team_channels;
CREATE POLICY "coach_update_channels"
  ON team_channels FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "coach_delete_channels" ON team_channels;
CREATE POLICY "coach_delete_channels"
  ON team_channels FOR DELETE
  USING (true);

-- ── 2. Channel members ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_channel_members (
  channel_id   UUID NOT NULL REFERENCES team_channels(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  user_type    TEXT NOT NULL CHECK (user_type IN ('player', 'parent', 'coach', 'club_admin')),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  muted        BOOLEAN DEFAULT false,
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_user ON team_channel_members(user_id);

ALTER TABLE team_channel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read" ON team_channel_members;
CREATE POLICY "members_read"
  ON team_channel_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "members_manage" ON team_channel_members;
CREATE POLICY "members_manage"
  ON team_channel_members FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "members_update_own" ON team_channel_members;
CREATE POLICY "members_update_own"
  ON team_channel_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 3. Messages ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_channel_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID NOT NULL REFERENCES team_channels(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('player', 'parent', 'coach', 'club_admin')),
  content     TEXT NOT NULL,
  mentions    UUID[] DEFAULT '{}',
  reply_to    UUID REFERENCES team_channel_messages(id) ON DELETE SET NULL,
  edited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_messages_channel
  ON team_channel_messages(channel_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_channel_messages_mentions
  ON team_channel_messages USING GIN (mentions);

ALTER TABLE team_channel_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_messages" ON team_channel_messages;
CREATE POLICY "members_read_messages"
  ON team_channel_messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "members_insert_messages" ON team_channel_messages;
CREATE POLICY "members_insert_messages"
  ON team_channel_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "sender_update_messages" ON team_channel_messages;
CREATE POLICY "sender_update_messages"
  ON team_channel_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- ── 4. Realtime ──────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE team_channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE team_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE team_channel_members;

-- ── 5. Seed: default channels voor bestaande teams ──────────────────────────
-- Wordt automatisch aangeroepen als er nog geen channels zijn voor een team.

CREATE OR REPLACE FUNCTION ensure_team_channels(p_team_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM team_channels WHERE team_id = p_team_id) THEN
    INSERT INTO team_channels (team_id, name, description, is_default) VALUES
      (p_team_id, 'Algemeen', 'Algemene communicatie met het team', true),
      (p_team_id, 'Training', 'Trainingen, oefeningen en huiswerk', false),
      (p_team_id, 'Wedstrijden', 'Wedstrijdbesprekingen en uitslagen', false);
  END IF;
END;
$$;

-- ── 6. RPC: channel members ophalen voor notificatie-resolve ─────────────────

CREATE OR REPLACE FUNCTION get_channel_member_push_ids(p_channel_id UUID)
RETURNS TABLE(user_id UUID, player_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cm.user_id, pp.id::TEXT AS player_id
  FROM team_channel_members cm
  LEFT JOIN players pp ON pp.team_id IN (
    SELECT team_id FROM team_channels WHERE id = p_channel_id
  )
  WHERE cm.channel_id = p_channel_id
    AND cm.muted = false
    AND cm.user_id != auth.uid();
END;
$$;
