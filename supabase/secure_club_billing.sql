-- ═══════════════════════════════════════════════════════════════════════════
-- Beveiliging club-billing + durable rate limiting (run in SQL Editor)
--
-- Aanleiding: clubs.subscription_tier was door elke ingelogde gebruiker met
-- schrijfrecht op clubs te wijzigen (setClubProStatus in de client), waardoor
-- PRO gratis te activeren was zonder Stripe-betaling. Vanaf nu mag alleen de
-- service-role (Vercel serverless: Stripe-webhook en superadmin-endpoint) de
-- billing-kolommen aanpassen.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Stripe-koppelkolommen zodat de webhook een subscription aan een club
--    kan relateren (upgrade bij checkout, downgrade bij opzegging).
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
CREATE INDEX IF NOT EXISTS clubs_stripe_subscription_idx ON clubs (stripe_subscription_id);

-- 2. Trigger: blokkeer wijziging van billing-kolommen door niet-service-role
--    sessies. Werkt ook als een RLS-policy per ongeluk te ruim staat, en dekt
--    alle toekomstige client-side code af.
CREATE OR REPLACE FUNCTION protect_club_billing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (
    NEW.subscription_tier      IS DISTINCT FROM OLD.subscription_tier OR
    NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id OR
    NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
  ) AND current_setting('request.jwt.claims', true)::jsonb->>'role' IS DISTINCT FROM 'service_role'
    AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
  THEN
    RAISE EXCEPTION 'Billing-velden kunnen alleen via de server worden aangepast.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_club_billing_trigger ON clubs;
CREATE TRIGGER protect_club_billing_trigger
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION protect_club_billing();

-- 3. Durable rate-limiting voor serverless endpoints (api/_lib/rateLimit.ts).
--    Alleen de service-role leest/schrijft hier; geen client-toegang.
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_rate_limits_key_time_idx ON api_rate_limits (key, created_at DESC);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
-- Géén policies: alleen service-role (omzeilt RLS) kan erbij.

-- 4. Controle achteraf:
--    UPDATE clubs SET subscription_tier = 'pro' WHERE id = '<club>';  -- als authenticated → hoort te falen
--    SELECT * FROM api_rate_limits LIMIT 1;                            -- als anon → hoort leeg/geweigerd te zijn
