/**
 * Canonical demo content for the 7 Top Performers shown in the club dashboard.
 *
 * These players already exist in the live DB (team IMPACT-JO10-1 / JO12-2 / JO14-1)
 * but only carry the legacy 7-skill `base()` shape. The current app reads the full
 * 17-skill schema (SkillScores) and defaults every missing key to 5 — which is why
 * every player collapsed to ~52 in the "Top Performers" list.
 *
 * This module is the SINGLE SOURCE OF TRUTH for both:
 *   - the vitest test (src/demo/demoPlayers.test.ts) that proves real variation, and
 *   - scripts/seed-demo-players.mjs that pushes the data to Supabase.
 *
 * All values are fully filled: 17 skills × 3 periods + fitness + 15 tests + comments
 * + training plans + match ratings. Scores are deliberately varied (58 → 84).
 */

// Must stay in sync with src/utils/constants.ts → skillKeys (17 keys)
export const SKILL_KEYS = [
  'rechterbeen', 'linkerbeen', 'aannemen', 'passen', 'passeerbewegingen', 'scoren',
  'aanvallend_1v1', 'verdedigend_1v1', 'snelheid', 'wendbaarheid', 'duelkracht',
  'trainingsmentaliteit', 'wedstrijdmentaliteit', 'leiderschap', 'concentratie',
  'discipline', 'aanwezigheid',
];

export const PERIODS = ['Check-in 1', 'Check-in 2', 'Check-in 3'];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Per-player canonical profile.
 *  - skillsC3: the 17 skill values at "Check-in 3" (best form), in SKILL_KEYS order.
 *  - improvement: how many points the player started below their C3 form (drives
 *    the C1→C3 upward trend; lower = already elite, higher = late bloomer).
 *  - meta: identity / roster fields used by the seed push.
 *  - comments / plans: role + period specific coach notes (fully written Dutch copy).
 */
const PROFILES = {
  'Noah Bakker': {
    meta: { name: 'Noah Bakker', position: 'Aanvaller', age: '9', foot: 'Rechts', team_id: 'IMPACT-JO10-1' },
    skillsC3: [7, 5, 6, 5, 7, 6, 7, 4, 7, 7, 5, 8, 7, 4, 6, 7, 8],
    improvement: 3,
    comments: [
      'Noah is snel en gretig voorin, maar kiest nog te vaak voor eigen succes. Verdedigend veel ruimte voor groei.',
      'Mooie stap! Noah combineert steeds beter en zijn snelheid is een écht wapen geworden. Blijft werken aan keuzes.',
      'Noah is uitgegroeid tot een gevaarlijke, snelle aanvaller. Zijn diepgang is TOP — blijf zo trainen!',
    ],
    plans: [
      'Samenspel: 2v1 combinatie · Doelschieten nauwkeurigheid · Sprint zonder bal',
      'Afwerken na snelle actie · 1v1 aanvallen · Wandpass rechts verbeteren',
      'Sprint met bal 20m · Trucje bij de achterlijn · Hooghouden record verhogen',
    ],
  },
  'Tijs Smit': {
    meta: { name: 'Tijs Smit', position: 'Middenvelder', age: '11', foot: 'Rechts', team_id: 'IMPACT-JO12-2' },
    skillsC3: [7, 6, 7, 8, 7, 6, 6, 6, 7, 7, 6, 9, 9, 9, 9, 9, 9],
    improvement: 2,
    comments: [
      'Tijs heeft uitstekend overzicht en verdeelt de bal slim. Snelheid is het enige verbeterpunt.',
      'Tijs speelt op zijn hoogste niveau. Zijn inzicht is het beste van het team — een echte regisseur.',
      'Tijs is een compleet middenveldspeler met leiderschap. Klaar voor een hoger niveau!',
    ],
    plans: [
      'Sprinttraining explosief opstarten · Lange pass oefening · Positiespel 4v4',
      'Voetenwerk verfijnen · Combinatie met wisselwerking · Eindschot vanuit tweede lijn',
      'Lange diagonale pass · Pressing oefening · Schot met beide benen',
    ],
  },
  'Sven de Jong': {
    meta: { name: 'Sven de Jong', position: 'Aanvaller', age: '12', foot: 'Links', team_id: 'IMPACT-JO12-2' },
    skillsC3: [7, 8, 6, 6, 8, 8, 8, 4, 9, 8, 5, 8, 7, 5, 6, 7, 8],
    improvement: 2,
    comments: [
      'Sven is razendsnel en gevaarlijk voor doel. Verdedigend werk en inzicht kunnen beter.',
      'Topgroei! Sven zet nu meer druk van voren. Zijn linkervoet is een wapen.',
      'Sven is de topscorer van het team en een inspiratie voor zijn teamgenoten!',
    ],
    plans: [
      'Pressing van voren oefenen · Eindschot links · Samenspel 2v2',
      'Schottraining vanuit snelheid · Combinatiespel met wissel · Sprint-herstel oefening',
      'Afwerken in 1v1 situaties · Trucje op links · Sprint met bal 20m',
    ],
  },
  'Max Visser': {
    meta: { name: 'Max Visser', position: 'Aanvaller', age: '12', foot: 'Rechts', team_id: 'IMPACT-JO12-2' },
    skillsC3: [7, 7, 8, 7, 7, 7, 7, 5, 7, 7, 6, 8, 7, 6, 7, 8, 8],
    improvement: 2,
    comments: [
      'Max is een technische speler met een goed schot. Zijn inzicht groeit gestaag.',
      'Mooie progressie van Max. Techniek en schot zijn zijn beste eigenschappen.',
      'Max heeft een geweldig seizoen gehad. Zijn techniek en mentaliteit zijn top!',
    ],
    plans: [
      'Dribbel met schotmoment · Positiespel aanvaller · Wandpass training',
      'Afwerken na actie · Combinatie 2v1 · Schottraining nauwkeurigheid',
      'Trucs op kleine ruimte · Eindschot training · Sprint met bal naar doel',
    ],
  },
  'Sander Kuijpers': {
    meta: { name: 'Sander Kuijpers', position: 'Verdediger', age: '13', foot: 'Rechts', team_id: 'IMPACT-JO14-1' },
    skillsC3: [7, 6, 7, 8, 6, 5, 6, 9, 7, 7, 9, 9, 9, 7, 8, 9, 9],
    improvement: 2,
    comments: [
      'Sander is een complete verdediger. Sterk in de lucht en slim in positie.',
      'Mooie groei! Sander speelt nu ook goed mee in de opbouw. Echt compleet.',
      'Sander is een van de beste verdedigers van de competitie. Geweldig seizoen!',
    ],
    plans: [
      'Kopbal training · Opbouwen 3-4-3 · Duel winnen in de zestien',
      'Lange bal vanuit verdediging · 1v1 winnen · Heading aanvallend en verdedigend',
      'Positiespel achterin · Interceptie timing · Opbouwen met aanvallende intentie',
    ],
  },
  'Boris Willems': {
    meta: { name: 'Boris Willems', position: 'Aanvaller', age: '13', foot: 'Rechts', team_id: 'IMPACT-JO14-1' },
    skillsC3: [9, 8, 8, 7, 9, 10, 9, 6, 10, 9, 7, 9, 9, 8, 8, 9, 9],
    improvement: 1,
    comments: [
      'Boris is een explosieve aanvaller met een geweldig schot. Ons gevaarlijkste wapen.',
      'Uitstekend! Boris scoort bijna elke training. Zijn techniek op snelheid is indrukwekkend.',
      'Boris is de beste aanvaller van zijn leeftijdscategorie. Een talent om te koesteren!',
    ],
    plans: [
      'Afwerken na 1v1 met keeper · Sprint 30m met bal · Aanname op hoge snelheid',
      'Combinatie: dieptepass + afwerken · Schottraining beide benen · 1v1 duel wint hij standaard',
      'Werken aan zwakke voet · Samenspel onder druk · Mentale weerbaarheid bij tegenslag',
    ],
  },
  'Thijs Groot': {
    meta: { name: 'Thijs Groot', position: 'Middenvelder', age: '14', foot: 'Links', team_id: 'IMPACT-JO14-1' },
    skillsC3: [8, 9, 8, 9, 8, 7, 7, 7, 7, 8, 7, 8, 9, 9, 9, 9, 9],
    improvement: 1,
    comments: [
      'Thijs is een echte regisseur. Zijn links is soms onhoudbaar. Verdedigend meer aandacht.',
      'Thijs blijft groeien. Zijn techniek links is fenomenaal. Conditie mag iets beter.',
      'Thijs is klaar voor een hoger niveau. Zijn inzicht en linkerbeen zijn uitzonderlijk!',
    ],
    plans: [
      'Verdedigend positioneren · Pressing oefening · Diagonale pass links',
      'Conditietraining interval · Pressing als team · Opbouwen vanuit achterlijn',
      'Lange diagonale bal · Eindschot met links · Weerbaarheid in duels',
    ],
  },
};

// ── Fitness & test generators ────────────────────────────────────────────────
// Deterministic, realistic per-period progression. "Higher is better" metrics
// grow with the period; "lower is better" (sprints, slalom, reaction) shrink.

function fitnessFor(profile, periodIdx) {
  const s = profile.skillsC3;
  const speed = s[8];       // snelheid
  const agility = s[9];     // wendbaarheid
  const power = s[10];      // duelkracht
  const ment = s[15];       // discipline (proxy for work rate)
  const grow = [0.94, 0.97, 1.0][periodIdx]; // fitness improves over the season

  const sprint30 = round1(clamp((5.8 - (speed - 5) * 0.14) / grow, 3.8, 7.5)); // sec, lower better
  const yoyo = Math.round(clamp((12 + (power + agility) / 2) * grow + (ment - 7), 12, 24) * 10) / 10; // level
  const cooper = Math.round(clamp((1180 + power * 38 + ment * 12) * grow, 1100, 2600)); // meters
  return { sprint: `${sprint30}s`, yoyo: `Level ${yoyo}`, cooper: `${cooper}m` };
}

function testsFor(profile, periodIdx) {
  const s = profile.skillsC3;
  const grow = [0.9, 0.95, 1.0][periodIdx]; // skill tests improve over the season
  const lowGrow = [1.08, 1.04, 1.0][periodIdx]; // "lower is better" tighten over time

  const techniek = s[2];      // aannemen
  const passen = s[3];
  const scoren = s[5];
  const a1v1 = s[6];
  const v1v1 = s[7];
  const snelheid = s[8];
  const wendbaar = s[9];
  const duel = s[10];

  return {
    balvaardigheid: {
      hooghouden: `${Math.round((18 + techniek * 4) * grow)}`,
      tikken: `${Math.round((22 + techniek * 6) * grow)}`,
      slalom: `${round1(clamp((13.5 - techniek * 0.4) * lowGrow, 6, 16))}`,
      aannemen: `${clamp(Math.round(techniek * grow), 1, 10)}`,
      wandpass: `${Math.round((10 + techniek * 2) * grow)}`,
    },
    schietenPassing: {
      nauwkeurigheidSchieten: `${clamp(Math.round(scoren * grow), 1, 10)}`,
      passNauwkeurigheid: `${clamp(Math.round(passen * grow), 1, 10)}`,
      schotkracht: `${Math.round((48 + snelheid * 3 + scoren) * grow)}`,
    },
    fysiekConditie: {
      sprint10m: `${round1(clamp((2.5 - (snelheid - 5) * 0.06) * lowGrow, 1.6, 3.4))}`,
      herhaaldeSprints: `${round1(clamp((1.0 + (10 - snelheid) * 0.05) * lowGrow, 0.4, 1.6))}`,
      uithoudingsvermogen: `${Math.round((1100 + duel * 42) * grow)}`,
      sprongkracht: `${Math.round((28 + duel * 2.4) * grow)}`,
    },
    coordinatieInzicht: {
      reactietest: `${round1(clamp((0.42 - wendbaar * 0.008) * lowGrow, 0.22, 0.6))}`,
      duel1v1: `${clamp(Math.round((a1v1 + v1v1) / 2 / 2), 1, 5)}`,
      spelintelligentie: `${clamp(Math.round((s[12] + s[13]) / 2 / 2), 1, 5)}`,
    },
  };
}

function matchRatingFor(profile, periodIdx) {
  const c3 = profile.skillsC3.reduce((a, b) => a + b, 0) / profile.skillsC3.length;
  const ratings = [c3 - profile.improvement, c3 - profile.improvement / 2, c3].map((v) => clamp(Math.round(v), 1, 10));
  return ratings[periodIdx];
}

// ── Build the full evaluation object for a player × period ───────────────────
function buildEvaluation(profile, periodIdx) {
  const dec = (profile.improvement * (2 - periodIdx)) / 2; // C1: full, C2: half, C3: 0
  const skills = {};
  SKILL_KEYS.forEach((k, i) => {
    skills[k] = clamp(Math.round(profile.skillsC3[i] - dec), 2, 10);
  });
  return {
    skills,
    matchRating: matchRatingFor(profile, periodIdx),
    comments: profile.comments[periodIdx],
    trainingPlan: profile.plans[periodIdx],
    fitness: fitnessFor(profile, periodIdx),
    tests: testsFor(profile, periodIdx),
  };
}

function buildPlayer(name) {
  const profile = PROFILES[name];
  const evaluations = {};
  PERIODS.forEach((p, i) => { evaluations[p] = buildEvaluation(profile, i); });
  return { ...profile.meta, evaluations };
}

export const demoPlayers = Object.keys(PROFILES).map(buildPlayer);

// ── Score helpers (mirror ClubAdminDashboard.calcSkillAvg / toScore) ──────────
export function skillAvg(evaluations, period) {
  const ev = evaluations[period];
  if (!ev?.skills) return 5;
  return SKILL_KEYS.reduce((s, k) => s + (ev.skills[k] ?? 5), 0) / SKILL_KEYS.length;
}

export function scoreFor(evaluations, period) {
  return Math.round(skillAvg(evaluations, period) * 10);
}

export function finalScore(player) {
  return scoreFor(player.evaluations, PERIODS[PERIODS.length - 1]);
}
