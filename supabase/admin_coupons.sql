-- ================================================================
-- BUNDEL E — Couponcode-systeem (pro) + Stripe-koppeling
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- Vereist admin_superadmin.sql (is_superadmin).
-- ================================================================


-- 1. COUPONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code               text        UNIQUE NOT NULL,            -- altijd uppercase opslaan
  description        text,
  discount_type      text        NOT NULL DEFAULT 'percent'
                     CHECK (discount_type IN ('percent', 'fixed', 'free_trial')),
  discount_value     numeric     NOT NULL DEFAULT 0,         -- percent: 0-100 | fixed: euro | free_trial: dagen
  currency           text        NOT NULL DEFAULT 'eur',
  duration           text        NOT NULL DEFAULT 'once'
                     CHECK (duration IN ('once', 'repeating', 'forever')),
  duration_in_months int,
  max_redemptions    int,                                    -- null = onbeperkt
  per_user_limit     int         NOT NULL DEFAULT 1,
  redeemed_count     int         NOT NULL DEFAULT 0,
  active             boolean      NOT NULL DEFAULT true,
  expires_at         timestamptz,
  stripe_coupon_id   text,
  stripe_promo_id    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);


-- 2. REDEMPTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id          uuid        NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
  email              text,
  user_id            uuid,
  stripe_session_id  text,
  amount_discount    numeric,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_email_idx  ON coupon_redemptions (lower(email));


-- 3. RLS — superadmin beheert; redemptions read-only voor superadmin
-- ----------------------------------------------------------------
ALTER TABLE coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coupons_sa     ON coupons;
DROP POLICY IF EXISTS coupon_red_sa  ON coupon_redemptions;

CREATE POLICY coupons_sa    ON coupons            FOR ALL    TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
CREATE POLICY coupon_red_sa ON coupon_redemptions FOR SELECT TO authenticated USING (is_superadmin());

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 4. VALIDATIE-RPC (publiek aanroepbaar bij signup/upgrade)
-- ----------------------------------------------------------------
-- Geeft terug of een code geldig is, plus de kortingsdetails. Onthult
-- geen gevoelige data; codes zijn bedoeld om ingevoerd te worden.
CREATE OR REPLACE FUNCTION coupon_validate(p_code text, p_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c       coupons%ROWTYPE;
  used    int;
BEGIN
  SELECT * INTO c FROM coupons WHERE code = upper(trim(p_code)) AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  IF c.max_redemptions IS NOT NULL AND c.redeemed_count >= c.max_redemptions THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'max_redeemed');
  END IF;

  IF p_email IS NOT NULL AND c.per_user_limit IS NOT NULL THEN
    SELECT count(*) INTO used FROM coupon_redemptions r
    WHERE r.coupon_id = c.id AND lower(r.email) = lower(p_email);
    IF used >= c.per_user_limit THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'already_used');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', c.code,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'duration', c.duration,
    'currency', c.currency
  );
END;
$$;

REVOKE ALL ON FUNCTION coupon_validate(text, text) FROM public;
GRANT EXECUTE ON FUNCTION coupon_validate(text, text) TO anon, authenticated, service_role;


-- ================================================================
-- Klaar! Test:  SELECT coupon_validate('WELKOM10');
-- ================================================================
