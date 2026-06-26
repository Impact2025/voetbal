-- parent_link_flow.sql
-- RPC functions voor ouder-koppeling vanuit coach én club-admin.
-- Voer uit in Supabase SQL Editor.

-- ── 1. Huidige koppelstatus opvragen ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_parent_link_status(p_player_id uuid)
RETURNS TABLE(
  link_code    text,
  expires_at   timestamptz,
  verified     boolean,
  parent_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      pl.link_code,
      pl.expires_at,
      pl.verified,
      u.email::text AS parent_email
    FROM parent_links pl
    LEFT JOIN auth.users u ON u.id = pl.parent_id
    WHERE pl.player_id = p_player_id
      AND (pl.verified = true OR pl.expires_at > now())
    ORDER BY pl.created_at DESC
    LIMIT 1;
END;
$$;

-- ── 2. Koppelcode genereren (of bestaande teruggeven) ────────────────────────

CREATE OR REPLACE FUNCTION generate_parent_link_code(p_player_id uuid, p_team_id text)
RETURNS TABLE(
  link_code    text,
  expires_at   timestamptz,
  verified     boolean,
  parent_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active boolean;
  v_code   text;
BEGIN
  -- Kijk of er al een actieve link is (verified of nog niet verlopen)
  SELECT EXISTS(
    SELECT 1 FROM parent_links
    WHERE player_id = p_player_id
      AND (verified = true OR expires_at > now())
  ) INTO v_active;

  IF v_active THEN
    RETURN QUERY SELECT * FROM get_parent_link_status(p_player_id);
    RETURN;
  END IF;

  -- Genereer unieke 6-char alfanumerieke code (hoofdletters + cijfers 2-9)
  LOOP
    SELECT string_agg(
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1),
      ''
    ) INTO v_code
    FROM generate_series(1, 6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM parent_links WHERE link_code = v_code);
  END LOOP;

  INSERT INTO parent_links (player_id, team_id, link_code)
  VALUES (p_player_id, p_team_id, v_code);

  RETURN QUERY SELECT * FROM get_parent_link_status(p_player_id);
END;
$$;

-- ── 3. Ouder ontkoppelen ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION unlink_parent(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM parent_links WHERE player_id = p_player_id;
END;
$$;
