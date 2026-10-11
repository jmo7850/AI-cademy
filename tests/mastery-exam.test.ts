import { awsAif } from '../src/data/curriculum/awsAif';
import { msAi901 } from '../src/data/curriculum/msAi901';
import { allocate, buildExam, scoreExam, suggestedMinutes, weakDomains } from '../src/engine/exam';
import { conceptMastery, courseStatus, readiness, repeatedMistakes } from '../src/engine/mastery';
import type { Attempt, ExamAttempt } from '../src/store/schema';

let clock = 0;
const att = (itemId: string, correct: boolean, extra: Partial<Attempt> = {}): Attempt => ({
  itemId, correct, courseId: 'c', conceptIds: ['k'], context: 'lesson',
  at: new Date(Date.UTC(2026, 0, 1, 0, clock++)).toISOString(), ...extra,
});

describe('concept mastery', () => {
  beforeEach(() => { clock = 0; });

  it('is "none" with no attempts and "learning" after one', () => {
    expect(conceptMastery([], 'k').level).toBe('none');
    expect(conceptMastery([att('a', true)], 'k').level).toBe('learning');
  });

  it('does not grant mastery from repeating one item', () => {
    const m = conceptMastery([att('a', true), att('a', true), att('a', true), att('a', true)], 'k');
    expect(m.level).not.toBe('mastered');
  });

  it('grants mastery after varied correct answers ending correct', () => {
    expect(conceptMastery([att('a', true), att('b', true), att('c', true)], 'k').level).toBe('mastered');
  });

  it('withdraws mastery after a recent miss', () => {
    expect(conceptMastery([att('a', true), att('b', true), att('c', true), att('a', false)], 'k').level).not.toBe('mastered');
  });

  it('discounts low-confidence correct answers', () => {
    const sure = conceptMastery([att('a', true, { confidence: 3 }), att('b', true, { confidence: 3 })], 'k');
    const guess = conceptMastery([att('a', true, { confidence: 1 }), att('b', true, { confidence: 1 })], 'k');
    expect(guess.score).toBeLessThan(sure.score);
  });

  it('finds repeated mistakes', () => {
    expect(repeatedMistakes([att('a', false), att('a', false), att('b', false)])).toEqual([{ itemId: 'a', courseId: 'c', misses: 2 }]);
  });
});

describe('exam builder', () => {
  it('allocates by weight with largest remainder and exact total', () => {
    const a = allocate(awsAif.blueprint!.domains, 10);
    expect(Object.values(a).reduce((s, n) => s + n, 0)).toBe(10);
    expect(a).toEqual({ d1: 2, d2: 2, d3: 3, d4: 2, d5: 1 });
    expect(Object.values(allocate(msAi901.blueprint!.domains, 7)).reduce((s, n) => s + n, 0)).toBe(7);
  });

  it('builds a weighted exam with unique questions and is deterministic per seed', () => {
    const cfg = { count: 10, difficulty: 'mixed' as const, mode: 'exam' as const, timed: false };
    const a = buildExam(awsAif, cfg, 42);
    expect(a.questionIds).toHaveLength(10);
    expect(new Set(a.questionIds).size).toBe(10);
    expect(buildExam(awsAif, cfg, 42).questionIds).toEqual(a.questionIds);
    const d3 = a.questionIds.filter((id) => awsAif.questions.find((q) => q.id === id)!.domainId === 'd3');
    expect(d3).toHaveLength(3);
  });

  it('caps at the bank size and explains why', () => {
    const r = buildExam(awsAif, { count: 500, difficulty: 'mixed', mode: 'exam', timed: false }, 1);
    expect(r.questionIds).toHaveLength(awsAif.questions.length);
    expect(r.notes.join(' ')).toMatch(/question bank has/);
  });

  it('restricts to chosen domains for remediation', () => {
    const r = buildExam(awsAif, { count: 4, difficulty: 'mixed', mode: 'practice', timed: false, domainIds: ['d5'] }, 3);
    expect(r.questionIds.every((id) => awsAif.questions.find((q) => q.id === id)!.domainId === 'd5')).toBe(true);
  });

  it('suggests time at the official pace', () => {
    expect(suggestedMinutes(awsAif, 65)).toBe(90);
    expect(suggestedMinutes(awsAif, 10)).toBe(14);
    expect(suggestedMinutes(msAi901, 10)).toBeNull();
  });

  it('scores by domain and reports weak domains', () => {
    const ids = ['aws-aif-q1', 'aws-aif-q17'];
    const q1 = awsAif.questions.find((q) => q.id === 'aws-aif-q1')!;
    const exam: ExamAttempt = {
      id: 'e', courseId: awsAif.id, mode: 'exam', timed: false, startedAt: '', questionIds: ids, seed: 1, flagged: [], current: 0,
      answers: { 'aws-aif-q1': { kind: 'choice', selected: 'correct' in q1 ? q1.correct : [] }, 'aws-aif-q17': { kind: 'choice', selected: ['d'] } },
    };
    const s = scoreExam(exam, awsAif);
    expect(s.score).toBe(0.5);
    expect(s.byDomain).toEqual({ d1: { correct: 1, total: 1 }, d5: { correct: 0, total: 1 } });
    expect(weakDomains({ ...exam, ...s }, awsAif).map((d) => d.id)).toEqual(['d5']);
  });
});

describe('readiness and status', () => {
  const finished = (score: number, t: string): ExamAttempt => ({
    id: t, courseId: awsAif.id, mode: 'exam', timed: false, startedAt: t, finishedAt: t, questionIds: [], seed: 0, answers: {}, flagged: [], current: 0, score,
  });

  it('needs data before judging readiness', () => {
    expect(readiness(awsAif, [], []).label).toBe('not-enough-data');
  });

  it('distinguishes passing a practice assessment from earning the credential', () => {
    const progress = { courseId: 'aws-ai-practitioner', enrolledAt: '', bookmarked: false, completedLessons: [] };
    const exams = [finished(0.9, '2026-01-02')];
    expect(courseStatus(progress, awsAif, [], exams)).toBe('assessment-passed');
    expect(courseStatus({ ...progress, external: { earnedOn: '2026-02-01' } }, awsAif, [], exams)).toBe('external-recorded');
    expect(courseStatus(undefined, awsAif, [], exams)).toBe('not-started');
  });

  it('marks completed when all lessons are done', () => {
    const progress = { courseId: 'aws-ai-practitioner', enrolledAt: '', bookmarked: false, completedLessons: awsAif.lessons.map((l) => l.id) };
    expect(courseStatus(progress, awsAif, [], [])).toBe('completed');
  });
});
