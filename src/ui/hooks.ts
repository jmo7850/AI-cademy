import { useMemo } from 'react';
import type { CatalogEntry } from '../domain/types';
import { courseStatus, type CourseStatus } from '../engine/mastery';
import { useStore } from '../store/StoreContext';

/** Status for every catalog entry, recomputed only when learner data changes. */
export function useStatuses(): (e: CatalogEntry) => CourseStatus {
  const { state, registry } = useStore();
  return useMemo(() => {
    const cache = new Map<string, CourseStatus>();
    return (e: CatalogEntry) => {
      let s = cache.get(e.id);
      if (!s) {
        s = courseStatus(state.courses[e.id], registry.courseForEntry(e.id), state.attempts, state.exams);
        cache.set(e.id, s);
      }
      return s;
    };
  }, [state.courses, state.attempts, state.exams, registry]);
}

/** Share of lessons finished in an entry's study course (0..1). */
export function useLessonProgress() {
  const { state, registry } = useStore();
  return (entryId: string) => {
    const course = registry.courseForEntry(entryId);
    const done = state.courses[entryId]?.completedLessons ?? [];
    if (!course || course.lessons.length === 0) return done.includes('external-course') ? 1 : 0;
    return course.lessons.filter((l) => done.includes(l.id)).length / course.lessons.length;
  };
}
