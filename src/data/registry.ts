import type { CatalogEntry, Question, StudyCourse } from '../domain/types';
import type { AppState } from '../store/schema';
import { catalog } from './catalog';
import { builtInCourses } from './curriculum';

/** Merges built-in content with user-imported content. Built-in ids win on collision. */
export interface Registry {
  entries: CatalogEntry[];
  entry(id: string): CatalogEntry | undefined;
  course(id: string): StudyCourse | undefined;
  courseForEntry(entryId: string): StudyCourse | undefined;
  question(courseId: string, questionId: string): Question | undefined;
}

export function buildRegistry(state: Pick<AppState, 'importedEntries' | 'importedCourses'>): Registry {
  const entryMap = new Map<string, CatalogEntry>();
  for (const e of state.importedEntries) entryMap.set(e.id, e);
  for (const e of catalog) entryMap.set(e.id, e);
  const courseMap = new Map<string, StudyCourse>();
  for (const c of state.importedCourses) courseMap.set(c.id, c);
  for (const c of builtInCourses) courseMap.set(c.id, c);
  const questionIndex = new Map<string, Map<string, Question>>();
  for (const c of courseMap.values()) questionIndex.set(c.id, new Map(c.questions.map((q) => [q.id, q])));

  return {
    entries: [...entryMap.values()],
    entry: (id) => entryMap.get(id),
    course: (id) => courseMap.get(id),
    courseForEntry: (entryId) => {
      const sid = entryMap.get(entryId)?.studyCourseId;
      return sid ? courseMap.get(sid) : undefined;
    },
    question: (courseId, questionId) => questionIndex.get(courseId)?.get(questionId),
  };
}
