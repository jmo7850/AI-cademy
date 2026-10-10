import { dueCards, quality, schedule } from '../src/engine/srs';

const base = { itemId: 'q1', courseId: 'c', conceptIds: ['k'] };
const t0 = new Date('2026-01-01T00:00:00Z');
const days = (iso: string) => (new Date(iso).getTime() - t0.getTime()) / 86_400_000;

describe('spaced repetition', () => {
  it('maps correctness and confidence to quality', () => {
    expect(quality({ correct: false, confidence: 3 })).toBe(0);
    expect(quality({ correct: false })).toBe(1);
    expect(quality({ correct: true, confidence: 1 })).toBe(3);
    expect(quality({ correct: true })).toBe(4);
    expect(quality({ correct: true, confidence: 3 })).toBe(5);
  });

  it('brings misses back in 10 minutes and counts a lapse', () => {
    const c = schedule(undefined, base, { correct: false }, t0);
    expect(new Date(c.due).getTime() - t0.getTime()).toBe(10 * 60_000);
    expect(c.lapses).toBe(1);
    expect(c.reps).toBe(0);
  });

  it('grows intervals 1 → 3 → ×ease on repeated success', () => {
    let c = schedule(undefined, base, { correct: true }, t0);
    expect(days(c.due)).toBe(1);
    c = schedule(c, base, { correct: true }, t0);
    expect(days(c.due)).toBe(3);
    c = schedule(c, base, { correct: true }, t0);
    expect(days(c.due)).toBeGreaterThan(6);
  });

  it('shortens intervals for hard items and lucky guesses', () => {
    const two = (o: object) => schedule(schedule(undefined, base, { correct: true }, t0), base, { correct: true, ...o }, t0);
    expect(two({ difficulty: 3 }).intervalDays).toBeLessThan(two({ difficulty: 1 }).intervalDays);
    expect(two({ confidence: 1 }).intervalDays).toBeLessThanOrEqual(1);
  });

  it('never lets ease fall below 1.3', () => {
    let c = schedule(undefined, base, { correct: false, confidence: 3 }, t0);
    for (let i = 0; i < 20; i++) c = schedule(c, base, { correct: false, confidence: 3 }, t0);
    expect(c.ease).toBe(1.3);
  });

  it('lists due cards oldest first', () => {
    const a = { ...schedule(undefined, base, { correct: false }, t0), itemId: 'a' };
    const b = { ...schedule(undefined, base, { correct: true }, t0), itemId: 'b' };
    const now = new Date(t0.getTime() + 3600_000);
    expect(dueCards({ a, b }, now).map((x) => x.itemId)).toEqual(['a']);
  });
});
