import type { CatalogEntry, PathStep } from '../domain/types';
import type { Registry } from '../data/registry';
import type { AppState, Profile } from '../store/schema';
import { courseMastery, courseStatus, type CourseStatus } from './mastery';
import { dueCards } from './srs';

export interface PlanItem {
  stepIndex: number;
  stepTitle: string;
  entry: CatalogEntry;
  status: CourseStatus;
  recommended: boolean;
  reasons: string[];
  overridden?: 'include' | 'skip';
}

const DONE: CourseStatus[] = ['completed', 'assessment-passed', 'mastery', 'external-recorded'];
const isFormal = (e: CatalogEntry) => e.credentialType === 'foundational-cert' || e.credentialType === 'professional-cert';

/**
 * Explains, for every course in every step, whether it is recommended and why.
 * Nothing here is binding: the UI lets the learner override any suggestion.
 */
export function personalizePath(steps: PathStep[], state: AppState, reg: Registry, overrides: Record<string, 'include' | 'skip'> = {}): PlanItem[] {
  const p = state.profile;
  const items: PlanItem[] = [];
  steps.forEach((step, stepIndex) => {
    const entries = step.catalogIds.map((id) => reg.entry(id)).filter((e): e is CatalogEntry => !!e);
    // Formal certifications in one step are always alternatives; chooseOne steps make every entry one.
    const pool = step.chooseOne ? entries : entries.filter(isFormal);
    const preferred = pickPreferred(pool, p);

    for (const entry of entries) {
      const course = reg.courseForEntry(entry.id);
      const status = courseStatus(state.courses[entry.id], course, state.attempts, state.exams);
      const reasons: string[] = [step.why];
      let recommended = true;

      if (DONE.includes(status)) {
        recommended = false;
        reasons.push('You have already finished this, so it is skipped.');
      }
      if (entry.availability.value === 'retired') {
        recommended = false;
        reasons.push('This credential is retired.');
      }
      if (pool.length > 1 && pool.includes(entry) && entry !== preferred) {
        recommended = false;
        reasons.push(`Alternative to ${preferred?.title}. ${step.chooseOne ? 'One of these is enough for this step.' : 'One foundational certification is enough for this step.'}`);
      }
      if (pool.length > 1 && entry === preferred) {
        reasons.push(p.providers.includes(entry.provider) ? 'Matches your preferred provider.' : 'Suggested default; switch to another provider if you prefer.');
      }
      if (course && recommended) {
        const m = courseMastery(course, state.attempts);
        const known = m.filter((x) => x.level === 'mastered' || x.level === 'familiar').length;
        if (m.length && known / m.length >= 0.7) {
          recommended = false;
          reasons.push('Your answers show you already know most of this. Skim it or take the practice exam instead.');
        }
      }
      if (entry.id === 'academy-dev-foundations' && p.experience === 'developer' && recommended) {
        recommended = false;
        reasons.push('You said you already develop software, so this is optional.');
      }
      if (entry.credentialFree.value === false && p.budget === 'free' && !entry.exam) {
        reasons.push('This program is paid. Your budget is set to free, so look for a free alternative in this step or check for financial aid.');
      } else if (entry.credentialFree.value === false && p.budget === 'free') {
        const fee = entry.exam?.feeUSD?.value;
        reasons.push(`Study is ${entry.learningCost.value === 'free' ? 'free' : 'partly free'}, but the exam is paid${fee ? ` ($${fee})` : ''}. Your budget is set to free, so plan for this or study without booking the exam.`);
      }
      const o = overrides[entry.id];
      if (o) {
        recommended = o === 'include';
        reasons.push(o === 'include' ? 'You chose to include this.' : 'You chose to skip this.');
      }
      items.push({ stepIndex, stepTitle: step.title, entry, status, recommended, reasons, overridden: o });
    }
  });
  return items;
}

function pickPreferred(formal: CatalogEntry[], p: Profile): CatalogEntry | undefined {
  const available = formal.filter((e) => e.availability.value !== 'retired');
  return available.find((e) => p.providers.includes(e.provider)) ?? available[0];
}

// ---------- One recommended next action ----------

export type NextAction =
  | { kind: 'onboard'; label: string; reason: string }
  | { kind: 'resume-exam'; label: string; reason: string; examId: string }
  | { kind: 'review'; label: string; reason: string; count: number }
  | { kind: 'continue'; label: string; reason: string; entryId: string }
  | { kind: 'start'; label: string; reason: string; entryId: string }
  | { kind: 'exam'; label: string; reason: string; courseId: string }
  | { kind: 'browse'; label: string; reason: string };

/** Items per review session, roughly one item per minute of the chosen session length. */
export const reviewBatchSize = (p: Profile) => Math.max(5, p.sessionMinutes);

export function nextAction(state: AppState, reg: Registry, now: Date): NextAction {
  if (!state.profile.onboarded) return { kind: 'onboard', label: 'Set up your goal (2 minutes)', reason: 'A few answers let the app suggest where to start.' };

  const openExam = state.exams.find((e) => !e.finishedAt);
  if (openExam) {
    const c = reg.course(openExam.courseId);
    return { kind: 'resume-exam', label: `Resume ${c?.title ?? 'practice exam'}`, reason: `You paused at question ${openExam.current + 1} of ${openExam.questionIds.length}.`, examId: openExam.id };
  }

  const due = dueCards(state.reviews, now);
  if (due.length) {
    const n = Math.min(due.length, reviewBatchSize(state.profile));
    return { kind: 'review', label: `Review ${n} item${n === 1 ? '' : 's'} (about ${n} min)`, reason: 'These are due now. Reviewing on schedule is the fastest way to make knowledge stick.', count: due.length };
  }

  const inProgress = Object.values(state.courses)
    .filter((c) => c.position && reg.courseForEntry(c.courseId))
    .sort((a, b) => (b.lastStudiedAt ?? '').localeCompare(a.lastStudiedAt ?? ''));
  for (const cp of inProgress) {
    const course = reg.courseForEntry(cp.courseId)!;
    const lessonsLeft = course.lessons.filter((l) => !cp.completedLessons.includes(l.id));
    if (lessonsLeft.length) {
      const lesson = course.lessons.find((l) => l.id === cp.position!.lessonId) ?? lessonsLeft[0]!;
      return { kind: 'continue', label: `Continue: ${lesson.title}`, reason: `${course.title}. ${lessonsLeft.length} lesson${lessonsLeft.length === 1 ? '' : 's'} left.`, entryId: cp.courseId };
    }
    if (course.blueprint && !state.exams.some((e) => e.courseId === course.id && e.finishedAt)) {
      return { kind: 'exam', label: `Take a practice exam: ${course.title}`, reason: 'You finished the lessons. A practice exam shows which domains need work.', courseId: course.id };
    }
  }

  const plan = state.plans.find((pl) => pl.id === state.activePlanId);
  if (plan) {
    const next = personalizePath(plan.steps, state, reg, plan.overrides).find((i) => i.recommended && i.status === 'not-started');
    if (next) return { kind: 'start', label: `Start: ${next.entry.title}`, reason: `Next in "${plan.title}" (step ${next.stepIndex + 1}: ${next.stepTitle}).`, entryId: next.entry.id };
  }

  return { kind: 'browse', label: 'Pick a course from the catalog', reason: 'Your current plan has no unstarted recommended steps.' };
}
