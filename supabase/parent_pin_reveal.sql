-- parent_pin_reveal.sql
-- Laat een geverifieerde ouder de pincode van het gekoppelde kind opvragen,
-- zonder dat de pincode ooit in leesbare vorm in de database staat.
-- Voer uit in Supabase SQL Editor.
--
-- Waarom: spelers (8-12 jr) loggen in met Team ID + 6-cijferige pincode
-- (zie AuthComponent.tsx). Tot nu toe kreeg alleen de coach die pincode te
-- zien (eenmalig, bij aanmaken/reset) en moest die zelf doorgeven — via
-- WhatsApp, papier of een losse CSV-export met alle namen+pincodes van het
-- team. Dat is een AVG-risico (kinderdata los verspreid) en geeft de ouder
-- geen controle. Omdat alleen pin_hash wordt bewaard (nooit de plain PIN),
-- kan een bestaande pincode niet worden "getoond" — elke weergave genereert
-- daarom een nieuwe pincode en maakt de vorige direct ongeldig. Dat is
-- bewust: het voorkomt dat een oude, mogelijk gelekte pincode blijft werken.
--
-- Toegang is beperkt tot een geverifieerde ouder-koppeling (parent_links,
-- verified = true) voor exact dat kind — zelfde koppeling als de bestaande
-- ouder-portaal flow (parent_link_flow.sql). Elke weergave/reset wordt
-- gelogd in parent_pin_access_log (zichtbaar voor de ouder zelf, voor
-- accountability conform AVG art. 5 lid 2).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Audit-log tabel ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_pin_access_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  parent_id  uuid NOT NULL,
  action     text NOT NULL DEFAULT 'reveal',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_pin_access_log_parent
  ON parent_pin_access_log(parent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_pin_access_log_player
  ON parent_pin_access_log(player_id, created_at DESC);

ALTER TABLE parent_pin_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_pin_access_log_select_own ON parent_pin_access_log;
CREATE POLICY parent_pin_access_log_select_own
  ON parent_pin_access_log FOR SELECT
  USING (parent_id = auth.uid());

-- Geen insert/update/delete-policy voor clients: alleen de SECURITY DEFINER
-- functie hieronder schrijft naar deze tabel.
REVOKE INSERT, UPDATE, DELETE ON parent_pin_access_log FROM authenticated, anon;
GRANT SELECT ON parent_pin_access_log TO authenticated;

-- ── 2. Pincode opvragen (= altijd een nieuwe genereren) ──────────────────────

DROP FUNCTION IF EXISTS parent_reveal_player_pin(uuid);

CREATE FUNCTION parent_reveal_player_pin(p_player_id uuid)
RETURNS TABLE(pin text, revealed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin  text;
  v_hash text;
  v_now  timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM parent_links
    WHERE player_id = p_player_id
      AND parent_id = auth.uid()
      AND verified   = true
  ) THEN
    RAISE EXCEPTION 'Geen geverifieerde koppeling met deze speler';
  END IF;

  -- Simpele anti-spam: max 1 nieuwe pincode per 5 seconden per ouder+kind,
  -- zodat een dubbelklik niet meteen de vorige pincode ongeldig maakt.
  IF EXISTS (
    SELECT 1 FROM parent_pin_access_log
    WHERE player_id = p_player_id
      AND parent_id = auth.uid()
      AND created_at > v_now - interval '5 seconds'
  ) THEN
    RAISE EXCEPTION 'Even geduld, probeer over een paar seconden opnieuw';
  END IF;

  v_pin  := (floor(random() * 900000) + 100000)::int::text;
  v_hash := encode(digest(v_pin || p_player_id::text, 'sha256'), 'hex');

  UPDATE players SET pin_hash = v_hash WHERE id = p_player_id;

  INSERT INTO parent_pin_access_log (player_id, parent_id, action)
  VALUES (p_player_id, auth.uid(), 'reveal');

  RETURN QUERY SELECT v_pin, v_now;
END;
$$;

REVOKE ALL ON FUNCTION parent_reveal_player_pin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION parent_reveal_player_pin(uuid) TO authenticated;
