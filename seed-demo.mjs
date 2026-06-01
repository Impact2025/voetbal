/**
 * Demo seed script — Impact FC club admin setup
 * Run with: node seed-demo.mjs
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://ezbsychffwnavedwiqvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6YnN5Y2hmZnduYXZlZHdpcXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTcyNzgsImV4cCI6MjA5NDA3MzI3OH0.nDtUgUuTE9isLJlfNaBUnCI6WDRtbaJsiaV6jcv--ZE';

const DEMO_EMAIL    = 'chat@weareimpact.nl';
const DEMO_PASSWORD = 'Skillkaart2026!';
const CLUB_ID       = 'IMPACT-FC';
const CLUB_NAME     = 'Impact FC';

function hashPin(pin, playerId) {
  return crypto.createHash('sha256').update(pin + playerId, 'utf8').digest('hex');
}

function evalData(skills, rating, comments = '', plan = '') {
  return {
    skills,
    matchRating: rating,
    comments,
    trainingPlan: plan,
    fitness: { yoyo: '', cooper: '', sprint: '' },
    tests: {
      balvaardigheid: { hooghouden: '', tikken: '', slalom: '', aannemen: '', wandpass: '' },
      schietenPassing: { nauwkeurigheidSchieten: '', passNauwkeurigheid: '', schotkracht: '' },
      fysiekConditie: { sprint10m: '', herhaaldeSprints: '', uithoudingsvermogen: '', sprongkracht: '' },
      coordinatieInzicht: { reactietest: '', duel1v1: '', spelintelligentie: '' },
    },
  };
}

const base = (s, p, te, sc, v, i, m) => ({ snelheid: s, passing: p, techniek: te, schot: sc, verdedigen: v, inzicht: i, mentaliteit: m });

// ── Teams ──────────────────────────────────────────────────────────────────
const TEAMS = [
  { id: 'IMPACT-JO10-1', name: 'Impact JO10-1', class: 'JO10-1' },
  { id: 'IMPACT-JO12-2', name: 'Impact JO12-2', class: 'JO12-2' },
  { id: 'IMPACT-JO14-1', name: 'Impact JO14-1', class: 'JO14-1' },
];

// ── Players per team ───────────────────────────────────────────────────────
// Format: { name, pin, position, age, foot, evals }
// evals = { 'Check-in 1': {...}, 'Check-in 2': {...}, 'Check-in 3': {...} }

const JO10_PLAYERS = [
  {
    name: 'Luca van den Berg', pin: '112233', position: 'Aanvaller', age: '9', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(6,5,6,7,4,5,7), 6, 'Luca heeft veel energie voorin en is gevaarlijk voor doel. Verdedigend nog wat meer inzet tonen.', '- 10x doelschieten vanuit de draai\n- Wandpass oefening links/rechts\n- Sprint met bal 10m'),
      'Check-in 2': evalData(base(7,5,6,7,5,6,8), 7, 'Mooie groei te zien! Zijn schot is gevaarlijk en hij zet meer druk. Passing kan beter.', '- Combinatiespel 3v3 op klein veld\n- Inzicht trainen met positiespel\n- Schotkracht oefening'),
      'Check-in 3': evalData(base(7,6,7,8,5,6,8), 7, 'Luca ontwikkelt zich tot een complete aanvaller. Top inzet, blijf zo doorgaan!', '- Afwerken na combinatie\n- Dribbel met schotmoment\n- Hooghouden record verbeteren'),
    },
  },
  {
    name: 'Sem Janssen', pin: '223344', position: 'Middenvelder', age: '9', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(5,7,6,5,6,7,6), 6, 'Sem is een echte leider op het middenveld. Goed overzicht en sterke passing.', '- Positiespel op klein veld\n- Passoefening met 3 man\n- Wandpass links trainen'),
      'Check-in 2': evalData(base(5,8,7,5,6,8,7), 7, 'Uitstekende voortgang! Sem verdeelt het spel slim. Schot mag wat scherper.', '- Schietoefeningen van afstand\n- Sprint naar de bal\n- 1-tegen-1 verdedigen'),
      'Check-in 3': evalData(base(6,8,7,6,7,8,8), 8, 'Sem is een topvoetballer in wording. Leiderschap en inzicht zijn zijn sterkste punten.', '- Lange pass trainen\n- Eindschot na dribbel\n- Conditieloop 6 minuten'),
    },
  },
  {
    name: 'Daan de Vries', pin: '334455', position: 'Verdediger', age: '10', foot: 'Links',
    evals: {
      'Check-in 1': evalData(base(6,5,5,4,8,6,7), 5, 'Daan is een rots achterin! Sterk in duels. Opbouwen met de bal verdient aandacht.', '- Wandpass oefening rustig opbouwen\n- Positiespel met bal\n- Sprintoefening met bal'),
      'Check-in 2': evalData(base(6,6,6,4,8,7,7), 6, 'Mooie stap vooruit! Daan speelt nu ook beter mee in de opbouw. Techniek blijft een werkpunt.', '- Techniek drills: slalom\n- Opbouwen vanuit verdediging\n- Passing op druk'),
      'Check-in 3': evalData(base(7,6,6,5,9,7,8), 7, 'Daan is één van de beste verdedigers in de leeftijdscategorie. Top werk!', '- 1-tegen-1 duel oefening\n- Kopbal training\n- Opbouwen via keeper'),
    },
  },
  {
    name: 'Noah Bakker', pin: '445566', position: 'Aanvaller', age: '9', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(7,5,6,6,4,5,6), 6, 'Noah is snel en gevaarlijk. Moet leren beter te kiezen voor teamgenoten.', '- Samenspel: combinatie 2v1\n- Doelschieten nauwkeurigheid\n- Sprint zonder bal'),
      'Check-in 2': evalData(base(7,6,7,7,4,6,7), 7, 'Goede progressie! Noah combineert nu beter. Zijn snelheid is een wapen.', '- Afwerken na snelle actie\n- 1-contra-1 aanvallen\n- Wandpass rechts verbeteren'),
      'Check-in 3': evalData(base(8,6,7,7,5,6,7), 7, 'Noah is uitgegroeid tot een snelle, gevaarlijke aanvaller. Blijf zo trainen!', '- Sprintoefening met bal\n- Trucje bij de achterlijn\n- Hooghouden record'),
    },
  },
  {
    name: 'Finn Meijer', pin: '556677', position: 'Keeper', age: '10', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(5,6,5,5,7,6,8), 6, 'Finn is een dappere keeper met een goed gevoel voor positie. Uitkomen mag assertiever.', '- Reactie-oefening: bal omhoog\n- Krachtig uittrap trainen\n- 1-op-1 situaties'),
      'Check-in 2': evalData(base(5,6,6,5,8,7,8), 7, 'Mooie groei! Finn laat de bal veel vaker stuiteren. Zijn leiderschap achterin groeit.', '- Positietraining in het doel\n- Gooien naar verdediger\n- Reflextraining'),
      'Check-in 3': evalData(base(5,7,6,6,8,8,9), 7, 'Finn is een vertrouwenwekkende keeper geworden. Uitstekend seizoen!', '- Duiken naar beide kanten\n- Lange bal trainen\n- Coachen achterin'),
    },
  },
];

const JO12_PLAYERS = [
  {
    name: 'Tijs Smit', pin: '667788', position: 'Middenvelder', age: '11', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(7,8,7,6,6,8,7), 7, 'Tijs heeft een uitstekend overzicht en verdeelt de bal slim. Snelheid is een verbeterpunt.', '- Sprinttraining: explosief opstarten\n- Lange pass oefening\n- Positiespel 4v4'),
      'Check-in 2': evalData(base(7,8,8,6,7,9,8), 8, 'Tijs speelt op zijn hoogste niveau. Zijn inzicht is de beste van het team.', '- Voetenwerk verfijnen\n- Combinatie met wisselwerking\n- Eindschot vanuit de tweede lijn'),
      'Check-in 3': evalData(base(8,9,8,7,7,9,8), 8, 'Tijs is een compleet middenveldspeler. Klaar voor een hoger niveau!', '- Lange diagonale pass\n- Pressing oefening\n- Schot met beide benen'),
    },
  },
  {
    name: 'Sven de Jong', pin: '778899', position: 'Aanvaller', age: '12', foot: 'Links',
    evals: {
      'Check-in 1': evalData(base(8,6,7,8,4,6,7), 7, 'Sven is razendsnel en gevaarlijk voor doel. Verdedigend werk kan beter.', '- Pressing van voren oefenen\n- Eindschot links\n- Samenspel 2v2'),
      'Check-in 2': evalData(base(9,7,8,8,5,7,8), 8, 'Top groei! Sven zet nu meer druk. Zijn linkervoet is een wapen.', '- Schottraining vanuit snelheid\n- Combinatiespel met wissel\n- Sprint herstel oefening'),
      'Check-in 3': evalData(base(9,7,8,9,5,7,9), 9, 'Sven is de topscorer van het team en een inspiratie voor zijn teamgenoten!', '- Afwerken in 1v1 situaties\n- Trucje op links\n- Sprint met bal 20m'),
    },
  },
  {
    name: 'Lukas Peters', pin: '889900', position: 'Verdediger', age: '11', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(6,6,6,5,8,7,7), 6, 'Lukas verdedigt sterk en is stabiel achterin. Zijn passing naar voren kan assertiever.', '- Opbouwen vanuit verdediging\n- Duel 1v1 trainen\n- Passoefening onder druk'),
      'Check-in 2': evalData(base(7,7,7,5,8,7,7), 7, 'Lukas speelt nu meer mee in de opbouw. Zijn timing in duels is excellent.', '- Lange bal naar aanvaller\n- Positiespel verdediging\n- Heading oefening'),
      'Check-in 3': evalData(base(7,7,7,5,9,8,8), 8, 'Lukas is een onmisbare verdediger geworden. Volwassen spel voor zijn leeftijd!', '- Pressing vanuit verdediging\n- Interceptie trainen\n- Opbouwen 3-man'),
    },
  },
  {
    name: 'Max Visser', pin: '990011', position: 'Aanvaller', age: '12', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(7,6,7,7,5,6,8), 7, 'Max is een technische speler met goed schot. Inzicht groeit gestaag.', '- Dribbel met schotmoment\n- Positiespel aanvaller\n- Wandpass training'),
      'Check-in 2': evalData(base(7,7,7,8,5,7,8), 7, 'Mooie progressie van Max. Zijn techniek en schot zijn zijn beste eigenschappen.', '- Afwerken na actie\n- Combinatie 2v1\n- Schottraining nauwkeurigheid'),
      'Check-in 3': evalData(base(8,7,8,8,6,7,9), 8, 'Max heeft een geweldig seizoen gehad. Zijn techniek en mentaliteit zijn top!', '- Trucs op kleine ruimte\n- Eindschot training\n- Sprint met bal naar doel'),
    },
  },
  {
    name: 'Koen Mulder', pin: '101112', position: 'Middenvelder', age: '11', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(6,7,6,5,7,7,6), 6, 'Koen werkt hard en is overal op het veld te vinden. Passing is zijn kracht.', '- Positiespel centraal middenveld\n- Passoefening 3-man\n- Conditie: 6-min loop'),
      'Check-in 2': evalData(base(6,7,7,5,7,8,7), 7, 'Koen groeit in zijn positie. Zijn overzicht is sterk verbeterd.', '- Lange pas trainen\n- Aanname onder druk\n- Sprintoefening terug en voor'),
      'Check-in 3': evalData(base(7,8,7,6,8,8,8), 7, 'Koen is uitgegroeid tot een betrouwbare middenvelder. Topinzet elk duel!', '- Combinatie op klein veld\n- Eindschot vanuit run\n- Bijdrage defensieve fase'),
    },
  },
];

const JO14_PLAYERS = [
  {
    name: 'Boris Willems', pin: '121314', position: 'Aanvaller', age: '13', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(9,7,8,9,5,7,9), 8, 'Boris is een explosieve aanvaller met een geweldig schot. Ons gevaarlijkste wapen.', '- Afwerken na 1v1 met keeper\n- Sprint 30m met bal\n- Aanname op hoge snelheid'),
      'Check-in 2': evalData(base(9,8,9,9,5,8,9), 9, 'Uitstekend! Boris scoort bijna elke training. Zijn techniek op snelheid is indrukwekkend.', '- Combinatie: dieptepass + afwerken\n- Schottraining beide benen\n- 1v1 duel wint hij standaard'),
      'Check-in 3': evalData(base(9,8,9,10,6,8,10), 9, 'Boris is de beste aanvaller van zijn leeftijdscategorie. Een talent om te koesteren!', '- Werken aan zwakke voet\n- Samenspel onder druk\n- Mentale weerbaarheid bij tegenslagen'),
    },
  },
  {
    name: 'Thijs Groot', pin: '141516', position: 'Middenvelder', age: '14', foot: 'Links',
    evals: {
      'Check-in 1': evalData(base(7,9,8,7,7,9,8), 8, 'Thijs is een echte regisseur. Zijn links is soms onhoudbaar. Verdedigend meer aandacht.', '- Verdedigend positioneren\n- Pressing oefening\n- Diagonale pass links'),
      'Check-in 2': evalData(base(7,9,9,7,7,9,8), 8, 'Thijs blijft groeien. Zijn techniek links is fenomenaal. Conditie mag beter.', '- Conditietraining interval\n- Pressing als team\n- Opbouwen vanuit achterlijn'),
      'Check-in 3': evalData(base(8,9,9,8,8,10,9), 9, 'Thijs is klaar voor een hoger niveau. Zijn inzicht en links zijn uitzonderlijk!', '- Lange diagonale bal\n- Eindschot met links\n- Weerbaarheid in duels'),
    },
  },
  {
    name: 'Sander Kuijpers', pin: '161718', position: 'Verdediger', age: '13', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(7,7,7,5,9,8,8), 7, 'Sander is een complete verdediger. Sterk in de lucht en slim in positie.', '- Kopbal training\n- Opbouwen 3-4-3\n- Duel winnen in de zestien'),
      'Check-in 2': evalData(base(7,7,8,5,9,8,9), 8, 'Mooie groei! Sander speelt nu ook goed mee in de opbouw. Echt compleet.', '- Lange bal vanuit verdediging\n- 1v1 winnen\n- Heading aanvallend en verdedigend'),
      'Check-in 3': evalData(base(8,8,8,6,9,9,9), 8, 'Sander is een van de beste verdedigers van de competitie. Geweldig seizoen!', '- Positiespel achterin\n- Interceptie timing\n- Opbouwen met aanvallende intentie'),
    },
  },
  {
    name: 'Rens van Dijk', pin: '181920', position: 'Keeper', age: '14', foot: 'Rechts',
    evals: {
      'Check-in 1': evalData(base(6,7,7,5,9,8,9), 7, 'Rens is een uitstekende keeper met geweldig leiderschap. Zijn uittrappen zijn krachtig.', '- Reflextraining: 4 hoeken\n- Coachen achterin\n- Uittrap precisie'),
      'Check-in 2': evalData(base(6,8,7,6,9,9,9), 8, 'Rens heeft een uitstekend halfjaar gehad. Zijn distributie is enorm verbeterd.', '- Uittrap met linkervoet\n- Duiken training\n- 1v1 keeper situaties'),
      'Check-in 3': evalData(base(6,8,8,6,10,9,10), 9, 'Rens is een compleet keeper. Zijn leiderschap en reflexen zijn van het hoogste niveau!', '- Lange bal nauwkeurigheid\n- Positie bij corner\n- Gooien naar vrije man'),
    },
  },
];

const TEAM_PLAYERS = {
  'IMPACT-JO10-1': JO10_PLAYERS,
  'IMPACT-JO12-2': JO12_PLAYERS,
  'IMPACT-JO14-1': JO14_PLAYERS,
};

// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ── 1. Sign up or sign in as club admin ────────────────────────────────
  console.log(`\n🔐 Aanmaken / inloggen als ${DEMO_EMAIL}...`);
  let authData;

  // Try signup first, then always try signin to get a fresh session
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error('Signup mislukt:', signUpError.message);
    process.exit(1);
  }

  if (!signUpError) console.log('   ✅ Account aangemaakt (of bestond al)');

  // Always try to sign in to get a valid session
  console.log('   Inloggen voor sessie-token...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signInError) {
    console.error('');
    console.error('❌ Inloggen mislukt:', signInError.message);
    console.error('');
    console.error('Waarschijnlijk oorzaak: e-mailbevestiging is verplicht in dit Supabase project.');
    console.error('Oplossing: ga naar Supabase Dashboard → Authentication → Settings →');
    console.error('"Email Confirmations" uitschakelen, en run dit script opnieuw.');
    process.exit(1);
  }

  authData = signInData;
  const userId = authData.user?.id;
  if (!userId) { console.error('Geen user ID verkregen.'); process.exit(1); }
  console.log(`   ✅ Ingelogd — User ID: ${userId}`);

  const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
  });

  // ── 2. Club aanmaken ───────────────────────────────────────────────────
  console.log(`\n🏟️  Club aanmaken: ${CLUB_NAME} (${CLUB_ID})...`);
  const { error: clubError } = await authedClient.from('clubs').upsert({ id: CLUB_ID, name: CLUB_NAME }, { onConflict: 'id' });
  if (clubError) console.warn('   Club upsert:', clubError.message);
  else console.log('   ✅ Club aangemaakt');

  // ── 3. Profile aanmaken ───────────────────────────────────────────────
  console.log(`\n👤 Profile aanmaken (club_admin)...`);
  const { error: profileError } = await authedClient.from('profiles').upsert({
    id: userId,
    role: 'club_admin',
    club_id: CLUB_ID,
    team_id: null,
  }, { onConflict: 'id' });
  if (profileError) console.warn('   Profile upsert:', profileError.message);
  else console.log('   ✅ Profile aangemaakt');

  // ── 4. Teams aanmaken ─────────────────────────────────────────────────
  console.log('\n⚽ Teams aanmaken...');
  for (const team of TEAMS) {
    const { error } = await authedClient.from('teams').upsert({
      id: team.id,
      coach_id: userId,
      club_id: CLUB_ID,
      team_name: team.name,
      team_class: team.class,
      evaluation_periods: ['Check-in 1', 'Check-in 2', 'Check-in 3'],
      weekly_questions: [
        'Wat deed je goed in de laatste wedstrijd?',
        'Wat wil je de komende week verbeteren?',
        'Wat heb je gedaan om je skills thuis te oefenen?',
      ],
      assigned_homework_ids: [],
    }, { onConflict: 'id' });
    if (error) console.warn(`   Team ${team.id}:`, error.message);
    else console.log(`   ✅ ${team.name}`);
  }

  // ── 5. Spelers aanmaken per team ──────────────────────────────────────
  console.log('\n👟 Spelers aanmaken...');
  for (const team of TEAMS) {
    const players = TEAM_PLAYERS[team.id];
    for (const player of players) {
      const initials = player.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const avatarUrl = `https://placehold.co/128x128/1A1A1A/${NEON_HEX}?text=${initials}`;

      // Insert player first to get an ID
      const { data: inserted, error: insertError } = await authedClient
        .from('players')
        .insert({
          name: player.name,
          team_id: team.id,
          age: player.age,
          preferred_foot: player.foot,
          position: player.position,
          pin_hash: 'pending',
          avatar_url: avatarUrl,
          evaluations: player.evals,
          completed_homework_ids: [],
          weekly_question_responses: [
            'Ik deed het goed bij het samenspelen.',
            'Ik wil mijn schot verbeteren.',
            'Ik heb elke dag 15 minuten geoefend met hooghouden.',
          ],
        })
        .select('id')
        .single();

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          console.log(`   ⚠️  ${player.name} bestaat al — skip`);
          continue;
        }
        console.warn(`   ${player.name} insert fout:`, insertError.message);
        continue;
      }

      // Compute and store PIN hash
      const pinHash = hashPin(player.pin, inserted.id);
      await authedClient.from('players').update({ pin_hash: pinHash }).eq('id', inserted.id);

      console.log(`   ✅ ${player.name} [${team.class}] PIN: ${player.pin}`);
    }
  }

  // ── 6. Samenvatting ───────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log('🎉 Demo setup voltooid!\n');
  console.log('Club Admin Login:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Wachtwoord: ${DEMO_PASSWORD}`);
  console.log(`  Club ID:  ${CLUB_ID}\n`);
  console.log('Teams en speler PINs:');
  for (const team of TEAMS) {
    console.log(`\n  ${team.name} (${team.class})`);
    for (const p of TEAM_PLAYERS[team.id]) {
      console.log(`    ${p.name.padEnd(22)} PIN: ${p.pin}`);
    }
  }
  console.log('\n' + '═'.repeat(55));
  console.log('\n⚠️  Zorg dat de Supabase SQL migraties zijn uitgevoerd!');
  console.log('   (clubs, attendance, evaluation_periods, pin_hash kolom)\n');
}

const NEON_HEX = '00FF9D';
run().catch(err => { console.error(err); process.exit(1); });
