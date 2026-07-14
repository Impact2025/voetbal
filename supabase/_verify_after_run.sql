-- NALOOP-VERIFICATIE — plak in Supabase SQL-editor NA het runnen van
-- create_faq_items.sql + secure_avatar_update.sql.
-- Elke query hieronder moet minstens 1 regel teruggeven.

-- 1) FAQ: 20 vragen, allemaal gepubliceerd
select count(*) as faq_total        from faq_items;          -- verwacht: 20
select count(*) as faq_published    from faq_items where published = true;  -- verwacht: 20

-- 2) FAQ per categorie (moet kloppen met de landing-belofte "20+")
select category, count(*) as aantal
from faq_items
where published = true
group by category
order by category;  -- verwacht: club 6, coach 5, ouder 4, speler 5

-- 3) RLS policies: faq_read_published + players_update_self_avatar moeten bestaan
select schemaname, tablename, policyname, cmd, qual
from pg_policies
where tablename in ('faq_items', 'players')
order by tablename, policyname;

-- 4) Kolom avatar_config bestaat op players
select column_name, data_type
from information_schema.columns
where table_name = 'players' and column_name = 'avatar_config';  -- verwacht: 1 regel (jsonb)
