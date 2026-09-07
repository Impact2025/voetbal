-- ================================================================
-- Geboortejaar i.p.v. handmatige leeftijd
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================
-- players.age moest tot nu toe elk seizoen handmatig bijgewerkt worden.
-- birth_year is stabiel: de app berekent de actuele leeftijd/leeftijdscategorie
-- (O8..O12) er zelf uit (zie src/lib/playerAge.ts), zodat dit nooit meer
-- verouderd raakt. Het bestaande age-veld blijft bestaan als fallback voor
-- spelers die nog geen geboortejaar hebben.

ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_year integer;

-- Eenmalige backfill: schat het geboortejaar uit de bestaande leeftijd
-- (huidig kalenderjaar - leeftijd). Alleen voor rijen die nog geen
-- birth_year hebben en een numerieke age-waarde bevatten.
UPDATE players
SET birth_year = EXTRACT(YEAR FROM now())::int - age::int
WHERE birth_year IS NULL
  AND age ~ '^[0-9]+$';

-- ================================================================
-- Controleer via:
--   SELECT id, name, age, birth_year FROM players ORDER BY name LIMIT 20;
-- ================================================================
