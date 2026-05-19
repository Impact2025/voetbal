import type { HomeworkSuggestion, TestState, Evaluation } from '../types';

export const NEON_COLOR = '#00FF9D';

export const skillKeys: string[] = ['snelheid', 'passing', 'techniek', 'schot', 'verdedigen', 'inzicht', 'mentaliteit'];
export const evaluationPeriods: string[] = ['Check-in 1', 'Check-in 2', 'Check-in 3'];

export const DEFAULT_WEEKLY_QUESTIONS: string[] = [
  'Wat maakt een team goed?',
  'Wat zijn de eigenschappen van een goede teamgenoot?',
  'Wat kan ik doen om een goede teamgenoot te zijn?',
];

export const initialTestState: TestState = {
  balvaardigheid: { hooghouden: '', tikken: '', slalom: '', aannemen: '', wandpass: '' },
  schietenPassing: { nauwkeurigheidSchieten: '', passNauwkeurigheid: '', schotkracht: '' },
  fysiekConditie: { sprint10m: '', herhaaldeSprints: '', uithoudingsvermogen: '', sprongkracht: '' },
  coordinatieInzicht: { reactietest: '', duel1v1: '', spelintelligentie: '' },
};

export const testLabels: Record<string, { label: string; tests: Record<string, string> }> = {
  balvaardigheid: { label: 'Balvaardigheid', tests: { hooghouden: 'Hooghouden (aantal)', tikken: 'Binnen-/Buitenkant Tikken (aantal/30s)', slalom: 'Slalom Dribbel (sec)', aannemen: 'Aannemen uit Lucht (x/10)', wandpass: 'Wandpass Controle (x/30)' } },
  schietenPassing: { label: 'Schieten & Passing', tests: { nauwkeurigheidSchieten: 'Nauwkeurigheid Schieten (x/10)', passNauwkeurigheid: 'Pass Nauwkeurigheid (x/10)', schotkracht: 'Schotkracht (km/u)' } },
  fysiekConditie: { label: 'Fysiek & Conditie', tests: { sprint10m: 'Sprinttest 10m (sec)', herhaaldeSprints: 'Herhaalde Sprints (verschil sec)', uithoudingsvermogen: 'Uithoudingsvermogen (m/6min)', sprongkracht: 'Sprongkracht (cm)' } },
  coordinatieInzicht: { label: 'Coördinatie & Inzicht', tests: { reactietest: 'Reactietest (sec)', duel1v1: '1-tegen-1 Duel (x/5)', spelintelligentie: 'Spelintelligentie (score 1-5)' } },
};

export const homeworkSuggestions: HomeworkSuggestion[] = [
  { title: 'Hooghouden Challenge', description: 'Tel hoe vaak je de bal omhoog kunt houden met voeten, knieën en hoofd. Probeer je record te verbeteren.' },
  { title: 'Doelschieten Precisie', description: 'Zet 2 schoenen of emmers neer als doel en schiet 10 keer met links en 10 keer met rechts.' },
  { title: 'Pionnen Dribbel', description: 'Maak een parcours met flesjes of pionnen en dribbel er zo snel mogelijk doorheen.' },
  { title: '1-tegen-1 Duel', description: 'Speel tegen een broer/zus/ouder: probeer 5x langs de tegenstander te dribbelen.' },
  { title: 'Bal Aannemen uit de Lucht', description: 'Gooi de bal op en neem hem goed aan met voet, dij of borst. De bal mag niet wegstuiteren.' },
  { title: 'Wandpass', description: 'Speel de bal hard tegen een muur en neem hem weer goed aan (10x links, 10x rechts).' },
  { title: 'Trucje Oefenen', description: 'Kies één beweging (schaar, Zidane-draai, elastico) en oefen deze 10 keer.' },
  { title: 'Penalty Shootout', description: 'Laat iemand op doel staan (ouder of broer/zus) en neem 10 penalty\'s.' },
  { title: 'Sprint & Stop', description: 'Dribbel 10 meter met de bal en stop hem precies stil bij een pion of schoen.' },
  { title: 'Target Shooting', description: 'Hang een oude doos of hoepel op als target en mik de bal erdoor.' },
  { title: 'Balcontrole Tik-Tak', description: 'Tik de bal met de binnenkant van je voeten, links en rechts om en om (minstens 50 keer).' },
  { title: 'Dribbel + Schot', description: 'Zet 3 pionnen neer, dribbel erdoorheen en eindig met een schot op doel of tegen een muur.' },
  { title: 'Koppenduels', description: 'Gooi de bal op en probeer hem terug te koppen in een mand, doos of naar een ouder.' },
  { title: 'Balafpak Spel', description: 'Iemand dribbelt, de ander probeert de bal af te pakken zonder te duwen. Wie houdt de bal het langst?' },
  { title: 'Obstacle Course', description: 'Maak een parcours (stoel, bank, emmer) en dribbel erdoorheen op tijd.' },
];

const makeEvaluation = (): Evaluation => ({
  skills: { snelheid: 5, passing: 5, techniek: 5, schot: 5, verdedigen: 5, inzicht: 5, mentaliteit: 5 },
  matchRating: 5,
  comments: '',
  fitness: { yoyo: '', cooper: '', sprint: '' },
  trainingPlan: '',
  tests: JSON.parse(JSON.stringify(initialTestState)) as TestState,
});

export const createInitialEvaluations = (): Record<string, Evaluation> => ({
  'Check-in 1': makeEvaluation(),
  'Check-in 2': makeEvaluation(),
  'Check-in 3': makeEvaluation(),
});
