import type { FastTrack } from '../data/fastTracks';
import type { CatalogEntry } from '../domain/types';
import type { CourseProgress } from '../store/schema';

export const PACES = [5, 10, 20] as const;

export interface TrackStep {
  entry: CatalogEntry;
  optional: boolean;
  why: string;
  /** The learner said they finished it. Poqeni cannot see provider progress. */
  saidDone: boolean;
}

export function trackSteps(track: FastTrack, entry: (id: string) => CatalogEntry | undefined, courses: Record<string, CourseProgress>): TrackStep[] {
  return track.steps.flatMap((s) => {
    const e = entry(s.catalogId);
    return e ? [{ entry: e, optional: !!s.optional, why: s.why, saidDone: !!courses[e.id]?.completedLessons.includes('external-course') }] : [];
  });
}

/** Hours for the required steps, total and still to go. Optional steps are never counted. */
export function trackHours(steps: TrackStep[]): { total: number; remaining: number } {
  const req = steps.filter((s) => !s.optional);
  const total = req.reduce((n, s) => n + s.entry.studyHours.value, 0);
  const remaining = req.filter((s) => !s.saidDone).reduce((n, s) => n + s.entry.studyHours.value, 0);
  return { total, remaining };
}

/** Weeks to finish the remaining hours at a chosen pace, and a rough date. No deadline is implied. */
export function estimateFinish(remainingHours: number, hoursPerWeek: number, now: Date): { weeks: number; around: Date } {
  const weeks = remainingHours <= 0 ? 0 : Math.ceil(remainingHours / Math.max(1, hoursPerWeek));
  return { weeks, around: new Date(now.getTime() + weeks * 7 * 86_400_000) };
}
