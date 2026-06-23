-- ================================================================
-- BUNDEL D — Blog + SEO
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- Vereist admin_superadmin.sql (is_superadmin).
-- ================================================================


-- 1. BLOG POSTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text        UNIQUE NOT NULL,
  title            text        NOT NULL DEFAULT '',
  excerpt          text        NOT NULL DEFAULT '',
  body             text        NOT NULL DEFAULT '',   -- HTML
  cover_image_url  text,
  category         text,
  meta_title       text,
  meta_description text,
  keywords         text[]      NOT NULL DEFAULT '{}',
  status           text        NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published')),
  seo_score        int         NOT NULL DEFAULT 0,
  author           text        NOT NULL DEFAULT 'Skillkaart',
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx    ON blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx      ON blog_posts (slug);


-- 2. RLS
-- ----------------------------------------------------------------
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Iedereen mag gepubliceerde posts lezen (publieke blog + SSR via service-role).
DROP POLICY IF EXISTS blog_public_read ON blog_posts;
CREATE POLICY blog_public_read ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Superadmin mag alles (ook drafts beheren). Staat naast de read-policy.
DROP POLICY IF EXISTS blog_superadmin_all ON blog_posts;
CREATE POLICY blog_superadmin_all ON blog_posts
  FOR ALL TO authenticated
  USING (is_superadmin()) WITH CHECK (is_superadmin());

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ================================================================
-- Klaar! Test:  SELECT slug, title, status FROM blog_posts;
-- ================================================================
