import type { CatalogEntry, StudyCourse } from '../domain/types';
import { schedule } from '../engine/srs';
import type { AppState, Attempt, CourseProgress, CustomPlan, ExamAttempt, GameResult, Profile } from './schema';
import { initialState } from './schema';

export type Action =
  | { type: 'completeOnboarding'; profile: Profile; plan: CustomPlan }
  | { type: 'updateProfile'; patch: Partial<Profile> }
  | { type: 'enroll'; entryId: string; now: string }
  | { type: 'unenroll'; entryId: string }
  | { type: 'toggleBookmark'; entryId: string; now: string }
  | { type: 'setPosition'; entryId: string; lessonId: string; section: number; now: string }
  | { type: 'completeLesson'; entryId: string; lessonId: string; now: string }
  | { type: 'markProviderCourseDone'; entryId: string; done: boolean; now: string }
  | {
      type: 'recordAnswer';
      attempt: Attempt;
      difficulty?: 1 | 2 | 3;
      /** Skip scheduling (e.g. diagnostic answers only seed mastery). */
      noSchedule?: boolean;
    }
  | { type: 'recordExternal'; entryId: string; external: CourseProgress['external'] }
  | { type: 'startExam'; exam: ExamAttempt }
  | { type: 'updateExam'; id: string; patch: Partial<ExamAttempt> }
  | { type: 'discardExam'; id: string }
  | { type: 'savePlan'; plan: CustomPlan; activate?: boolean }
  | { type: 'deletePlan'; id: string }
  | { type: 'setActivePlan'; id: string }
  | { type: 'startProject'; projectId: string; now: string }
  | { type: 'toggleMilestone'; projectId: string; milestoneId: string }
  | { type: 'savePortfolio'; projectId: string; portfolio: NonNullable<AppState['projects'][string]['portfolio']> }
  | { type: 'logSession'; minutes: number; courseId?: string; now: string }
  | { type: 'importCourse'; entry: CatalogEntry; course: StudyCourse }
  | { type: 'removeImported'; entryId: string }
  | { type: 'recheck'; entryId: string; date: string }
  | { type: 'setNote'; key: string; text: string }
  | { type: 'replaceState'; state: AppState }
  | { type: 'recordGame'; result: GameResult }
  | { type: 'reset' };

const MAX_ATTEMPTS = 5000;
const MAX_GAMES = 200;

function ensureCourse(s: AppState, entryId: string, now: string): Record<string, CourseProgress> {
  if (s.courses[entryId]) return s.courses;
  return { ...s.courses, [entryId]: { courseId: entryId, enrolledAt: now, bookmarked: false, completedLessons: [] } };
}

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'completeOnboarding':
      return { ...s, profile: { ...a.profile, onboarded: true }, plans: [...s.plans.filter((p) => p.id !== a.plan.id), a.plan], activePlanId: a.plan.id };
    case 'updateProfile':
      return { ...s, profile: { ...s.profile, ...a.patch } };
    case 'enroll':
      return { ...s, courses: ensureCourse(s, a.entryId, a.now) };
    case 'unenroll': {
      const courses = { ...s.courses };
      delete courses[a.entryId];
      return { ...s, courses };
    }
    case 'toggleBookmark': {
      const courses = ensureCourse(s, a.entryId, a.now);
      const c = courses[a.entryId]!;
      return { ...s, courses: { ...courses, [a.entryId]: { ...c, bookmarked: !c.bookmarked } } };
    }
    case 'setPosition': {
      const courses = ensureCourse(s, a.entryId, a.now);
      const c = courses[a.entryId]!;
      return { ...s, courses: { ...courses, [a.entryId]: { ...c, position: { lessonId: a.lessonId, section: a.section }, lastStudiedAt: a.now } } };
    }
    case 'completeLesson': {
      const courses = ensureCourse(s, a.entryId, a.now);
      const c = courses[a.entryId]!;
      const completedLessons = c.completedLessons.includes(a.lessonId) ? c.completedLessons : [...c.completedLessons, a.lessonId];
      return { ...s, courses: { ...courses, [a.entryId]: { ...c, completedLessons, lastStudiedAt: a.now } } };
    }
    case 'markProviderCourseDone': {
      const courses = ensureCourse(s, a.entryId, a.now);
      const c = courses[a.entryId]!;
      const completedLessons = a.done ? [...new Set([...c.completedLessons, 'external-course'])] : c.completedLessons.filter((l) => l !== 'external-course');
      return { ...s, courses: { ...courses, [a.entryId]: { ...c, completedLessons, lastStudiedAt: a.now } } };
    }
    case 'recordAnswer': {
      const at = a.attempt;
      const attempts = [...s.attempts, at].slice(-MAX_ATTEMPTS);
      if (a.noSchedule) return { ...s, attempts };
      const key = `${at.courseId}:${at.itemId}`;
      const card = schedule(s.reviews[key], { itemId: at.itemId, courseId: at.courseId, conceptIds: at.conceptIds }, { correct: at.correct, confidence: at.confidence, difficulty: a.difficulty }, new Date(at.at));
      return { ...s, attempts, reviews: { ...s.reviews, [key]: card } };
    }
    case 'recordExternal': {
      const c = s.courses[a.entryId];
      if (!c) return s;
      return { ...s, courses: { ...s.courses, [a.entryId]: { ...c, external: a.external } } };
    }
    case 'recordGame':
      return { ...s, games: [...s.games, a.result].slice(-MAX_GAMES) };
    case 'startExam':
      return { ...s, exams: [...s.exams, a.exam] };
    case 'updateExam':
      return { ...s, exams: s.exams.map((e) => (e.id === a.id ? { ...e, ...a.patch } : e)) };
    case 'discardExam':
      return { ...s, exams: s.exams.filter((e) => e.id !== a.id) };
    case 'savePlan': {
      const exists = s.plans.some((p) => p.id === a.plan.id);
      const plans = exists ? s.plans.map((p) => (p.id === a.plan.id ? a.plan : p)) : [...s.plans, a.plan];
      return { ...s, plans, activePlanId: a.activate ? a.plan.id : s.activePlanId };
    }
    case 'deletePlan':
      return { ...s, plans: s.plans.filter((p) => p.id !== a.id), activePlanId: s.activePlanId === a.id ? undefined : s.activePlanId };
    case 'setActivePlan':
      return { ...s, activePlanId: a.id };
    case 'startProject':
      if (s.projects[a.projectId]) return s;
      return { ...s, projects: { ...s.projects, [a.projectId]: { projectId: a.projectId, started: a.now, milestones: [] } } };
    case 'toggleMilestone': {
      const p = s.projects[a.projectId];
      if (!p) return s;
      const milestones = p.milestones.includes(a.milestoneId) ? p.milestones.filter((m) => m !== a.milestoneId) : [...p.milestones, a.milestoneId];
      return { ...s, projects: { ...s.projects, [a.projectId]: { ...p, milestones } } };
    }
    case 'savePortfolio': {
      const p = s.projects[a.projectId];
      if (!p) return s;
      return { ...s, projects: { ...s.projects, [a.projectId]: { ...p, portfolio: a.portfolio } } };
    }
    case 'logSession':
      if (a.minutes <= 0) return s;
      return { ...s, sessions: [...s.sessions, { start: a.now, minutes: a.minutes, courseId: a.courseId }].slice(-2000) };
    case 'importCourse':
      return {
        ...s,
        importedEntries: [...s.importedEntries.filter((e) => e.id !== a.entry.id), a.entry],
        importedCourses: [...s.importedCourses.filter((c) => c.id !== a.course.id), a.course],
      };
    case 'removeImported': {
      const entry = s.importedEntries.find((e) => e.id === a.entryId);
      return {
        ...s,
        importedEntries: s.importedEntries.filter((e) => e.id !== a.entryId),
        importedCourses: s.importedCourses.filter((c) => c.id !== entry?.studyCourseId),
      };
    }
    case 'recheck':
      return { ...s, recheckedOn: { ...s.recheckedOn, [a.entryId]: a.date } };
    case 'setNote':
      return { ...s, notes: { ...s.notes, [a.key]: a.text } };
    case 'replaceState':
      return a.state;
    case 'reset':
      return initialState();
  }
}
