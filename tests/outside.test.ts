import { catalogById } from '../src/data/catalog';
import { buildRegistry } from '../src/data/registry';
import { returnCheckSources } from '../src/data/returnChecks';
import { derivedFromActivity, knownFromProfile } from '../src/engine/memory';
import { credentialClaim, isPass, outsideStatus, pickReturnCheck, RETURN_CHECK_MIN, returnCheckPlan } from '../src/engine/outside';
import { migrate } from '../src/store/persistence';
import { MAX_MEMORY_NOTES, MAX_NOTE_LENGTH, reducer } from '../src/store/reducer';
import { initialState, SCHEMA_VERSION, type AppState, type CourseProgress } from '../src/store/schema';

const NOW = '2026-10-10T12:00:00.000Z';
const ID = 'claude-api-mcp';
const registry = buildRegistry(initialState());

const prog = (patch: Partial<CourseProgress> = {}): CourseProgress => ({ enrolledAt: NOW, completedLessons: [], ...patch } as CourseProgress);
const ALL_TEXT = (p?: CourseProgress) => { const s = outsideStatus(p); return [s.label, ...s.lines, credentialClaim(p)?.label, credentialClaim(p)?.text].join(' ').toLowerCase(); };

describe('outside status', () => {
  it('starts as not finished and says nothing', () => {
    expect(outsideStatus(undefined)).toMatchObject({ level: 'none', lines: [] });
    expect(outsideStatus(prog()).level).toBe('none');
  });

  it('climbs V0 → V1 → V2 and names each in plain words', () => {
    const done = prog({ completedLessons: ['external-course'] });
    expect(outsideStatus(done)).toMatchObject({ level: 'self-reported', lines: ['You said you finished this.'] });
    const noted = { ...done, evidence: { note: 'built a toy', addedOn: NOW } };
    expect(outsideStatus(noted).level).toBe('with-note');
    expect(outsideStatus(noted).lines.join(' ')).toMatch(/does not check it/);
    const tried = { ...noted, checks: [{ at: NOW, correct: 2, total: 5 }] };
    expect(outsideStatus(tried).level).toBe('check-tried');
    const passed = { ...tried, checks: [...tried.checks, { at: NOW, correct: 4, total: 5 }] };
    expect(outsideStatus(passed)).toMatchObject({ level: 'check-passed', label: 'Check passed' });
    expect(outsideStatus(passed).lines.join(' ')).toContain('4 of 5');
  });

  it('needs enough questions and 80% to pass', () => {
    expect(isPass({ at: NOW, correct: 4, total: 5 })).toBe(true);
    expect(isPass({ at: NOW, correct: 3, total: 5 })).toBe(false);
    expect(isPass({ at: NOW, correct: 2, total: 2 })).toBe(false);
  });

  it('never calls anything confirmed or earned, and a recorded credential is not verified', () => {
    const everything = prog({
      completedLessons: ['external-course'], evidence: { note: 'x', addedOn: NOW },
      checks: [{ at: NOW, correct: 5, total: 5 }], external: { earnedOn: '2026-09-01', verificationUrl: 'https://example.com/v' },
    });
    expect(ALL_TEXT(everything)).not.toMatch(/confirmed|certified|verified by poqeni/);
    expect(credentialClaim(everything)!.text).toContain('has not verified');
    expect(credentialClaim(prog())).toBeUndefined();
  });

  it('a perfect check without a recorded credential never produces a credential claim', () => {
    const p = prog({ checks: [{ at: NOW, correct: 5, total: 5 }] });
    expect(credentialClaim(p)).toBeUndefined();
    expect(outsideStatus(p).level).toBe('check-passed');
  });
});

describe('return check sources', () => {
  it.each(Object.entries(returnCheckSources))('%s points at a real outside entry with enough questions', (entryId, src) => {
    const entry = catalogById.get(entryId);
    expect(entry, 'catalog entry').toBeDefined();
    expect(registry.courseForEntry(entryId), 'outside entries have no study course of their own').toBeUndefined();
    const course = registry.course(src.courseId);
    expect(course, 'study course').toBeDefined();
    for (const c of src.conceptIds ?? []) expect(course!.concepts.map((k) => k.id)).toContain(c);
    const plan = returnCheckPlan(entryId, (id) => registry.course(id));
    expect(plan).toBeDefined();
    expect(plan!.available).toBeGreaterThanOrEqual(RETURN_CHECK_MIN);
  });

  it('offers no check for an entry with no mapping', () => {
    expect(returnCheckPlan('claude-code-101', (id) => registry.course(id))).toBeUndefined();
  });

  it('picks unseen questions first, no repeats, and varies with the seed', () => {
    const plan = returnCheckPlan('aws-cloud-practitioner-essentials', (id) => registry.course(id))!;
    const first = pickReturnCheck(plan, new Set(), 1);
    expect(new Set(first.map((q) => q.id)).size).toBe(first.length);
    const seen = new Set(first.map((q) => q.id));
    const second = pickReturnCheck(plan, seen, 2);
    const unseenAvailable = plan.course.questions.filter((q) => !seen.has(q.id)).length;
    expect(second.filter((q) => !seen.has(q.id)).length).toBe(Math.min(second.length, unseenAvailable));
  });
});

describe('outside reducer actions', () => {
  const base = (): AppState => reducer(initialState(), { type: 'enroll', entryId: ID, now: NOW });

  it('saves and clears evidence', () => {
    let s = reducer(base(), { type: 'saveEvidence', entryId: ID, evidence: { note: 'n', url: 'https://x.dev', addedOn: NOW }, now: NOW });
    expect(s.courses[ID]!.evidence?.url).toBe('https://x.dev');
    s = reducer(s, { type: 'saveEvidence', entryId: ID, evidence: undefined, now: NOW });
    expect(s.courses[ID]!.evidence).toBeUndefined();
  });

  it('records checks and caps the history', () => {
    let s = base();
    for (let i = 0; i < 25; i++) s = reducer(s, { type: 'recordReturnCheck', entryId: ID, check: { at: NOW, correct: i % 6, total: 5 }, now: NOW });
    expect(s.courses[ID]!.checks).toHaveLength(20);
  });

  it('keeps project checkpoints per milestone and ignores unknown projects', () => {
    let s = reducer(initialState(), { type: 'startProject', projectId: 'api-client', now: NOW });
    s = reducer(s, { type: 'saveCheckpoint', projectId: 'api-client', milestoneId: 'm1', checkpoint: { url: 'https://g.dev/x', addedOn: NOW } });
    expect(s.projects['api-client']!.checkpoints!.m1!.url).toBe('https://g.dev/x');
    s = reducer(s, { type: 'saveCheckpoint', projectId: 'api-client', milestoneId: 'm1', checkpoint: undefined });
    expect(s.projects['api-client']!.checkpoints).toEqual({});
    expect(reducer(s, { type: 'saveCheckpoint', projectId: 'nope', milestoneId: 'm1', checkpoint: { addedOn: NOW } })).toBe(s);
  });
});

describe('what Poqeni knows', () => {
  const answered = (): AppState => ({ ...initialState(), profile: { ...initialState().profile, onboarded: true, goal: 'ai-app-dev', budget: 'free', providers: ['aws'] } });

  it('is empty before setup and lists every setup answer after', () => {
    expect(knownFromProfile(initialState().profile)).toEqual([]);
    const items = knownFromProfile(answered().profile);
    expect(items.map((i) => i.id)).toEqual(['goal', 'experience', 'learningStyle', 'time', 'budget', 'sessionMinutes', 'providers']);
    expect(items.every((i) => i.value && i.source)).toBe(true);
  });

  it('adds, edits, deletes and bounds notes', () => {
    let s = reducer(answered(), { type: 'addMemoryNote', note: { id: 'a', text: '  Evenings only  ', addedOn: NOW } });
    expect(s.memoryNotes).toEqual([{ id: 'a', text: 'Evenings only', addedOn: NOW }]);
    s = reducer(s, { type: 'updateMemoryNote', id: 'a', text: 'Mornings' });
    expect(s.memoryNotes[0]!.text).toBe('Mornings');
    expect(reducer(s, { type: 'addMemoryNote', note: { id: 'b', text: '   ', addedOn: NOW } })).toBe(s);
    s = reducer(s, { type: 'addMemoryNote', note: { id: 'long', text: 'x'.repeat(MAX_NOTE_LENGTH + 50), addedOn: NOW } });
    expect(s.memoryNotes[1]!.text).toHaveLength(MAX_NOTE_LENGTH);
    s = reducer(s, { type: 'deleteMemoryNote', id: 'a' });
    expect(s.memoryNotes.map((n) => n.id)).toEqual(['long']);
    for (let i = 0; i < MAX_MEMORY_NOTES + 5; i++) s = reducer(s, { type: 'addMemoryNote', note: { id: `n${i}`, text: 'n', addedOn: NOW } });
    expect(s.memoryNotes).toHaveLength(MAX_MEMORY_NOTES);
  });

  it('forget everything clears answers and notes but keeps progress and display settings', () => {
    let s = reducer(answered(), { type: 'enroll', entryId: ID, now: NOW });
    s = { ...s, profile: { ...s.profile, theme: 'dark', games: false }, memoryNotes: [{ id: 'a', text: 'x', addedOn: NOW }] };
    s = reducer(s, { type: 'forgetMemory' });
    expect(s.memoryNotes).toEqual([]);
    expect(s.profile.budget).toBe(initialState().profile.budget);
    expect(s.profile.providers).toEqual([]);
    expect(s.profile).toMatchObject({ onboarded: true, theme: 'dark', games: false });
    expect(s.courses[ID]).toBeDefined();
  });

  it('derived facts come from activity only', () => {
    const d = derivedFromActivity(answered(), registry);
    expect(d.map((x) => x.label)).toEqual(['Questions answered', 'Timed study logged', 'Areas to revisit']);
  });
});

describe('schema v4', () => {
  it('migrates v3 saves with empty memory and untouched progress', () => {
    const v3 = { ...initialState(), schemaVersion: 3, memoryNotes: undefined, courses: { [ID]: { enrolledAt: NOW, completedLessons: ['external-course'] } } } as unknown as Record<string, unknown>;
    const s = migrate(v3);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.memoryNotes).toEqual([]);
    expect(s.courses[ID]!.completedLessons).toEqual(['external-course']);
  });
});
