-- Sluit de teamchat-tabellen af voor directe client-toegang.
-- Run in Supabase SQL Editor.
--
-- Waarom: team_chat.sql zette RLS aan maar met policies `USING (true)` /
-- `WITH CHECK (true)` op alle drie tabellen — dat is geen bescherming.
-- Elke ingelogde (of zelfs anonieme) client kon zo alle teamchats van alle
-- clubs lezen, zichzelf aan willekeurige kanalen toevoegen en berichten
-- invoegen namens om het even wie. Spelers hebben bovendien geen
-- Supabase-sessie (PIN-login), dus RLS op auth.uid() kan hun toegang sowieso
-- nooit afdwingen.
--
-- Nieuwe aanpak: alle lees/schrijfacties lopen voortaan via het serverless
-- endpoint /api/team-chat (api/team-chat.ts), dat per aanvraag verifieert of
-- de aanroeper daadwerkelijk lid is van het team achter het kanaal, en
-- vervolgens de service-role key gebruikt (die RLS omzeilt). Met RLS aan en
-- zonder policies is directe toegang via de anon/authenticated rol daarna
-- volledig dicht — precies wat we willen.

DROP POLICY IF EXISTS "team_members_read_channels" ON team_channels;
DROP POLICY IF EXISTS "coach_manage_channels"       ON team_channels;
DROP POLICY IF EXISTS "coach_update_channels"       ON team_channels;
DROP POLICY IF EXISTS "coach_delete_channels"       ON team_channels;

DROP POLICY IF EXISTS "members_read"        ON team_channel_members;
DROP POLICY IF EXISTS "members_manage"      ON team_channel_members;
DROP POLICY IF EXISTS "members_update_own"  ON team_channel_members;

DROP POLICY IF EXISTS "members_read_messages"    ON team_channel_messages;
DROP POLICY IF EXISTS "members_insert_messages"  ON team_channel_messages;
DROP POLICY IF EXISTS "sender_update_messages"   ON team_channel_messages;

-- RLS staat al aan (uit team_chat.sql); zonder policies is elke rij ontoegankelijk
-- voor de anon/authenticated rol. De service-role key (gebruikt door
-- api/team-chat.ts) omzeilt RLS en blijft dus gewoon werken.
ALTER TABLE team_channels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_channel_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_channel_messages  ENABLE ROW LEVEL SECURITY;

-- Client-side Supabase Realtime (postgres_changes) leunt op dezelfde RLS en
-- levert dus geen rijen meer aan de browser — dat is bedoeld. De client
-- pollt voortaan via /api/team-chat (zie src/lib/teamChat.ts) in plaats van
-- een directe realtime-subscription. DO-block zodat dit niet faalt als een
-- tabel (nog) niet in de publication zat.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE team_channel_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE team_channels;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE team_channel_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
