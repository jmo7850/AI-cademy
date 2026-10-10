import type { ExamDomain, Question, StudyCourse } from '../domain/types';
import type { ExamAttempt } from '../store/schema';
import { gradeQuestion } from './grading';
import { mulberry32, shuffle } from './random';

export interface ExamConfig {
  count: number;
  difficulty: 'mixed' | 1 | 2 | 3;
  mode: 'practice' | 'exam';
  timed: boolean;
  minutes?: number;
  /** Restrict to these domains (weak-area remediation). Empty = all. */
  domainIds?: string[];
}

const GENERAL = 'general';
const domainOf = (q: Question) => q.domainId ?? GENERAL;

/** Largest-remainder allocation of `count` across weights. */
export function allocate(domains: Pick<ExamDomain, 'id' | 'weight'>[], count: number): Record<string, number> {
  const total = domains.reduce((s, d) => s + d.weight, 0) || 1;
  const raw = domains.map((d) => ({ id: d.id, exact: (d.weight / total) * count }));
  const out: Record<string, number> = {};
  let used = 0;
  for (const r of raw) {
    out[r.id] = Math.floor(r.exact);
    used += out[r.id]!;
  }
  const byRemainder = [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1));
  for (let i = 0; used < count && i < byRemainder.length; i++, used++) out[byRemainder[i]!.id]! += 1;
  return out;
}

export interface BuiltExam {
  questionIds: string[];
  /** Notes about deviations, e.g. pool too small for the blueprint. */
  notes: string[];
}

/**
 * Select questions following the blueprint's domain weights. If a domain's
 * pool is short, the gap is filled from other domains and reported.
 */
export function buildExam(course: StudyCourse, config: ExamConfig, seed: number): BuiltExam {
  const rng = mulberry32(seed);
  const notes: string[] = [];
  const domains: Pick<ExamDomain, 'id' | 'weight'>[] = course.blueprint?.domains.length
    ? course.blueprint.domains
    : [{ id: GENERAL, weight: 1 }];
  const active = config.domainIds?.length ? domains.filter((d) => config.domainIds!.includes(d.id)) : domains;

  const eligible = (q: Question) => !course.blueprint || active.some((d) => d.id === domainOf(q));
  let pool = course.questions.filter(eligible);
  if (config.difficulty !== 'mixed') {
    const matching = pool.filter((q) => q.difficulty === config.difficulty);
    if (matching.length < config.count) notes.push(`Only ${matching.length} questions at the chosen difficulty; others were added to reach the count.`);
    pool = [...shuffle(matching, rng), ...shuffle(pool.filter((q) => q.difficulty !== config.difficulty), rng)];
  } else {
    pool = shuffle(pool, rng);
  }

  const count = Math.min(config.count, pool.length);
  if (count < config.count) notes.push(`The question bank has ${pool.length} eligible questions, so this exam has ${count}.`);

  const want = allocate(active, count);
  const chosen: Question[] = [];
  for (const d of active) {
    const take = pool.filter((q) => domainOf(q) === d.id && !chosen.includes(q)).slice(0, want[d.id] ?? 0);
    chosen.push(...take);
  }
  if (chosen.length < count) {
    const short = count - chosen.length;
    notes.push(`${short} question(s) were drawn from other domains because some domains have too few questions.`);
    chosen.push(...pool.filter((q) => !chosen.includes(q)).slice(0, short));
  }
  return { questionIds: shuffle(chosen, rng).map((q) => q.id), notes };
}

/** Time proportional to the official exam pace, rounded up; null when unpublished. */
export function suggestedMinutes(course: StudyCourse, count: number): number | null {
  const b = course.blueprint;
  if (!b?.officialMinutes || !b.officialQuestionCount) return null;
  return Math.ceil((b.officialMinutes / b.officialQuestionCount) * count);
}

export function scoreExam(attempt: ExamAttempt, course: StudyCourse): Pick<ExamAttempt, 'score' | 'byDomain'> {
  const byDomain: Record<string, { correct: number; total: number }> = {};
  let correct = 0;
  for (const id of attempt.questionIds) {
    const q = course.questions.find((x) => x.id === id);
    if (!q) continue;
    const d = domainOf(q);
    byDomain[d] ??= { correct: 0, total: 0 };
    byDomain[d].total++;
    const a = attempt.answers[id];
    if (a && gradeQuestion(q, a).correct) {
      correct++;
      byDomain[d].correct++;
    }
  }
  return { score: attempt.questionIds.length ? correct / attempt.questionIds.length : 0, byDomain };
}

/** Domains below the pass threshold, weakest first, for remediation and retake advice. */
export function weakDomains(attempt: ExamAttempt, course: StudyCourse): { id: string; name: string; pct: number }[] {
  const pass = (course.blueprint?.passPercent ?? 75) / 100;
  return Object.entries(attempt.byDomain ?? {})
    .map(([id, v]) => ({ id, name: course.blueprint?.domains.find((d) => d.id === id)?.name ?? 'General', pct: v.total ? v.correct / v.total : 0 }))
    .filter((d) => d.pct < pass)
    .sort((a, b) => a.pct - b.pct);
}
