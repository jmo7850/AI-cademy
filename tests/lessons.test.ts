import { builtInCourses } from '../src/data/curriculum';
import { awsAif } from '../src/data/curriculum/awsAif';
import { validateStudyCourse } from '../src/engine/validate';

describe('teachIn links', () => {
  it.each(builtInCourses.map((c) => [c.id, c] as const))('%s: every teachIn link resolves to a section that teaches the concept', (_id, course) => {
    for (const q of course.questions) {
      if (!q.teachIn) continue;
      const lesson = course.lessons.find((l) => l.id === q.teachIn!.lessonId);
      expect(lesson, `${q.id} lesson`).toBeDefined();
      expect(q.teachIn.section, `${q.id} section`).toBeGreaterThanOrEqual(0);
      expect(q.teachIn.section, `${q.id} section`).toBeLessThan(lesson!.sections.length);
      expect(q.conceptIds.some((c) => lesson!.conceptIds.includes(c)), `${q.id} concept is taught in ${lesson!.id}`).toBe(true);
    }
  });
});

describe('lesson depth standard (AWS AI Practitioner pilot)', () => {
  it('has a lesson for every exam domain', () => {
    expect(awsAif.lessons.length).toBeGreaterThanOrEqual(awsAif.blueprint!.domains.length);
    for (const d of awsAif.blueprint!.domains) {
      const taught = awsAif.questions.filter((q) => q.domainId === d.id).every((q) => q.teachIn);
      expect(taught, `domain ${d.id}`).toBe(true);
    }
  });

  it('gives every question a link back to its lesson section', () => {
    for (const q of awsAif.questions) expect(q.teachIn, q.id).toBeDefined();
  });

  it('writes every section to the standard: walkthrough or diagram, non-example, misconception and a recap', () => {
    for (const l of awsAif.lessons) {
      l.sections.forEach((s, i) => {
        const where = `${l.id}[${i}] ${s.heading}`;
        expect(s.body.length, where).toBeGreaterThan(40);
        expect(!!(s.diagram || s.example), `${where}: diagram or example`).toBe(true);
        expect(s.nonExample, `${where}: nonExample`).toBeTruthy();
        expect(s.misconception, `${where}: misconception`).toBeTruthy();
        expect(s.recap, `${where}: recap`).toBeTruthy();
        expect(s.recap!.split(/(?<=[.!?])\s+/).length, `${where}: recap is one or two lines`).toBeLessThanOrEqual(3);
      });
    }
  });

  it('ends every lesson with a knowledge check on questions from the same course', () => {
    const ids = new Set(awsAif.questions.map((q) => q.id));
    for (const l of awsAif.lessons) {
      expect(l.checkIds.length, l.id).toBeGreaterThan(0);
      for (const id of l.checkIds) expect(ids.has(id), `${l.id}/${id}`).toBe(true);
    }
  });

  it('still validates as an importable course shape', () => {
    expect(validateStudyCourse(JSON.parse(JSON.stringify(awsAif)))).toEqual([]);
  });

  it('rejects a teachIn that points nowhere when importing', () => {
    const bad = JSON.parse(JSON.stringify(awsAif));
    bad.questions[0].teachIn = { lessonId: 'nope', section: 0 };
    expect(validateStudyCourse(bad).join(' ')).toMatch(/teachIn/);
  });
});
