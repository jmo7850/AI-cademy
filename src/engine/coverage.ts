import type { Lesson, StudyCourse } from '../domain/types';

export interface DomainCoverage {
  id: string;
  name: string;
  weight: number;
  questions: number;
  /** Lessons that teach this domain's questions (via their teachIn links). */
  lessons: Lesson[];
  /** Share of the course's questions that sit in this domain, 0..1. */
  share: number;
}

/**
 * How much of an exam's published outline the app teaches and tests, per domain. A domain with no lesson is
 * reported as such so the learner knows to study it elsewhere.
 */
export function examCoverage(course: StudyCourse): DomainCoverage[] {
  const domains = course.blueprint?.domains ?? [];
  const total = course.questions.length || 1;
  return domains.map((d) => {
    const qs = course.questions.filter((q) => q.domainId === d.id);
    const lessonIds = new Set(qs.flatMap((q) => (q.teachIn ? [q.teachIn.lessonId] : [])));
    return {
      id: d.id,
      name: d.name,
      weight: d.weight,
      questions: qs.length,
      lessons: course.lessons.filter((l) => lessonIds.has(l.id)),
      share: qs.length / total,
    };
  });
}
