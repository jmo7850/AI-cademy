import type { Question, StudyCourse } from '../domain/types';
import type { CourseProgress, ReturnCheck } from '../store/schema';
import { returnCheckSources } from '../data/returnChecks';
import { seededShuffle } from './random';

/**
 * Honest status for study done outside Poqeni. Poqeni can test what a learner understands now, but it cannot
 * see whether a provider course was completed, so nothing here ever says "confirmed" or "earned".
 * Only a provider-side check (a later phase) could, and it would say who confirmed it.
 */

export const RETURN_CHECK_SIZE = 5;
/** Fewer questions than this make a pass meaningless, so no check is offered. */
export const RETURN_CHECK_MIN = 3;
export const RETURN_CHECK_PASS = 0.8;

export type OutsideLevel = 'none' | 'self-reported' | 'with-note' | 'check-tried' | 'check-passed';

export interface OutsideStatus {
  level: OutsideLevel;
  /** Short badge text. */
  label: string;
  /** What is and is not known, one plain sentence each. */
  lines: string[];
}

export const isPass = (c: ReturnCheck): boolean => c.total >= RETURN_CHECK_MIN && c.correct / c.total >= RETURN_CHECK_PASS;

function bestCheck(checks: ReturnCheck[]): ReturnCheck | undefined {
  return [...checks].sort((a, b) => b.correct / b.total - a.correct / a.total || b.at.localeCompare(a.at))[0];
}

export function outsideStatus(p: CourseProgress | undefined): OutsideStatus {
  if (!p) return { level: 'none', label: 'Not finished yet', lines: [] };
  const finished = p.completedLessons.includes('external-course');
  const checks = (p.checks ?? []).filter((c) => c.total > 0);
  const best = bestCheck(checks);
  const passed = checks.some(isPass);
  const lines: string[] = [];
  if (finished) lines.push('You said you finished this.');
  if (p.evidence) lines.push('You added a note or link. Poqeni keeps it but does not check it.');
  if (best) {
    lines.push(passed
      ? `You passed Poqeni's check on this topic (${best.correct} of ${best.total}).`
      : `You tried Poqeni's check on this topic (best so far ${best.correct} of ${best.total}).`);
  }
  const level: OutsideLevel = passed ? 'check-passed' : best ? 'check-tried' : p.evidence ? 'with-note' : finished ? 'self-reported' : 'none';
  const label = { none: 'Not finished yet', 'self-reported': 'Said finished', 'with-note': 'Finished, note added', 'check-tried': 'Check tried', 'check-passed': 'Check passed' }[level];
  return { level, label, lines };
}

/** What a recorded external credential means. Only the provider can confirm it. */
export function credentialClaim(p: CourseProgress | undefined): { label: string; text: string } | undefined {
  if (!p?.external) return undefined;
  return {
    label: 'You recorded this credential',
    text: `You recorded earning this on ${p.external.earnedOn}. Poqeni has not verified it; only the provider can.`,
  };
}

export interface ReturnCheckPlan {
  course: StudyCourse;
  /** Concepts the questions are drawn from, when the bank has enough on them. */
  conceptIds?: string[];
  available: number;
}

/** The question bank to use for an outside course, or undefined when Poqeni has no check for it yet. */
export function returnCheckPlan(entryId: string, courseById: (id: string) => StudyCourse | undefined): ReturnCheckPlan | undefined {
  const src = returnCheckSources[entryId];
  const course = src && courseById(src.courseId);
  if (!src || !course) return undefined;
  const onTopic = src.conceptIds?.length ? course.questions.filter((q) => q.conceptIds.some((c) => src.conceptIds!.includes(c))) : [];
  if (onTopic.length >= RETURN_CHECK_MIN) return { course, conceptIds: src.conceptIds, available: onTopic.length };
  if (course.questions.length >= RETURN_CHECK_MIN) return { course, available: course.questions.length };
  return undefined;
}

/** Up to five questions, unseen ones first, in an order that changes with the seed. */
export function pickReturnCheck(plan: ReturnCheckPlan, answeredIds: ReadonlySet<string>, seed: number, n = RETURN_CHECK_SIZE): Question[] {
  const pool = plan.conceptIds ? plan.course.questions.filter((q) => q.conceptIds.some((c) => plan.conceptIds!.includes(c))) : plan.course.questions;
  const shuffled = seededShuffle(pool, `${plan.course.id}:return`, seed);
  const unseen = shuffled.filter((q) => !answeredIds.has(q.id));
  const seen = shuffled.filter((q) => answeredIds.has(q.id));
  return [...unseen, ...seen].slice(0, n);
}
