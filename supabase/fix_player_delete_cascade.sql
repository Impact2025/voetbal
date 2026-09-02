-- "Verwijderrecht" écht laten kloppen met de privacyverklaring.
-- Run in Supabase SQL Editor.
--
-- Waarom: PrivacyPolicy.tsx §5 belooft "bij verwijdering van een speler
-- worden alle bijbehorende gegevens direct gewist", maar Dashboard.tsx deed
-- alleen `DELETE FROM players`. Van alle tabellen die player_id vasthouden
-- had alleen parent_extras.sql een ON DELETE CASCADE — de rest (video-links,
-- AI-feedback, reflecties, streaks, chatberichten, notificatie-abonnementen)
-- bleef gewoon staan. Deze functie verwijdert alles in één transactie.
--
-- Alleen 'authenticated' (coaches/club_admin, echte Supabase-sessie) mag deze
-- aanroepen — zelfde model als secure_avatar_update.sql voor de players-tabel.

CREATE OR REPLACE FUNCTION public.delete_player_cascade(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM streaks                    WHERE player_id = p_player_id;
  DELETE FROM challenge_completions      WHERE player_id = p_player_id;
  DELETE FROM homework_submissions       WHERE player_id = p_player_id;
  DELETE FROM week_challenge_completions WHERE player_id = p_player_id;
  DELETE FROM player_stats               WHERE player_id = p_player_id;
  DELETE FROM stat_events                WHERE player_id = p_player_id;
  DELETE FROM player_push_subscriptions  WHERE player_id = p_player_id::text;
  DELETE FROM player_notifications       WHERE player_id = p_player_id::text;
  DELETE FROM parent_notifications       WHERE player_id = p_player_id;
  DELETE FROM parent_links               WHERE player_id = p_player_id;
  DELETE FROM team_channel_members       WHERE user_id = p_player_id AND user_type = 'player';
  DELETE FROM team_channel_messages      WHERE sender_id = p_player_id AND sender_role = 'player';

  DELETE FROM players WHERE id = p_player_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_player_cascade(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_player_cascade(uuid) TO authenticated;
