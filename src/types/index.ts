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

export interface TrainingPlanSection {
  type: 'warming_up' | 'kern' | 'oefenvorm' | 'spelvorm' | 'cooling_down';
  title: string;
  duration: number;
  description: string;
  materials?: string;
  coaching_points: string[];
  progression?: string;
}

export interface StructuredTrainingPlan {
  focus_theme: string;
  age_group: string;
  duration_minutes: number;
  weekly_goal: string;
  difficulty: 1 | 2 | 3;
  sections: TrainingPlanSection[];
  generated_at: string;
}

export interface TeamSession {
  id: string;
  team_id: string;
  title: string;
  plan: StructuredTrainingPlan;
  created_at: string;
  executed_at?: string;
}

export interface Evaluation {
  skills: SkillScores;
  matchRating: number;
  comments: string;
  trainingPlan: string;
  structuredPlan?: StructuredTrainingPlan;
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
  club_id?: string;
  team_name: string;
  team_class: string;
  weekly_questions: string[];
  assigned_homework_ids: string[];
  evaluation_periods: string[];
}

export interface CustomHomework {
  id: string;
  team_id: string;
  week?: string;
  title: string;
  description: string;
  youtube_url?: string;
}

export interface Club {
  id: string;
  name: string;
  logo_url?: string;
}

export interface AttendanceRecord {
  id: string;
  team_id: string;
  player_id: string;
  session_date: string;
  session_type: 'training' | 'wedstrijd';
  present: boolean;
  notes?: string;
}

export interface UserData {
  role: 'club_admin' | 'coach' | 'player';
  teamId?: string;
  clubId?: string;
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

export type SubmissionStatus = 'pending' | 'processing' | 'done' | 'error';

export interface HomeworkSubmission {
  id: string;
  player_id: string;
  homework_id: string;
  team_id: string;
  video_url: string | null;
  ai_feedback: string | null;
  feedback_status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}
