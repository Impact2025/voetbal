import { callAI } from './ai';
import type { StructuredTrainingPlan, Player } from '../types';

export interface TeamChallengeSuggestion {
  emoji: string;
  title: string;
  description: string;
  target: number;
}

export async function generateTeamChallengeSuggestions(
  weekNumber: number,
  ageGroup: string,
  homework: string | null,
  challenge: string | null,
  exerciseTitles: string[]
): Promise<TeamChallengeSuggestion[]> {
  const trainingContext = [
    homework ? `Huiswerk deze week: ${homework}` : null,
    challenge ? `Challenge deze week: ${challenge}` : null,
    exerciseTitles.length ? `Trainingsthema's: ${exerciseTitles.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  const prompt = `Je bent een jeugdvoetbalcoach die een team uitdaging bedenkt voor week ${weekNumber} van het seizoen, voor een ${ageGroup} team.

CONTEXT VAN DEZE WEEK:
${trainingContext || 'Standaard trainingsprogramma'}

Genereer 3 korte, motiverende team uitdagingen die PASSEN bij deze trainingsweek. De uitdaging moet het team aanmoedigen om samen te oefenen.

Geef ALLEEN een geldig JSON array terug zonder markdown:
[
  {
    "emoji": "🔥",
    "title": "pakkende titel max 45 tekens",
    "description": "koppeling aan training van deze week max 80 tekens",
    "target": 15
  }
]

REGELS: Alle tekst Nederlands. target is het totale aantal acties voor het team (5-50). Koppel de titel expliciet aan het trainingsthema. Geef 3 varianten: één makkelijk, één gemiddeld, één ambitieus. Alleen JSON array teruggeven.`;

  const raw = await callAI(prompt, 2, 1000, { max_tokens: 700, temperature: 0.72 });
  try {
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return JSON.parse(raw.slice(start, end + 1)) as TeamChallengeSuggestion[];
    }
  } catch {
    console.error('Parse failed for team challenge suggestions');
  }
  return [];
}

const AGE_GROUP_CONTEXT: Record<string, string> = {
  'U8':  'Leeftijd 6-8 jaar. FUNdamentals fase: plezier, basismotoriek, balgewenning. Korte aandachtsspanne, veel variatie, geen tactiek. Oefeningen max 5 min per onderdeel.',
  'U10': 'Leeftijd 8-10 jaar. Leren to Train: bal aannemen, passen, dribbelen centraal. Eenvoudige 1v1 situaties en kleine partijvormen (3v3, 4v4). Enthousiast en spelend leren.',
  'U12': 'Leeftijd 10-12 jaar. Technische verfijning. Introductie basisprincipes aanval/verdediging. Positiespel begint. Kan complexere oefenvormen aan, wil competitie-element.',
  'U14': 'Leeftijd 12-14 jaar. Training to Train. Tactisch inzicht groeit snel. Pressie, dieptespel, individuele acties en 1v1 dominantie. Hoge motivatie bij uitdagende opdrachten.',
  'U16': 'Leeftijd 14-16 jaar. Specialisatie. Positie-specifieke taken en verantwoordelijkheden. Systemen, omschakelen, hoge intensiteit. Professionele aanpak spreekt aan.',
};

const SKILL_LABELS: Record<string, string> = {
  snelheid: 'Snelheid & Explosiviteit',
  passing: 'Passing & Samenspel',
  techniek: 'Techniek & Balbeheersing',
  schot: 'Schot & Afwerking',
  verdedigen: 'Verdedigen & Duel',
  inzicht: 'Spelinzicht & Positie',
  mentaliteit: 'Mentaliteit & Inzet',
};

function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

async function callAIStructured<T>(prompt: string): Promise<T | null> {
  const raw = await callAI(prompt, 3, 1500, { max_tokens: 2000, temperature: 0.45 });
  try {
    return JSON.parse(extractJSON(raw)) as T;
  } catch {
    console.error('JSON parse failed, raw response:', raw.slice(0, 200));
    return null;
  }
}

export function detectAgeGroup(age: string): string {
  const n = parseInt(age, 10);
  if (isNaN(n)) return 'U12';
  if (n <= 8) return 'U8';
  if (n <= 10) return 'U10';
  if (n <= 12) return 'U12';
  if (n <= 14) return 'U14';
  return 'U16';
}

export function planToWhatsAppText(plan: StructuredTrainingPlan, playerName?: string): string {
  const difficultyStars = '⭐'.repeat(plan.difficulty);
  const header = playerName
    ? `🏆 TRAININGSPLAN — ${playerName}\n`
    : `🏆 TRAININGSSESSIE\n`;

  const sectionEmoji: Record<string, string> = {
    warming_up: '🔵',
    kern: '🟢',
    oefenvorm: '🟣',
    spelvorm: '🟠',
    cooling_down: '⚪',
  };

  const sections = plan.sections.map(s => {
    const emoji = sectionEmoji[s.type] ?? '⚫';
    const label = s.type.replace('_', '-').toUpperCase();
    let text = `${emoji} ${label} — ${s.title} (${s.duration} min)\n${s.description}`;
    if (s.materials) text += `\n📦 Materiaal: ${s.materials}`;
    if (s.coaching_points?.length) {
      text += `\n📌 Let op:\n${s.coaching_points.map(p => `  • ${p}`).join('\n')}`;
    }
    if (s.progression) text += `\n➡️ Progressie: ${s.progression}`;
    return text;
  }).join('\n\n');

  return `${header}🎯 ${plan.focus_theme} | ${difficultyStars} | ⏱ ${plan.duration_minutes} min\n\n💡 Weekdoel: ${plan.weekly_goal}\n\n${sections}\n\nSucces! 💪`;
}

export async function generateIndividualPlan(
  player: Player,
  period: string
): Promise<StructuredTrainingPlan | null> {
  const currentEval = player.evaluations[period];
  if (!currentEval) return null;

  const ageGroup = detectAgeGroup(player.age);
  const skillEntries = Object.entries(currentEval.skills) as [keyof typeof SKILL_LABELS, number][];
  const sorted = [...skillEntries].sort(([, a], [, b]) => b - a);
  const topSkills = sorted.slice(0, 2).map(([k]) => SKILL_LABELS[k] ?? k).join(' & ');
  const bottomSkills = sorted.slice(-2).map(([k]) => SKILL_LABELS[k] ?? k).join(' & ');
  const skillLines = skillEntries.map(([k, v]) => `  ${SKILL_LABELS[k] ?? k}: ${v}/10`).join('\n');

  const prompt = `Je bent een UEFA Pro License jeugdvoetbaltrainer gespecialiseerd in de KNVB-methodiek. Maak een persoonlijk thuis-trainingsplan.

SPELERSPROFIEL:
- Naam: ${player.name}
- Leeftijdsgroep: ${ageGroup}
- Positie: ${player.position || 'niet opgegeven'}
- ${AGE_GROUP_CONTEXT[ageGroup]}

EVALUATIE (${period}):
${skillLines}
- Wedstrijdcijfer: ${currentEval.matchRating}/10
- Coach notities: "${currentEval.comments || 'geen'}"

Sterkste skills: ${topSkills}
Verbeterpunten: ${bottomSkills}

GENEREER een gevarieerd, leuk en motiverend 45-minuten THUISTRAININGSPLAN. Focus op de verbeterpunten maar verwerk ook de sterke kanten positief. Zorg voor ${ageGroup}-geschikte oefeningen.

Geef ALLEEN een geldig JSON object terug zonder markdown of uitleg:
{
  "focus_theme": "kort hoofdthema (bv. Techniek & Balbezit)",
  "age_group": "${ageGroup}",
  "duration_minutes": 45,
  "weekly_goal": "één concrete, motiverende doelstelling voor deze week",
  "difficulty": 1,
  "sections": [
    {
      "type": "warming_up",
      "title": "naam van de warming-up",
      "duration": 8,
      "description": "exacte stap-voor-stap uitleg van de oefening",
      "materials": "bal, 4 flesjes of pionnen",
      "coaching_points": ["eerste coachingspunt", "tweede coachingspunt"],
      "progression": "hoe maak je het moeilijker"
    },
    {
      "type": "kern",
      "title": "naam oefening 1",
      "duration": 12,
      "description": "...",
      "materials": "...",
      "coaching_points": ["...", "..."],
      "progression": "..."
    },
    {
      "type": "kern",
      "title": "naam oefening 2",
      "duration": 12,
      "description": "...",
      "materials": "...",
      "coaching_points": ["...", "..."],
      "progression": "..."
    },
    {
      "type": "cooling_down",
      "title": "Afsluiting",
      "duration": 5,
      "description": "rustige afsluiting met rek- en strekoefeningen",
      "materials": "",
      "coaching_points": ["Rustig ademen en genieten van de training"],
      "progression": ""
    }
  ],
  "generated_at": "${new Date().toISOString()}"
}

REGELS: Alle tekst Nederlands. Thuismateriaal alleen. Duur sections optelt tot 45 min. difficulty: 1=basis, 2=gevorderd, 3=uitdagend. Alleen JSON teruggeven.`;

  return callAIStructured<StructuredTrainingPlan>(prompt);
}

export async function generateTeamSession(
  theme: string,
  ageGroup: string,
  duration: number
): Promise<StructuredTrainingPlan | null> {
  const warmup = Math.round(duration * 0.15);
  const oef1 = Math.round(duration * 0.22);
  const oef2 = Math.round(duration * 0.22);
  const spel = Math.round(duration * 0.28);
  const cool = duration - warmup - oef1 - oef2 - spel;

  const prompt = `Je bent een UEFA Pro License jeugdvoetbaltrainer gespecialiseerd in de KNVB-methodiek. Ontwerp een complete trainingssessie voor een team.

PARAMETERS:
- Thema: ${theme}
- Leeftijdsgroep: ${ageGroup}
- Duur: ${duration} minuten
- ${AGE_GROUP_CONTEXT[ageGroup]}

KNVB SESSIESTRUCTUUR (verplicht):
1. Warming-up: vrije bal + thema-introductie (${warmup} min)
2. Oefenvorm 1: geïsoleerde technische oefening (${oef1} min)
3. Oefenvorm 2: oefening in bredere context (${oef2} min)
4. Spelvorm: vrij spel met thema als voorwaarde (${spel} min)
5. Cooling-down: rustige afsluiting + evaluatie (${cool} min)

Geef ALLEEN een geldig JSON object terug zonder markdown of uitleg:
{
  "focus_theme": "${theme}",
  "age_group": "${ageGroup}",
  "duration_minutes": ${duration},
  "weekly_goal": "concrete doelstelling voor deze sessie",
  "difficulty": 2,
  "sections": [
    {
      "type": "warming_up",
      "title": "naam warming-up spel",
      "duration": ${warmup},
      "description": "exacte beschrijving met veldafmetingen en spelersaantallen",
      "materials": "benodigde materialen",
      "coaching_points": ["coachingspunt 1", "coachingspunt 2", "coachingspunt 3"],
      "progression": "progressie-optie om het uitdagender te maken"
    },
    {
      "type": "oefenvorm",
      "title": "naam eerste oefenvorm",
      "duration": ${oef1},
      "description": "exacte beschrijving met veldafmetingen, spelersaantallen en regels",
      "materials": "...",
      "coaching_points": ["...", "...", "..."],
      "progression": "..."
    },
    {
      "type": "oefenvorm",
      "title": "naam tweede oefenvorm",
      "duration": ${oef2},
      "description": "...",
      "materials": "...",
      "coaching_points": ["...", "...", "..."],
      "progression": "..."
    },
    {
      "type": "spelvorm",
      "title": "spelvorm met thema als conditie",
      "duration": ${spel},
      "description": "vrij spel op aangepast veld met specifieke spelregel die het thema versterkt",
      "materials": "...",
      "coaching_points": ["...", "...", "..."],
      "progression": "..."
    },
    {
      "type": "cooling_down",
      "title": "Cooling-down & Evaluatie",
      "duration": ${cool},
      "description": "rustige afsluiting, rek-/strekoefeningen, evaluatievraag aan de groep",
      "materials": "",
      "coaching_points": ["Wat ging er goed?", "Één verbeterpunt voor volgende keer"],
      "progression": ""
    }
  ],
  "generated_at": "${new Date().toISOString()}"
}

REGELS: Alle tekst Nederlands. Concrete veldafmetingen (bv. 20x15 meter). Spelersaantallen (bv. 4v4). Alleen JSON teruggeven.`;

  return callAIStructured<StructuredTrainingPlan>(prompt);
}
