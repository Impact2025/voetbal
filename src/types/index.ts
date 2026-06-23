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
  role: 'club_admin' | 'coach' | 'player' | 'parent' | 'superadmin';
  teamId?: string;
  clubId?: string;
  uid: string;
  id?: string;
  linkedPlayerId?: string;
}

export interface ParentLink {
  id: string;
  player_id: string;
  team_id: string;
  parent_id: string | null;
  link_code: string;
  verified: boolean;
  created_at: string;
}

export interface NotificationPrefs {
  parent_id: string;
  weekly_digest: boolean;
  critical_alerts: boolean;
  channel: 'email' | 'push' | 'both';
  detail_level: 'light' | 'full';
  updated_at: string;
}

export interface SessionUser {
  id: string;
}

export interface TeamEnriched {
  id: string;
  team_name: string;
  team_class: string;
  evaluation_periods: string[];
  assigned_homework_ids: string[];
  players: { id: string; evaluations?: Record<string, unknown>; completed_homework_ids: string[] }[];
  avgScore: number;
  firstScore: number;
  attendanceRate: number | null;
  hwRate: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
  trendDelta: number;
}

export interface SentMessage {
  id: string;
  club_id: string;
  to_emails: string[];
  to_names: string[];
  subject: string;
  body: string;
  sent_at: string;
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

// ── Inzet-DNA / Player Card ─────────────────────────────────────────────────

export type StatAxis = 'consistentie' | 'werkethiek' | 'techniek' | 'focus' | 'team_spirit';

export type CardTier = 'brons' | 'zilver' | 'goud' | 'legendary';

export interface PlayerStats {
  player_id: string;
  team_id: string;
  consistentie: number;
  werkethiek: number;
  techniek: number;
  focus: number;
  team_spirit: number;
  tier: CardTier;
  total_xp: number;
  prev_snapshot: Record<StatAxis, number> | null;
  snapshot_at: string | null;
  updated_at: string;
}

export interface StatEvent {
  id: string;
  player_id: string;
  team_id: string;
  event_type: 'homework_done' | 'video_submitted' | 'challenge_done' | 'reflection' | 'teamspirit';
  axis: StatAxis;
  xp: number;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// ── Challenges ───────────────────────────────────────────────────────────────

export type ChallengeCategory = 'techniek' | 'inzicht' | 'snelheid' | 'mentaliteit';

export interface Challenge {
  id: string;
  title: string;
  category: ChallengeCategory;
  age_min: number;
  age_max: number;
  setup: string;
  win_condition: string;
  youtube_url?: string;
  reflection_prompt?: string;
  ai_feedback_hint?: string;
}

export interface ChallengeCompletion {
  id: string;
  challenge_id: string;
  player_id: string;
  team_id: string;
  reflection?: string;
  ai_feedback?: string;
  completed_at: string;
}

// ── Training Library ─────────────────────────────────────────────────────────

export type TrainingExerciseType = 'warming_up' | 'techniek' | 'partijvorm';

export interface TrainingExercise {
  type: TrainingExerciseType;
  title: string;
  content: string;
}

export interface TrainingLibraryExercises {
  session_a: TrainingExercise[];
  session_b: TrainingExercise[];
}

export interface TrainingLibraryRow {
  id: string;
  age_group: string;
  training_number: number;
  exercises: TrainingLibraryExercises;
}

export interface SeasonWeekPlan {
  id: string;
  age_group: string;
  week_number: number;
  sequence_number: number;
  training_a_number: number | null;
  training_b_number: number | null;
  homework: string | null;
  challenge: string | null;
  is_vacation: boolean;
  vacation_label: string | null;
}

export interface ClubTrainingConfig {
  id: string;
  club_id: string;
  age_group: string;
  is_active: boolean;
  season_start_year: number;
  season_start_week: number;
}

export interface ClubWeekOverride {
  id: string;
  club_id: string;
  age_group: string;
  week_number: number;
  is_enabled: boolean;
  custom_notes: string | null;
}

// ── Streaks ──────────────────────────────────────────────────────────────────

export interface Streak {
  player_id: string;
  week_start: string;
  activities_count: number;
  week_goal: number;
  best_week_count: number;
  recovery_used: boolean;
  flame_state: 'active' | 'sleep' | 'complete';
  updated_at: string;
}
