-- ================================================================
-- Blog view-tracking — echte "Meest gelezen" i.p.v. keyword-proxy.
-- Uitvoeren in: Supabase Dashboard → SQL Editor (schema is Studio-beheerd).
-- Idempotent: veilig om meerdere keren te draaien.
-- ================================================================

-- 1. View-teller op blog_posts
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS blog_posts_views_idx
  ON blog_posts (view_count DESC);

-- 2. Atomische increment via RPC (SECURITY DEFINER: bypasst RLS, telt ook
--    anonieme lezers). Verhoogt alleen gepubliceerde posts en geeft de nieuwe
--    stand terug. Aangeroepen server-side vanuit /api/blog-page.
CREATE OR REPLACE FUNCTION increment_blog_view(p_slug text)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE blog_posts
     SET view_count = view_count + 1
   WHERE slug = p_slug AND status = 'published'
  RETURNING view_count;
$$;

-- Anon + authenticated mogen de teller ophogen (het is een publieke blog).
GRANT EXECUTE ON FUNCTION increment_blog_view(text) TO anon, authenticated;

-- ================================================================
-- Klaar! Test:  SELECT increment_blog_view('een-bestaande-slug');
--               SELECT slug, view_count FROM blog_posts ORDER BY view_count DESC;
-- ================================================================
