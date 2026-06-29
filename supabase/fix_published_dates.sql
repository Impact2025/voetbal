-- =============================================================
-- SKILLKAART: published_at updaten naar echte datums (jan-jun 2026)
-- Gegenereerd: 2026-06-29
-- =============================================================

UPDATE blog_posts SET published_at = '2026-01-15T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'wat-kost-skillkaart-voor-een-voetbalclub';
UPDATE blog_posts SET published_at = '2026-01-22T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'hoeveel-tijd-kost-een-evaluatie-op-skillkaart';
UPDATE blog_posts SET published_at = '2026-01-28T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'hoe-krijg-ik-als-ouder-toegang-tot-skillkaart';
UPDATE blog_posts SET published_at = '2026-02-03T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'hoeveel-teams-toevoegen-skillkaart';
UPDATE blog_posts SET published_at = '2026-02-10T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'wat-betekenen-de-radardiagrammen';
UPDATE blog_posts SET published_at = '2026-02-18T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'hoe-werkt-de-ai-feedback-precies';
UPDATE blog_posts SET published_at = '2026-02-25T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'wat-ziet-mijn-kind-in-het-skillkaart-dashboard';
UPDATE blog_posts SET published_at = '2026-03-05T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'hoe-log-ik-in-op-skillkaart-met-mijn-pincode';
UPDATE blog_posts SET published_at = '2026-03-12T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'skillkaart-avg-privacy-jeugdspelers';
UPDATE blog_posts SET published_at = '2026-03-18T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'hoe-verdien-ik-xp-en-stijg-ik-in-level';
UPDATE blog_posts SET published_at = '2026-03-25T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'wat-zijn-de-7-kernskills-die-skillkaart-meet';
UPDATE blog_posts SET published_at = '2026-04-01T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'ontvang-ik-als-ouder-wekelijkse-rapportages';
UPDATE blog_posts SET published_at = '2026-04-08T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'skillkaart-pilot-starten-in-je-club';
UPDATE blog_posts SET published_at = '2026-04-15T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'gamificatie-jeugdvoetbal-training-motivatie';
UPDATE blog_posts SET published_at = '2026-04-22T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'trainingsmentaliteit-ontwikkelen-jeugdvoetbal';
UPDATE blog_posts SET published_at = '2026-04-22T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'wat-zijn-huiswerkopdrachten-en-hoe-doe-ik-ze';
UPDATE blog_posts SET published_at = '2026-04-29T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'kan-ik-als-trainer-trainingsplannen-laten-genereren';
UPDATE blog_posts SET published_at = '2026-05-06T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'hoe-veilig-zijn-de-gegevens-van-mijn-kind';
UPDATE blog_posts SET published_at = '2026-05-07T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'ouderbetrokkenheid-jeugdvoetbal-tips';
UPDATE blog_posts SET published_at = '2026-05-14T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'radarchart-spelersontwikkeling-coach';
UPDATE blog_posts SET published_at = '2026-05-21T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'skillkaart-aanpassen-clubkleuren-branding';
UPDATE blog_posts SET published_at = '2026-05-28T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'ai-in-jeugdvoetbal-kansen-trainer';
UPDATE blog_posts SET published_at = '2026-06-03T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'werkt-skillkaart-ook-op-mijn-telefoon';
UPDATE blog_posts SET published_at = '2026-06-05T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'avg-privacy-jeugdvoetbalclub-wat-mag-wel';
UPDATE blog_posts SET published_at = '2026-06-10T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'verschil-skillkaart-knvb-rinus-vton';
UPDATE blog_posts SET published_at = '2026-06-17T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'wat-is-een-skillkaart-jeugdvoetbal';
UPDATE blog_posts SET published_at = '2026-06-17T09:00:00Z'::timestamptz, updated_at = now() WHERE slug = 'kan-ik-mijn-skillkaart-profielkaart-delen';


-- Cover images voor alle artikelen
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/wat-kost-skillkaart-voor-een-voetbalclub.jpg', updated_at = now() WHERE slug = 'wat-kost-skillkaart-voor-een-voetbalclub' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/hoeveel-tijd-kost-een-evaluatie-op-skillkaart.jpg', updated_at = now() WHERE slug = 'hoeveel-tijd-kost-een-evaluatie-op-skillkaart' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/hoe-krijg-ik-als-ouder-toegang-tot-skillkaart.jpg', updated_at = now() WHERE slug = 'hoe-krijg-ik-als-ouder-toegang-tot-skillkaart' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/hoeveel-teams-toevoegen-skillkaart.jpg', updated_at = now() WHERE slug = 'hoeveel-teams-toevoegen-skillkaart' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/wat-betekenen-de-radardiagrammen.jpg', updated_at = now() WHERE slug = 'wat-betekenen-de-radardiagrammen' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/hoe-werkt-de-ai-feedback-precies.jpg', updated_at = now() WHERE slug = 'hoe-werkt-de-ai-feedback-precies' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/wat-ziet-mijn-kind-in-het-skillkaart-dashboard.jpg', updated_at = now() WHERE slug = 'wat-ziet-mijn-kind-in-het-skillkaart-dashboard' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/hoe-log-ik-in-op-skillkaart-met-mijn-pincode.jpg', updated_at = now() WHERE slug = 'hoe-log-ik-in-op-skillkaart-met-mijn-pincode' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/skillkaart-avg-privacy-jeugdspelers.jpg', updated_at = now() WHERE slug = 'skillkaart-avg-privacy-jeugdspelers' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/hoe-verdien-ik-xp-en-stijg-ik-in-level.jpg', updated_at = now() WHERE slug = 'hoe-verdien-ik-xp-en-stijg-ik-in-level' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/wat-zijn-de-7-kernskills-die-skillkaart-meet.jpg', updated_at = now() WHERE slug = 'wat-zijn-de-7-kernskills-die-skillkaart-meet' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/ontvang-ik-als-ouder-wekelijkse-rapportages.jpg', updated_at = now() WHERE slug = 'ontvang-ik-als-ouder-wekelijkse-rapportages' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/skillkaart-pilot-starten-in-je-club.jpg', updated_at = now() WHERE slug = 'skillkaart-pilot-starten-in-je-club' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/gamificatie-jeugdvoetbal-training-motivatie.jpg', updated_at = now() WHERE slug = 'gamificatie-jeugdvoetbal-training-motivatie' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/trainingsmentaliteit-ontwikkelen-jeugdvoetbal.jpg', updated_at = now() WHERE slug = 'trainingsmentaliteit-ontwikkelen-jeugdvoetbal' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/wat-zijn-huiswerkopdrachten-en-hoe-doe-ik-ze.jpg', updated_at = now() WHERE slug = 'wat-zijn-huiswerkopdrachten-en-hoe-doe-ik-ze' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/kan-ik-als-trainer-trainingsplannen-laten-genereren.jpg', updated_at = now() WHERE slug = 'kan-ik-als-trainer-trainingsplannen-laten-genereren' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/hoe-veilig-zijn-de-gegevens-van-mijn-kind.jpg', updated_at = now() WHERE slug = 'hoe-veilig-zijn-de-gegevens-van-mijn-kind' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/ouderbetrokkenheid-jeugdvoetbal-tips.jpg', updated_at = now() WHERE slug = 'ouderbetrokkenheid-jeugdvoetbal-tips' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/radarchart-spelersontwikkeling-coach.jpg', updated_at = now() WHERE slug = 'radarchart-spelersontwikkeling-coach' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/skillkaart-aanpassen-clubkleuren-branding.jpg', updated_at = now() WHERE slug = 'skillkaart-aanpassen-clubkleuren-branding' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/ai-in-jeugdvoetbal-kansen-trainer.jpg', updated_at = now() WHERE slug = 'ai-in-jeugdvoetbal-kansen-trainer' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/werkt-skillkaart-ook-op-mijn-telefoon.jpg', updated_at = now() WHERE slug = 'werkt-skillkaart-ook-op-mijn-telefoon' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/avg-privacy-jeugdvoetbalclub-wat-mag-wel.jpg', updated_at = now() WHERE slug = 'avg-privacy-jeugdvoetbalclub-wat-mag-wel' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/verschil-skillkaart-knvb-rinus-vton.jpg', updated_at = now() WHERE slug = 'verschil-skillkaart-knvb-rinus-vton' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/wat-is-een-skillkaart-jeugdvoetbal.jpg', updated_at = now() WHERE slug = 'wat-is-een-skillkaart-jeugdvoetbal' AND cover_image_url IS NULL;
UPDATE blog_posts SET cover_image_url = 'https://www.skillkaart.nl/og/kan-ik-mijn-skillkaart-profielkaart-delen.jpg', updated_at = now() WHERE slug = 'kan-ik-mijn-skillkaart-profielkaart-delen' AND cover_image_url IS NULL;