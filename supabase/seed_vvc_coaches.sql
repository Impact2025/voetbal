-- VVC: trainers/teammanagers klaarzetten als 'invited' (GEEN mail verstuurd door deze migratie).
-- Club-admin verstuurt de daadwerkelijke uitnodiging zelf via Trainers-tabblad in de app.
-- Run in Supabase SQL Editor. Idempotent via WHERE NOT EXISTS (team_coaches heeft geen
-- unique constraint op team_id+email om op te ON CONFLICT-en).

INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-1', 'VVC', NULL, 't.g.9@hotmail.com', 'head', 'invited', '4110fcd4-a0f0-42d2-95fb-4729955220d1', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-1' AND email = 't.g.9@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-1', 'VVC', NULL, 'heaventienstra58@msn.com', 'assistant', 'invited', 'a241c617-75f2-4236-b251-01a1bdccdec4', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-1' AND email = 'heaventienstra58@msn.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-2', 'VVC', NULL, 'vanesveld654@hotmail.com', 'assistant', 'invited', 'e7706af2-7149-412c-8839-3de1730ed527', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-2' AND email = 'vanesveld654@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-2', 'VVC', NULL, 'jim.van.rijn72@gmail.com', 'head', 'invited', 'edbeddbf-27a0-464f-845f-123fa4924e6c', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-2' AND email = 'jim.van.rijn72@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-3', 'VVC', NULL, 'medorre@gmail.com', 'head', 'invited', 'c92f9d7c-1a37-4288-b66c-966012a9567c', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-3' AND email = 'medorre@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-4', 'VVC', NULL, 'timo_splinter@hotmail.com', 'assistant', 'invited', 'd93e4a56-26ea-4777-bebd-f72a88468b92', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-4' AND email = 'timo_splinter@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-4', 'VVC', NULL, 'jbgroenewegen@hotmail.com', 'head', 'invited', 'c52313e3-564a-438d-bdf8-9c9ccada9d3d', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-4' AND email = 'jbgroenewegen@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-4', 'VVC', NULL, 'lizzy.roest@icloud.com', 'assistant', 'invited', 'e3d03c92-3064-48ae-858b-2c334e2e551b', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-4' AND email = 'lizzy.roest@icloud.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-5', 'VVC', NULL, 'javibus8@gmail.com', 'head', 'invited', 'd0550d25-ed43-4c05-9c57-c214b23ee1cf', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-5' AND email = 'javibus8@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-5', 'VVC', NULL, 's.debock@hotmail.com', 'assistant', 'invited', 'f9f271f4-837a-4cac-ab33-0617f5df18fe', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-5' AND email = 's.debock@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO8-6', 'VVC', NULL, 'florian_spierenburg@hotmail.com', 'assistant', 'invited', '400e123e-a3f3-419e-8947-89c7d7b24e7a', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO8-6' AND email = 'florian_spierenburg@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO9-1', 'VVC', NULL, 'benthe.de.wit@ziggo.nl', 'head', 'invited', 'a6d421cf-8842-4ce2-a4fe-54115d5931d3', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO9-1' AND email = 'benthe.de.wit@ziggo.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO9-1', 'VVC', NULL, 'vonk_patrick@hotmail.com', 'assistant', 'invited', '8a3a3eed-2d04-4371-8126-8b6637e655f6', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO9-1' AND email = 'vonk_patrick@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO9-2', 'VVC', NULL, 'stouwer@hotmail.com', 'head', 'invited', '6ab93d58-1b69-46d3-a7eb-133ac8db7cd6', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO9-2' AND email = 'stouwer@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO9-3', 'VVC', NULL, 'mishawijnands@hotmail.com', 'head', 'invited', 'a3d5ee43-c615-4e80-9cf4-9254654cafb1', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO9-3' AND email = 'mishawijnands@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO9-4', 'VVC', NULL, 'vpieroelie@hotmail.com', 'assistant', 'invited', '2ad231ce-4c65-45c8-a219-d1ec8cb0b6d7', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO9-4' AND email = 'vpieroelie@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO9-4', 'VVC', NULL, 'remcowijnhout84@gmail.com', 'head', 'invited', 'e5c4d412-f212-4c34-af1d-a1b35f1c3f25', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO9-4' AND email = 'remcowijnhout84@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO9-5', 'VVC', NULL, 'yacob.sason@gmail.com', 'head', 'invited', '82f28a56-6803-48c6-a49d-d37523213b6d', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO9-5' AND email = 'yacob.sason@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-1', 'VVC', NULL, 'bklootwijk@hotmail.com', 'assistant', 'invited', 'bbfed839-958e-4ca5-a643-e62911fe5277', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-1' AND email = 'bklootwijk@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-1', 'VVC', NULL, 'karsten.elfferich@outlook.com', 'head', 'invited', '917ed1d6-ad4c-48ea-ad00-e221e8b2f83a', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-1' AND email = 'karsten.elfferich@outlook.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-2', 'VVC', NULL, 'jordi_schoonenberg@hotmail.com', 'assistant', 'invited', '808e082b-127f-4035-992c-a931f8db9b17', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-2' AND email = 'jordi_schoonenberg@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-2', 'VVC', NULL, 'jeltevanwijk@ziggo.nl', 'head', 'invited', '41f0341c-4b52-42f1-abd4-367dccc2358b', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-2' AND email = 'jeltevanwijk@ziggo.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-3', 'VVC', NULL, 'jeffrey.siebers@hotmail.com', 'head', 'invited', 'b151dae4-ca8e-45f1-bdec-f45fbc4fbd97', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-3' AND email = 'jeffrey.siebers@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-3', 'VVC', NULL, 'laravdvlugt@hotmail.com', 'head', 'invited', 'b8acc748-b402-48eb-a96d-79e8571dfacd', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-3' AND email = 'laravdvlugt@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-4', 'VVC', NULL, 'joaquin.langius@hvc.nl', 'head', 'invited', 'dc35a985-a24e-4ea2-acd7-90c30f9c4f80', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-4' AND email = 'joaquin.langius@hvc.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-4', 'VVC', NULL, 'ajh.langius@gmail.com', 'assistant', 'invited', '0c0efd0e-616e-455f-a041-cb019104cee0', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-4' AND email = 'ajh.langius@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-5', 'VVC', NULL, 'r.c.capella@gmail.com', 'head', 'invited', 'd3b86905-0370-4ee3-80a2-8ce8c532021f', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-5' AND email = 'r.c.capella@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-5', 'VVC', NULL, 'svenenlinda@ziggo.nl', 'head', 'invited', '0d13969b-9523-4de1-9505-f47fce027ab4', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-5' AND email = 'svenenlinda@ziggo.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-5', 'VVC', NULL, 'nickvanthul@hotmail.com', 'assistant', 'invited', '2344a47a-810b-4ec5-be14-1aa41bc72a28', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-5' AND email = 'nickvanthul@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-5', 'VVC', NULL, 'jessicabreedijk10@hotmail.com', 'assistant', 'invited', 'da66e320-f26c-4f7c-81bc-917ab83ac5cb', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-5' AND email = 'jessicabreedijk10@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO10-6', 'VVC', NULL, 'fred.kayleigh@gmail.com', 'head', 'invited', 'e1b6e1ef-1f83-44eb-b992-5fe63cf56f64', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO10-6' AND email = 'fred.kayleigh@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-1', 'VVC', NULL, 'rick_kievits@hotmail.com', 'assistant', 'invited', '9e6c5341-02e1-43eb-8561-123d518d38d3', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-1' AND email = 'rick_kievits@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-1', 'VVC', NULL, 'milankoen08@gmail.com', 'head', 'invited', '9bff9ebc-7e40-4a02-b503-3153dddb33f2', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-1' AND email = 'milankoen08@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-1', 'VVC', NULL, 'edwin@edwindebrouwer.nl', 'assistant', 'invited', 'd0f3a195-bea1-447f-add0-a9e1000409af', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-1' AND email = 'edwin@edwindebrouwer.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-2', 'VVC', NULL, 'frankhermans86@gmail.com', 'assistant', 'invited', 'a12c3fbc-139a-46dc-844b-9105409795cd', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-2' AND email = 'frankhermans86@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-2', 'VVC', NULL, 'medorre@gmail.com', 'head', 'invited', 'd376ea39-dc1a-49e5-a7a5-e6279fed8733', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-2' AND email = 'medorre@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-3', 'VVC', NULL, 'andy@bureau17.nl', 'head', 'invited', '097607eb-9099-4f25-ab3d-00254afdbd7e', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-3' AND email = 'andy@bureau17.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-3', 'VVC', NULL, 'familie@groenhoog.nl', 'assistant', 'invited', '8de10c18-1945-43f5-88a5-237b95678485', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-3' AND email = 'familie@groenhoog.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-3', 'VVC', NULL, 'franalonso14@protonmail.com', 'assistant', 'invited', '930c146c-9631-45e9-a7be-f7ef8c45c98f', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-3' AND email = 'franalonso14@protonmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-4', 'VVC', NULL, 'marcel.romy@hotmail.com', 'assistant', 'invited', 'a8983d2d-32b8-4970-9c5e-f484ff458e9c', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-4' AND email = 'marcel.romy@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-4', 'VVC', NULL, 'mustafa_yildiz83@hotmail.com', 'head', 'invited', '50579cca-38d3-4a69-8f76-7eedbeaf9d44', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-4' AND email = 'mustafa_yildiz83@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-5', 'VVC', NULL, 's.griekspoor@grimach.nl', 'head', 'invited', '5cf296a3-c50f-4d40-a583-dd1d3be790f3', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-5' AND email = 's.griekspoor@grimach.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-5', 'VVC', NULL, 'jorgmo@gmail.com', 'assistant', 'invited', '2931f7f6-4e93-43c4-ac86-6c2f3ecd668a', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-5' AND email = 'jorgmo@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-5', 'VVC', NULL, 'frankwitsenburg@gmail.com', 'head', 'invited', 'df901a53-f5a2-4992-9cc9-e8922bd1609e', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-5' AND email = 'frankwitsenburg@gmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-6', 'VVC', NULL, 'michel_vandie@hotmail.com', 'head', 'invited', '394df06e-0477-4b4b-8077-de680c3d43db', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-6' AND email = 'michel_vandie@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-6', 'VVC', NULL, 'sinan-52@live.nl', 'head', 'invited', '8a50592e-0b62-4607-9de1-3774a1450c4f', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-6' AND email = 'sinan-52@live.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-6', 'VVC', NULL, 'mandy.kuijk@hotmail.nl', 'assistant', 'invited', '6306f50d-43fc-4e1b-b6d0-3554a6fe18c5', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-6' AND email = 'mandy.kuijk@hotmail.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-6', 'VVC', NULL, 'gizemguncaglayan@live.nl', 'assistant', 'invited', '62cf1db4-b449-466d-ba6f-b37ede68f025', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO11-6' AND email = 'gizemguncaglayan@live.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO12-1', 'VVC', NULL, 'e.mars@live.nl', 'head', 'invited', '1c8d8701-f311-4720-afd8-a361b898fea9', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO12-1' AND email = 'e.mars@live.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO12-1', 'VVC', NULL, 'robvanwel@hotmail.com', 'head', 'invited', '3bfd54a9-85ec-49fe-9905-8629bc3c7ca0', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO12-1' AND email = 'robvanwel@hotmail.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO12-2', 'VVC', NULL, 'rachellavanderwoude@live.nl', 'assistant', 'invited', '8361a487-1213-40c8-8d15-2c0136c32ba1', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO12-2' AND email = 'rachellavanderwoude@live.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO12-2', 'VVC', NULL, 'mourad-82@live.nl', 'assistant', 'invited', '4ee69ed8-c057-4a03-979e-5534faf1de91', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO12-2' AND email = 'mourad-82@live.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO12-2', 'VVC', NULL, 'kenneth@lynchfinancialservices.com', 'head', 'invited', '79620f4c-8758-4ca0-b533-cc8500a60135', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO12-2' AND email = 'kenneth@lynchfinancialservices.com'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO12-3', 'VVC', NULL, 'esther.yorks@live.nl', 'head', 'invited', '5251df1b-cfa4-421c-9af7-076222fde7b3', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO12-3' AND email = 'esther.yorks@live.nl'
);
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO12-3', 'VVC', NULL, 'evyhuiskens@gmail.com', 'head', 'invited', 'f80793da-bd89-40e8-bc1e-3914e3e27798', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches WHERE team_id = 'VVCO12-3' AND email = 'evyhuiskens@gmail.com'
);
