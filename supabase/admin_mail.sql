-- ================================================================
-- BUNDEL C — Mail-systeem (outbound + tracking)
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- Vereist admin_superadmin.sql (is_superadmin) en admin_crm.sql (crm_*).
-- ================================================================


-- 1. TEMPLATES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_templates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  subject    text        NOT NULL DEFAULT '',
  body       text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- 2. CAMPAGNES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_campaigns (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  subject          text        NOT NULL,
  body             text        NOT NULL,
  segment          text        NOT NULL DEFAULT 'coaches',
  segment_stage    text,                                  -- alleen voor segment 'crm'
  status           text        NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipients_count int         NOT NULL DEFAULT 0,
  sent_count       int         NOT NULL DEFAULT 0,
  opened_count     int         NOT NULL DEFAULT 0,
  clicked_count    int         NOT NULL DEFAULT 0,
  bounced_count    int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  sent_at          timestamptz
);


-- 3. SENDS (één rij per ontvanger)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_sends (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid        NOT NULL REFERENCES email_campaigns (id) ON DELETE CASCADE,
  email       text        NOT NULL,
  name        text,
  status      text        NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued', 'sent', 'failed', 'bounced')),
  provider_id text,                                       -- Resend email id (voor webhook-matching)
  error       text,
  opened_at   timestamptz,
  clicked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_sends_campaign_idx  ON email_sends (campaign_id);
CREATE INDEX IF NOT EXISTS email_sends_provider_idx  ON email_sends (provider_id);


-- 4. EVENTS (append-only log van webhook-gebeurtenissen)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id     uuid        REFERENCES email_sends (id) ON DELETE CASCADE,
  campaign_id uuid,
  type        text        NOT NULL,
  meta        jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- 5. UNSUBSCRIBES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  email      text        PRIMARY KEY,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- 6. RLS — superadmin leest/schrijft; server (service_role) omzeilt RLS
-- ----------------------------------------------------------------
ALTER TABLE email_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends        ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_templates_sa    ON email_templates;
DROP POLICY IF EXISTS email_campaigns_sa    ON email_campaigns;
DROP POLICY IF EXISTS email_sends_sa        ON email_sends;
DROP POLICY IF EXISTS email_events_sa       ON email_events;
DROP POLICY IF EXISTS email_unsubs_sa       ON email_unsubscribes;

CREATE POLICY email_templates_sa ON email_templates FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
CREATE POLICY email_campaigns_sa ON email_campaigns FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
CREATE POLICY email_sends_sa     ON email_sends     FOR SELECT TO authenticated USING (is_superadmin());
CREATE POLICY email_events_sa    ON email_events    FOR SELECT TO authenticated USING (is_superadmin());
CREATE POLICY email_unsubs_sa    ON email_unsubscribes FOR SELECT TO authenticated USING (is_superadmin());

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON email_templates;
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 7. ONTVANGERS OPLOSSEN (segment → e-mails), minus afmeldingen
-- ----------------------------------------------------------------
-- Gebruikt door de UI (aantal/preview) én door de server (versturen).
CREATE OR REPLACE FUNCTION email_resolve_recipients(p_segment text, p_stage text DEFAULT NULL)
RETURNS TABLE(email text, name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT (is_superadmin() OR coalesce(auth.role(), '') = 'service_role') THEN
    RAISE EXCEPTION 'Geen toegang: superadmin vereist.';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT p.email::text AS email,
           coalesce(nullif(split_part(p.email, '@', 1), ''), 'Coach') AS name
    FROM profiles p
    WHERE p.email IS NOT NULL
      AND (
        (p_segment = 'coaches'     AND p.role = 'coach') OR
        (p_segment = 'club_admins' AND p.role = 'club_admin') OR
        (p_segment = 'parents'     AND p.role = 'parent') OR
        (p_segment = 'all_staff'   AND p.role IN ('coach', 'club_admin'))
      )
    UNION
    SELECT c.email::text, coalesce(nullif(c.name, ''), 'Contact')
    FROM crm_contacts c
    JOIN crm_accounts a ON a.id = c.account_id
    WHERE p_segment = 'crm'
      AND c.email IS NOT NULL
      AND (p_stage IS NULL OR a.stage = p_stage)
  )
  SELECT DISTINCT b.email, b.name
  FROM base b
  WHERE NOT EXISTS (
    SELECT 1 FROM email_unsubscribes u WHERE lower(u.email) = lower(b.email)
  );
END;
$$;

REVOKE ALL ON FUNCTION email_resolve_recipients(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION email_resolve_recipients(text, text) TO authenticated, service_role;


-- ================================================================
-- Klaar! Test:  SELECT * FROM email_resolve_recipients('coaches');
-- ================================================================
