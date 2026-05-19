export interface SkillScores {
  snelheid: number;
  passing: number;
  techniek: number;
  schot: number;
  verdedigen: number;
  inzicht: number;
  mentaliteit: number;
}

export interface FitnessScores {
  yoyo: string;
  cooper: string;
  sprint: string;
}

export interface TestCategory {
  [key: string]: string;
}

export interface TestState {
  balvaardigheid: TestCategory;
  schietenPassing: TestCategory;
  fysiekConditie: TestCategory;
  coordinatieInzicht: TestCategory;
}

export interface Evaluation {
  skills: SkillScores;
  matchRating: number;
  comments: string;
  trainingPlan: string;
  fitness: FitnessScores;
  tests: TestState;
}

export interface Player {
  id: string;
  name: string;
  team_id: string;
  age: string;
  preferred_foot: string;
  position: string;
  pin: string;
  avatar_url: string;
  evaluations: Record<string, Evaluation>;
  completed_homework_ids: string[];
  weekly_question_responses: string[];
}

export interface Team {
  id: string;
  coach_id: string;
  team_name: string;
  team_class: string;
  weekly_questions: string[];
  assigned_homework_ids: string[];
}

export interface CustomHomework {
  id: string;
  team_id: string;
  week?: string;
  title: string;
  description: string;
  youtube_url?: string;
}

export interface UserData {
  role: 'coach' | 'player';
  teamId: string;
  uid: string;
  id?: string;
}

export interface SessionUser {
  id: string;
}

export interface HomeworkSuggestion {
  title: string;
  description: string;
}

export interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

export interface LineChartDataPoint {
  name: string;
  'Gem. Skill': number;
  'Wedstrijdcijfer': number;
}
