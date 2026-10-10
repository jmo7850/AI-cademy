import type { StudyCourse } from '../domain/types';
import type { Attempt, CourseProgress, ExamAttempt } from '../store/schema';

export type MasteryLevel = 'none' | 'learning' | 'familiar' | 'mastered';

export interface ConceptMastery {
  conceptId: string;
  score: number; // 0..1 recency-weighted
  attempts: number;
  correct: number;
  distinctCorrectItems: number;
  level: MasteryLevel;
  trend: 'up' | 'down' | 'flat';
}

const WINDOW = 8;
const DECAY = 0.7;

/** Correct answers given with low confidence count partially toward mastery. */
const credit = (a: Attempt) => (a.correct ? (a.confidence === 1 ? 0.5 : a.confidence === 2 ? 0.8 : 1) : 0);

function weighted(list: Attempt[]): number {
  let num = 0;
  let den = 0;
  list.forEach((a, i) => {
    const w = DECAY ** i;
    num += w * credit(a);
    den += w;
  });
  return den ? num / den : 0;
}

/**
 * Mastery is per concept. "Mastered" requires a high recency-weighted score,
 * at least three attempts, two different items answered correctly, and a
 * correct most-recent attempt, so one lucky guess cannot count as mastery.
 */
export function conceptMastery(attempts: Attempt[], conceptId: string): ConceptMastery {
  const relevant = attempts.filter((a) => a.conceptIds.includes(conceptId)).sort((a, b) => b.at.localeCompare(a.at));
  const recent = relevant.slice(0, WINDOW);
  const score = weighted(recent);
  const correct = relevant.filter((a) => a.correct).length;
  const distinctCorrectItems = new Set(relevant.filter((a) => a.correct).map((a) => a.itemId)).size;

  let level: MasteryLevel = 'none';
  if (relevant.length > 0) level = 'learning';
  if (relevant.length >= 2 && score >= 0.6) level = 'familiar';
  if (relevant.length >= 3 && score >= 0.8 && distinctCorrectItems >= 2 && recent[0]?.correct) level = 'mastered';

  const older = weighted(relevant.slice(3, 3 + WINDOW));
  const trend = relevant.length < 4 ? 'flat' : score - older > 0.1 ? 'up' : older - score > 0.1 ? 'down' : 'flat';

  return { conceptId, score, attempts: relevant.length, correct, distinctCorrectItems, level, trend };
}

export function courseMastery(course: StudyCourse, attempts: Attempt[]): ConceptMastery[] {
  const own = attempts.filter((a) => a.courseId === course.id || a.context === 'diagnostic');
  return course.concepts.map((c) => conceptMastery(own, c.id));
}

export function weakConcepts(course: StudyCourse, attempts: Attempt[]): ConceptMastery[] {
  return courseMastery(course, attempts)
    .filter((m) => m.attempts > 0 && m.level !== 'mastered' && m.score < 0.7)
    .sort((a, b) => a.score - b.score);
}

/** Items missed at least twice: candidates for targeted remediation. */
export function repeatedMistakes(attempts: Attempt[], courseId?: string): { itemId: string; courseId: string; misses: number }[] {
  const misses = new Map<string, { itemId: string; courseId: string; misses: number }>();
  for (const a of attempts) {
    if (a.correct || (courseId && a.courseId !== courseId)) continue;
    const key = `${a.courseId}:${a.itemId}`;
    const m = misses.get(key) ?? { itemId: a.itemId, courseId: a.courseId, misses: 0 };
    m.misses++;
    misses.set(key, m);
  }
  return [...misses.values()].filter((m) => m.misses >= 2).sort((a, b) => b.misses - a.misses);
}

// ---------- Course status ----------

export type CourseStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'assessment-passed'
  | 'mastery'
  | 'external-recorded';

export const statusLabel: Record<CourseStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  'assessment-passed': 'Practice assessment passed',
  mastery: 'Demonstrated mastery',
  'external-recorded': 'External credential recorded',
};

export interface Readiness {
  /** Mean of the last three exam-mode scores, 0..1, or null if none. */
  examAverage: number | null;
  passedRecent: boolean;
  coverage: number; // share of concepts with at least one attempt
  masteredShare: number;
  label: 'not-enough-data' | 'building' | 'nearly-ready' | 'ready';
}

export function readiness(course: StudyCourse, attempts: Attempt[], exams: ExamAttempt[]): Readiness {
  const pass = (course.blueprint?.passPercent ?? 75) / 100;
  const finished = exams
    .filter((e) => e.courseId === course.id && e.mode === 'exam' && e.finishedAt && e.score !== undefined)
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
  const last3 = finished.slice(0, 3);
  const examAverage = last3.length ? last3.reduce((s, e) => s + (e.score ?? 0), 0) / last3.length : null;
  const passedRecent = finished.length > 0 && (finished[0]!.score ?? 0) >= pass;
  const m = courseMastery(course, attempts);
  const coverage = m.length ? m.filter((x) => x.attempts > 0).length / m.length : 0;
  const masteredShare = m.length ? m.filter((x) => x.level === 'mastered').length / m.length : 0;

  let label: Readiness['label'] = 'not-enough-data';
  if (examAverage !== null) {
    const lastTwoPass = finished.length >= 2 && finished.slice(0, 2).every((e) => (e.score ?? 0) >= pass);
    label = lastTwoPass && coverage >= 0.8 ? 'ready' : examAverage >= pass - 0.1 ? 'nearly-ready' : 'building';
  } else if (coverage > 0) label = 'building';
  return { examAverage, passedRecent, coverage, masteredShare, label };
}

export function courseStatus(
  progress: CourseProgress | undefined,
  course: StudyCourse | undefined,
  attempts: Attempt[],
  exams: ExamAttempt[],
): CourseStatus {
  if (!progress) return 'not-started';
  if (progress.external) return 'external-recorded';
  if (course) {
    const m = courseMastery(course, attempts);
    if (m.length && m.every((x) => x.level === 'mastered')) return 'mastery';
    if (readiness(course, attempts, exams).passedRecent) return 'assessment-passed';
    if (course.lessons.length && course.lessons.every((l) => progress.completedLessons.includes(l.id))) return 'completed';
  } else if (progress.completedLessons.includes('external-course')) {
    // Provider-hosted course the learner marked as finished. Finishing study
    // never implies the external credential was earned.
    return 'completed';
  }
  return 'in-progress';
}
