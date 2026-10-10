import { builtInCourses } from '../src/data/curriculum';
import { badges, bossFor, charge, levelFor, pickMatch, pickRun, playerXp } from '../src/engine/games';
import { reducer } from '../src/store/reducer';
import { initialState } from '../src/store/schema';

const course = builtInCourses.find((c) => c.id === 'study-aws-aif')!;
const NOW = new Date('2026-10-10T12:00:00Z');

describe('games', () => {
  it('puts due reviews first in a Bolt Run and never repeats a question', () => {
    let s = initialState();
    const missed = course.questions[7]!;
    s = reducer(s, { type: 'recordAnswer', attempt: { itemId: missed.id, courseId: course.id, conceptIds: missed.conceptIds, correct: false, at: '2026-10-09T00:00:00Z', context: 'lesson' } });
    const run = pickRun(course, s, NOW, 42);
    expect(run[0]!.id).toBe(missed.id);
    expect(new Set(run.map((q) => q.id)).size).toBe(run.length);
    expect(run).toHaveLength(5);
  });

  it('builds a Flash Match board whose meanings are the same cards, shuffled', () => {
    const c = builtInCourses.find((x) => x.flashcards.length >= 5)!;
    const b = pickMatch(c, initialState(), NOW, 7);
    expect([...b.answers].sort()).toEqual(b.cards.map((x) => x.id).sort());
  });

  it('makes a boss from one blueprint domain only', () => {
    const boss = bossFor(course, 'd1', 3)!;
    expect(boss.questions.every((q) => q.domainId === 'd1')).toBe(true);
    expect(boss.hp).toBeGreaterThan(0);
    expect(bossFor(course, 'nope', 3)).toBeUndefined();
  });

  it('builds charge without ever taking it away', () => {
    expect(charge([true, true, true])).toBe(5);
    expect(charge([true, false, true])).toBe(2);
    expect(charge([false, false])).toBe(0);
  });

  it('counts game answers toward mastery and the review schedule', () => {
    let s = initialState();
    const q = course.questions[0]!;
    s = reducer(s, { type: 'recordAnswer', attempt: { itemId: q.id, courseId: course.id, conceptIds: q.conceptIds, correct: true, at: NOW.toISOString(), context: 'game' } });
    expect(s.reviews[`${course.id}:${q.id}`]).toBeDefined();
    expect(playerXp(s, [course])).toBeGreaterThan(0);
  });

  it('levels up on a fixed curve and awards badges from real results', () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, span: 100 });
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(299).level).toBe(2);
    expect(levelFor(300).level).toBe(3);
    let s = initialState();
    expect(badges(s, [course]).some((b) => b.earned)).toBe(false);
    s = reducer(s, { type: 'recordGame', result: { id: 'g1', kind: 'run', courseId: course.id, at: NOW.toISOString(), correct: 5, total: 5, won: true } });
    const earned = badges(s, [course]).filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(['first-spark', 'full-charge']);
  });
});
