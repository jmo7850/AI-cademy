import { builtInCourses } from '../src/data/curriculum';

describe('flashcards', () => {
  it.each(builtInCourses.map((c) => [c.id, c] as const))('%s has 30 to 50 well-formed, unique cards', (_id, course) => {
    const cards = course.flashcards;
    expect(cards.length, 'count').toBeGreaterThanOrEqual(30);
    expect(cards.length, 'count').toBeLessThanOrEqual(50);
    expect(new Set(cards.map((c) => c.id)).size, 'unique ids').toBe(cards.length);
    expect(new Set(cards.map((c) => c.front.trim().toLowerCase())).size, 'unique fronts').toBe(cards.length);
    const concepts = new Set(course.concepts.map((k) => k.id));
    for (const c of cards) {
      expect(concepts.has(c.conceptId), `${c.id} concept ${c.conceptId}`).toBe(true);
      expect(c.front.trim().length, `${c.id} front`).toBeGreaterThan(2);
      expect(c.front.length, `${c.id} front length`).toBeLessThanOrEqual(80);
      expect(c.back.length, `${c.id} back length`).toBeGreaterThan(15);
      expect(c.back.length, `${c.id} back length`).toBeLessThanOrEqual(260);
    }
  });

  it('covers every concept of each course with at least one card', () => {
    for (const course of builtInCourses) {
      const have = new Set(course.flashcards.map((c) => c.conceptId));
      for (const k of course.concepts) expect(have.has(k.id), `${course.id}/${k.id}`).toBe(true);
    }
  });

  it('keeps card ids unique across all courses, so review schedules never collide', () => {
    const ids = builtInCourses.flatMap((c) => c.flashcards.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never claims to be official or uses pressure wording', () => {
    const text = builtInCourses.flatMap((c) => c.flashcards.map((f) => `${f.front} ${f.back}`)).join(' ').toLowerCase();
    expect(text).not.toMatch(/exam dump|real exam question|guaranteed to pass|don't break your streak|hurry/);
  });
});
