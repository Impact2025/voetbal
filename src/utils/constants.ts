import type { HomeworkSuggestion, TestState, Evaluation } from '../types';

export const NEON_COLOR = '#00FF9D';
export const COACH_COLOR = '#059669';

export interface SkillGroupDef {
  key: string;
  label: string;
  color: string;
  skills: { key: string; label: string }[];
}

export const SKILL_GROUPS: SkillGroupDef[] = [
  {
    key: 'techniek',
    label: 'Techniek',
    color: '#f59e0b',
    skills: [
      { key: 'rechterbeen', label: 'Rechterbeen' },
      { key: 'linkerbeen', label: 'Linkerbeen' },
      { key: 'aannemen', label: 'Aannemen' },
      { key: 'passen', label: 'Passen' },
      { key: 'passeerbewegingen', label: 'Passeerbewegingen' },
      { key: 'scoren', label: 'Scoren' },
      { key: 'aanvallend_1v1', label: '1v1 Aanvallend' },
      { key: 'verdedigend_1v1', label: '1v1 Verdedigen' },
    ],
  },
  {
    key: 'fysiek',
    label: 'Fysiek',
    color: '#3b82f6',
    skills: [
      { key: 'snelheid', label: 'Snelheid' },
      { key: 'wendbaarheid', label: 'Wendbaarheid' },
      { key: 'duelkracht', label: 'Duelkracht' },
    ],
  },
  {
    key: 'mentaliteit',
    label: 'Mentaliteit',
    color: '#a78bfa',
    skills: [
      { key: 'trainingsmentaliteit', label: 'Trainingsmentaliteit' },
      { key: 'wedstrijdmentaliteit', label: 'Wedstrijdmentaliteit' },
      { key: 'leiderschap', label: 'Leiderschap' },
      { key: 'concentratie', label: 'Concentratie' },
      { key: 'discipline', label: 'Discipline' },
      { key: 'aanwezigheid', label: 'Aanwezigheid' },
    ],
  },
];

export const skillKeys: string[] = SKILL_GROUPS.flatMap(g => g.skills.map(s => s.key));

export const SKILL_LABELS: Record<string, string> = Object.fromEntries(
  SKILL_GROUPS.flatMap(g => g.skills.map(s => [s.key, s.label]))
);

export const evaluationPeriods: string[] = ['Check-in 1', 'Check-in 2', 'Check-in 3'];
export const DEFAULT_EVALUATION_PERIODS: string[] = ['Check-in 1', 'Check-in 2', 'Check-in 3'];

export const DEFAULT_WEEKLY_QUESTIONS: string[] = [
  'Wat maakt een team goed?',
  'Wat zijn de eigenschappen van een goede teamgenoot?',
  'Wat kan ik doen om een goede teamgenoot te zijn?',
];

export const initialTestState: TestState = {
  sprintWendbaarheid: { sprint10m: '', sprint25m: '', wendbaarheid: '' },
  balvaardigheid: { dribbel: '', passing: '', schieten: '' },
};

export const testLabels: Record<string, { label: string; tests: Record<string, string> }> = {
  sprintWendbaarheid: { label: 'Sprint & Wendbaarheid', tests: { sprint10m: '10 meter sprint (sec)', sprint25m: '25 meter sprint (sec)', wendbaarheid: 'Wendbaarheid (sec)' } },
  balvaardigheid: { label: 'Balvaardigheid', tests: { dribbel: 'Dribbel (sec)', passing: 'Passing (x/10)', schieten: 'Schieten (x/10)' } },
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

export const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16'] as const;

export const SESSION_DURATIONS = [60, 75, 90] as const;

export const TRAINING_THEMES = [
  { id: 'Balbezit & Positiespel', label: 'Balbezit', emoji: '⚽' },
  { id: 'Afwerking & Schieten', label: 'Afwerking', emoji: '🥅' },
  { id: 'Verdedigen & Duels', label: 'Verdediging', emoji: '🛡️' },
  { id: '1 tegen 1 acties', label: '1 tegen 1', emoji: '⚡' },
  { id: 'Passing & Samenspel', label: 'Passing', emoji: '🎯' },
  { id: 'Druk Zetten & Pressing', label: 'Pressing', emoji: '🔥' },
  { id: 'Omschakelen Aanval-Verdediging', label: 'Omschakelen', emoji: '↔️' },
  { id: 'Snelheid & Explosiviteit', label: 'Snelheid', emoji: '💨' },
  { id: 'Dribbelen & Trucjes', label: 'Dribbelen', emoji: '🌀' },
  { id: 'Standaardsituaties', label: 'Standards', emoji: '📐' },
  { id: 'Keeperstraining', label: 'Keeper', emoji: '🧤' },
  { id: 'Kleine Partijvorm 4v4', label: 'Partijvorm', emoji: '🏟️' },
] as const;

export const makeEvaluation = (): Evaluation => ({
  skills: Object.fromEntries(skillKeys.map(k => [k, 5])) as Evaluation['skills'],
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
