-- Zet de 'homework-videos' bucket privé en sluit directe client-toegang af.
-- Run in Supabase SQL Editor.
--
-- Waarom: video's van huiswerk- en challenge-opdrachten van kinderen (7-12
-- jaar) stonden via getPublicUrl() op een publieke, voorspelbaar-padige URL —
-- geen login nodig om te bekijken. Uploads en downloads lopen voortaan via
-- /api/media (api/media.ts), dat na een server-side teamlidmaatschap-check
-- een kortlevende signed URL/upload-token uitgeeft (createSignedUploadUrl /
-- createSignedUrl) — dat mechanisme werkt op een privé bucket en heeft geen
-- client-facing storage-policies nodig.

UPDATE storage.buckets SET public = false WHERE id = 'homework-videos';

-- Verwijder eventuele bestaande permissieve policies op deze bucket zodat
-- alléén de service-role (gebruikt door /api/media, die RLS omzeilt) er nog
-- bij kan. Past de standaard Supabase policy-namen aan; onbekende namen
-- worden genegeerd door IF EXISTS.
DROP POLICY IF EXISTS "Public read homework-videos"                 ON storage.objects;
DROP POLICY IF EXISTS "Public Access"                                ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload homework videos"           ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view homework videos"             ON storage.objects;
DROP POLICY IF EXISTS "authenticated can upload homework-videos"    ON storage.objects;

-- Geen policies meer voor de anon/authenticated rol op deze bucket → met RLS
-- aan (standaard voor storage.objects) is directe toegang via de browser-key
-- dan volledig dicht. Alleen de service-role key (server-side) en signed
-- URLs/tokens blijven werken.
