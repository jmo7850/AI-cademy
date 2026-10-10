import type { Answer, CatalogEntry, PathStep, StudyCourse } from '../domain/types';

/** Bump when the persisted shape changes, and add a migration step. */
export const SCHEMA_VERSION = 3;

export type CareerGoal =
  | 'ai-foundations'
  | 'cloud-ai'
  | 'ai-app-dev'
  | 'agent-runtime'
  | 'local-llm';

export interface Profile {
  onboarded: boolean;
  goal: CareerGoal;
  experience: 'none' | 'some' | 'developer';
  learningStyle: 'reading' | 'practice' | 'mixed';
  weeklyHours: number;
  budget: 'free' | 'low' | 'any'; // low = up to ~$100 per exam
  providers: string[];
  timelineWeeks: number;
  sessionMinutes: 5 | 10 | 20 | 30;
  breakPrompts: boolean;
  reminders: boolean;
  theme: 'system' | 'light' | 'dark';
  /** Show the Arcade (games) in navigation and on Home. */
  games: boolean;
}

/** Leitner/SM-2 style schedule for one reviewable item. */
export interface ReviewCard {
  itemId: string; // question id or flashcard id
  courseId: string;
  conceptIds: string[];
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  due: string; // ISO timestamp
  lastResult?: 'correct' | 'incorrect';
}

export interface Attempt {
  itemId: string;
  courseId: string;
  conceptIds: string[];
  correct: boolean;
  confidence?: 1 | 2 | 3;
  at: string;
  context: 'lesson' | 'review' | 'exam' | 'diagnostic' | 'flashcard' | 'game';
}

export interface CourseProgress {
  courseId: string; // catalog id
  enrolledAt: string;
  bookmarked: boolean;
  completedLessons: string[];
  /** Resume point inside the study course. */
  position?: { lessonId: string; section: number };
  lastStudiedAt?: string;
  external?: {
    earnedOn: string;
    credentialId?: string;
    verificationUrl?: string;
  };
}

export interface ExamAttempt {
  id: string;
  courseId: string; // study course id
  mode: 'practice' | 'exam';
  timed: boolean;
  minutes?: number;
  /** Active time spent, so a paused timed attempt resumes with the same time left. */
  elapsedMs?: number;
  startedAt: string;
  finishedAt?: string;
  questionIds: string[];
  /** Option shuffles, so a resumed attempt shows the same layout. */
  seed: number;
  answers: Record<string, Answer>;
  flagged: string[];
  current: number;
  score?: number; // 0..1
  byDomain?: Record<string, { correct: number; total: number }>;
}

export interface CustomPlan {
  id: string;
  title: string;
  steps: PathStep[];
  createdFrom?: string; // template id
  /** Learner overrides of recommendations: catalogId -> include/skip. */
  overrides?: Record<string, 'include' | 'skip'>;
}

export interface ProjectProgress {
  projectId: string;
  started: string;
  milestones: string[];
  portfolio?: {
    summary: string;
    skills: string[];
    evidenceUrl: string;
    addedOn: string;
  };
}

export interface StudySession {
  start: string;
  minutes: number;
  courseId?: string;
}

export interface AppState {
  schemaVersion: number;
  profile: Profile;
  courses: Record<string, CourseProgress>;
  attempts: Attempt[];
  reviews: Record<string, ReviewCard>;
  exams: ExamAttempt[];
  plans: CustomPlan[];
  activePlanId?: string;
  projects: Record<string, ProjectProgress>;
  sessions: StudySession[];
  /** User-imported catalog entries and study courses (origin: 'user'). */
  importedEntries: CatalogEntry[];
  importedCourses: StudyCourse[];
  /** User re-checks of official catalog facts: catalogId -> ISO date. */
  recheckedOn: Record<string, string>;
  notes: Record<string, string>;
  /** Finished games in the Arcade (most recent last, capped). */
  games: GameResult[];
}

export type GameKind = 'run' | 'match' | 'boss';

export interface GameResult {
  id: string;
  kind: GameKind;
  courseId: string;
  /** Blueprint domain for boss battles. */
  domainId?: string;
  at: string;
  correct: number;
  total: number;
  won: boolean;
}

export const defaultProfile: Profile = {
  onboarded: false,
  goal: 'ai-foundations',
  experience: 'none',
  learningStyle: 'mixed',
  weeklyHours: 5,
  budget: 'low',
  providers: [],
  timelineWeeks: 12,
  sessionMinutes: 10,
  breakPrompts: true,
  reminders: false,
  theme: 'system',
  games: true,
};

export function initialState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { ...defaultProfile },
    courses: {},
    attempts: [],
    reviews: {},
    exams: [],
    plans: [],
    projects: {},
    sessions: [],
    importedEntries: [],
    importedCourses: [],
    recheckedOn: {},
    notes: {},
    games: [],
  };
}
