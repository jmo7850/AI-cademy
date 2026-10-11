import { catalogById } from '../src/data/catalog';
import { fastTracks } from '../src/data/fastTracks';
import { estimateFinish, trackHours, trackSteps } from '../src/engine/fastTrack';
import type { CourseProgress } from '../src/store/schema';

const claude = fastTracks.find((t) => t.id === 'claude')!;
const done = (ids: string[]): Record<string, CourseProgress> =>
  Object.fromEntries(ids.map((id) => [id, { enrolledAt: 'x', completedLessons: ['external-course'] } as CourseProgress]));

const aws = fastTracks.find((t) => t.id === 'aws-ai')!;

describe('fast tracks', () => {
  it.each(fastTracks.map((t) => [t.id, t] as const))('%s only lists real catalog entries', (_id, t) => {
    for (const s of t.steps) expect(catalogById.has(s.catalogId), s.catalogId).toBe(true);
  });

  it('the Claude track is a badge route and never calls itself a certification', () => {
    expect(claude.credential.kind).toBe('badge');
    expect(claude.credential.note).toMatch(/not a certification/);
    expect(JSON.stringify(claude).toLowerCase()).not.toMatch(/fastest|guarantee|earned/);
  });

  it('counts only required hours, from the catalog', () => {
    const steps = trackSteps(claude, (id) => catalogById.get(id), {});
    expect(trackHours(steps)).toEqual({ total: 10, remaining: 10 });
    expect(steps.at(-1)!.optional).toBe(true);
  });

  it('subtracts steps the learner says they finished', () => {
    const steps = trackSteps(claude, (id) => catalogById.get(id), done(['claude-ai-fluency-framework-foundations']));
    expect(trackHours(steps).remaining).toBe(6);
  });

  it('estimates weeks from pace and implies no deadline for zero hours', () => {
    const now = new Date('2026-10-11T00:00:00Z');
    expect(estimateFinish(10, 5, now).weeks).toBe(2);
    expect(estimateFinish(10, 20, now).weeks).toBe(1);
    expect(estimateFinish(0, 5, now).weeks).toBe(0);
    expect(estimateFinish(10, 5, now).around.toISOString().slice(0, 10)).toBe('2026-10-25');
  });

  it('the AWS track makes Cloud Practitioner Essentials optional and never claims the exam is earned here', () => {
    const steps = trackSteps(aws, (id) => catalogById.get(id), {});
    expect(steps.map((x) => x.entry.id)).toEqual(['aws-cloud-practitioner-essentials', 'aws-ai-practitioner']);
    expect(steps[0]!.optional).toBe(true);
    expect(trackHours(steps).total).toBe(catalogById.get('aws-ai-practitioner')!.studyHours.value);
    expect(aws.credential.kind).toBe('certification');
    expect(JSON.stringify(aws).toLowerCase()).not.toMatch(/fastest|guarantee|earned here|you will pass/);
  });
});
