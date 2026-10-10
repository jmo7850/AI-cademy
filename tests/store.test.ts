import { buildRegistry } from '../src/data/registry';
import { pathById } from '../src/data/paths';
import { quickCredentials, searchCatalog, isStale, tradeOff } from '../src/engine/catalogFilter';
import { nextAction, personalizePath } from '../src/engine/recommend';
import { parseCourseImport } from '../src/engine/validate';
import { exportState, importState, loadState, migrate, saveState, STORAGE_KEY } from '../src/store/persistence';
import { reducer } from '../src/store/reducer';
import { initialState, SCHEMA_VERSION, type AppState } from '../src/store/schema';
import { catalog, catalogById } from '../src/data/catalog';

const NOW = '2026-10-10T12:00:00.000Z';

class MemStorage implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

const onboarded = (goal: AppState['profile']['goal'] = 'ai-app-dev', patch: Partial<AppState['profile']> = {}) => {
  const t = pathById.get(goal)!;
  return reducer(initialState(), { type: 'completeOnboarding', profile: { ...initialState().profile, goal, ...patch }, plan: { id: 'p1', title: t.title, steps: t.steps, createdFrom: t.id } });
};

describe('persistence', () => {
  it('round-trips through storage', () => {
    const st = new MemStorage();
    let s = onboarded();
    s = reducer(s, { type: 'enroll', entryId: 'academy-ai-foundations', now: NOW });
    s = reducer(s, { type: 'setPosition', entryId: 'academy-ai-foundations', lessonId: 'aif-2', section: 1, now: NOW });
    expect(saveState(st, s)).toBeUndefined();
    const loaded = loadState(st);
    expect(loaded.error).toBeUndefined();
    expect(loaded.state.courses['academy-ai-foundations']!.position).toEqual({ lessonId: 'aif-2', section: 1 });
  });

  it('keeps a copy and starts fresh when stored data is corrupt', () => {
    const st = new MemStorage();
    st.setItem(STORAGE_KEY, '{not json');
    const r = loadState(st);
    expect(r.error).toMatch(/could not be read/);
    expect([...st.m.keys()].some((k) => k.startsWith(`${STORAGE_KEY}.corrupt.`))).toBe(true);
  });

  it('migrates v1 data forward', () => {
    const v1 = { schemaVersion: 1, profile: { onboarded: true }, courses: {}, attempts: [], reviews: {}, exams: [], plans: [], projects: {}, sessions: [], notes: {} };
    const s = migrate(v1);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.importedEntries).toEqual([]);
    expect(s.profile.onboarded).toBe(true);
    expect(s.profile.sessionMinutes).toBe(10);
  });

  it('migrates v2 saves to v3 without touching existing progress', () => {
    const v2 = {
      ...initialState(), schemaVersion: 2, games: undefined,
      profile: { ...initialState().profile, onboarded: true, games: undefined },
      attempts: [{ itemId: 'aif-q1', courseId: 'study-ai-foundations', conceptIds: ['ai.basics'], correct: true, at: '2026-10-01T00:00:00Z', context: 'lesson' }],
      courses: { 'academy-ai-foundations': { enrolledAt: '2026-10-01T00:00:00Z' } },
    } as unknown as Record<string, unknown>;
    const s = migrate(v2);
    expect(s.schemaVersion).toBe(3);
    expect(s.games).toEqual([]);
    expect(s.profile.games).toBe(true);
    expect(s.attempts).toHaveLength(1);
    expect(Object.keys(s.courses)).toEqual(['academy-ai-foundations']);
  });

  it('refuses data from a newer schema', () => {
    expect(() => migrate({ schemaVersion: 99 })).toThrow(/newer version/);
  });

  it('exports and re-imports a backup, and rejects foreign files', () => {
    const s = onboarded();
    const r = importState(exportState(s, new Date(NOW)));
    expect(r.ok && r.state.activePlanId).toBe('p1');
    expect(importState('{"hello":1}').ok).toBe(false);
    expect(importState('nope').ok).toBe(false);
  });
});

describe('reducer', () => {
  it('schedules a review when an answer is recorded', () => {
    const s = reducer(initialState(), { type: 'recordAnswer', attempt: { itemId: 'aif-q1', courseId: 'study-ai-foundations', conceptIds: ['ai.basics'], correct: false, at: NOW, context: 'lesson' } });
    expect(s.attempts).toHaveLength(1);
    expect(s.reviews['study-ai-foundations:aif-q1']!.lapses).toBe(1);
  });

  it('records external credentials separately from study status', () => {
    let s = reducer(initialState(), { type: 'enroll', entryId: 'aws-ai-practitioner', now: NOW });
    s = reducer(s, { type: 'recordExternal', entryId: 'aws-ai-practitioner', external: { earnedOn: '2026-10-01', credentialId: 'X' } });
    expect(s.courses['aws-ai-practitioner']!.external?.credentialId).toBe('X');
  });

  it('tracks project milestones and portfolio evidence', () => {
    let s = reducer(initialState(), { type: 'startProject', projectId: 'rag-app', now: NOW });
    s = reducer(s, { type: 'toggleMilestone', projectId: 'rag-app', milestoneId: 'm1' });
    s = reducer(s, { type: 'savePortfolio', projectId: 'rag-app', portfolio: { summary: 'x', skills: ['RAG'], evidenceUrl: 'https://example.com', addedOn: NOW } });
    expect(s.projects['rag-app']!.milestones).toEqual(['m1']);
    expect(s.projects['rag-app']!.portfolio?.skills).toEqual(['RAG']);
  });
});

describe('recommendations', () => {
  it('asks for onboarding first', () => {
    expect(nextAction(initialState(), buildRegistry(initialState()), new Date(NOW)).kind).toBe('onboard');
  });

  it('prioritises due reviews, then lesson resumption, then the plan', () => {
    let s = onboarded();
    const reg = buildRegistry(s);
    expect(nextAction(s, reg, new Date(NOW))).toMatchObject({ kind: 'start', entryId: 'academy-dev-foundations' });
    s = reducer(s, { type: 'setPosition', entryId: 'academy-ai-foundations', lessonId: 'aif-2', section: 0, now: NOW });
    expect(nextAction(s, reg, new Date(NOW))).toMatchObject({ kind: 'continue', entryId: 'academy-ai-foundations' });
    s = reducer(s, { type: 'recordAnswer', attempt: { itemId: 'aif-q1', courseId: 'study-ai-foundations', conceptIds: ['ai.basics'], correct: false, at: NOW, context: 'lesson' } });
    expect(nextAction(s, reg, new Date(Date.parse(NOW) + 3600_000)).kind).toBe('review');
  });

  it('explains choices, honours provider preference, budget and experience', () => {
    const s = onboarded('ai-foundations', { providers: ['microsoft'], budget: 'free', experience: 'developer' });
    const items = personalizePath(pathById.get('ai-foundations')!.steps, s, buildRegistry(s));
    const ms = items.find((i) => i.entry.id === 'ms-azure-ai-fundamentals')!;
    const aws = items.find((i) => i.entry.id === 'aws-ai-practitioner')!;
    expect(ms.recommended).toBe(true);
    expect(ms.reasons.join(' ')).toMatch(/preferred provider/);
    expect(ms.reasons.join(' ')).toMatch(/budget is set to free/);
    expect(aws.recommended).toBe(false);
    expect(aws.reasons.join(' ')).toMatch(/Alternative/);
    for (const i of items) expect(i.reasons.length).toBeGreaterThan(0);
  });

  it('treats choose-one steps as alternatives and follows the preferred provider', () => {
    const s = onboarded('ai-foundations', { providers: ['openai'] });
    const items = personalizePath(pathById.get('ai-foundations')!.steps, s, buildRegistry(s));
    const fluency = items.filter((i) => i.stepTitle === 'AI fluency');
    expect(fluency.filter((i) => i.recommended).map((i) => i.entry.id)).toEqual(['openai-apply-ai-at-work']);
    const google = items.find((i) => i.entry.id === 'google-ai-professional-certificate')!;
    expect(google.recommended).toBe(true);
  });

  it('says a paid certificate program is paid, not that it has an exam', () => {
    const s = onboarded('ai-foundations', { budget: 'free' });
    const items = personalizePath(pathById.get('ai-foundations')!.steps, s, buildRegistry(s));
    const reasons = items.find((i) => i.entry.id === 'google-ai-professional-certificate')!.reasons.join(' ');
    expect(reasons).toMatch(/program is paid/);
    expect(reasons).not.toMatch(/exam is paid/);
  });

  it('skips a developer-foundations step for experienced developers', () => {
    const s = onboarded('ai-app-dev', { experience: 'developer' });
    const items = personalizePath(pathById.get('ai-app-dev')!.steps, s, buildRegistry(s));
    expect(items.find((i) => i.entry.id === 'academy-dev-foundations')!.recommended).toBe(false);
  });
});

describe('catalog search and quick credentials', () => {
  it('searches across titles, tags and exam codes and hides retired entries by default', () => {
    expect(searchCatalog(catalog, { text: 'AIF-C01' }).map((e) => e.id)).toEqual(['aws-ai-practitioner']);
    expect(searchCatalog(catalog, { text: 'copilot studio' })).toHaveLength(0);
    expect(searchCatalog(catalog, { text: 'copilot studio', includeRetired: true })).toHaveLength(1);
    expect(searchCatalog(catalog, { providers: ['google'] }).every((e) => e.provider === 'google')).toBe(true);
  });

  it('filters quick wins and sorts by time, excluding app-internal courses', () => {
    const under2 = quickCredentials(catalog, ['under-2h']);
    expect(under2.length).toBeGreaterThan(0);
    expect(under2.every((e) => e.studyHours.value <= 2 && e.origin !== 'app')).toBe(true);
    const formal = quickCredentials(catalog, ['formal-cert', 'paid-exam']);
    expect(formal.every((e) => e.credentialType === 'foundational-cert')).toBe(true);
    expect(tradeOff(catalogById.get('aws-ai-practitioner')!)).toMatch(/\$100/);
    expect(quickCredentials(catalog, ['certificate-program']).map((e) => e.id)).toEqual(['google-ai-professional-certificate']);
    // Entries with no credential never appear as a free credential, and paid programs without an exam are not "paid exam".
    expect(quickCredentials(catalog, ['free-credential']).some((e) => e.credentialType === 'learning-resource')).toBe(false);
    expect(quickCredentials(catalog, ['paid-exam']).every((e) => !!e.exam)).toBe(true);
    expect(searchCatalog(catalog, { text: 'NCA-GENL' }).map((e) => e.id)).toEqual(['nvidia-nca-genl']);
    expect(searchCatalog(catalog, { text: 'rocm' }).some((e) => e.id === 'amd-rocm-certified-associate')).toBe(true);
  });

  it('flags official facts as stale after 90 days unless re-checked', () => {
    const e = catalogById.get('aws-ai-practitioner')!;
    expect(isStale(e, undefined, new Date('2026-10-11'))).toBe(false);
    expect(isStale(e, undefined, new Date('2027-03-01'))).toBe(true);
    expect(isStale(e, '2027-02-20', new Date('2027-03-01'))).toBe(false);
  });
});

describe('course import', () => {
  const good = {
    format: 'aca-course@1',
    entry: { title: 'My SQL drills', credentialType: 'foundational-cert', officialUrl: 'https://example.com' },
    course: {
      id: 'sql-drills', title: 'SQL drills', summary: '', origin: 'official',
      concepts: [{ id: 's', label: 'SQL' }], lessons: [], flashcards: [],
      questions: [{ id: 'x1', kind: 'fill', conceptIds: ['s'], difficulty: 1, prompt: 'Keyword to filter rows?', accept: ['WHERE'], explanation: 'WHERE filters.' }],
    },
  };

  it('imports valid data but always labels it user-provided and unverified', () => {
    const r = parseCourseImport(good);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.course.origin).toBe('user');
    expect(r.value.entry.origin).toBe('user');
    expect(r.value.entry.provider).toBe('custom');
    expect(r.value.entry.studyHours.status).toBe('unverified');
    expect(r.value.course.id).toBe('user-sql-drills');
  });

  it('reports precise errors for invalid data', () => {
    const bad = { ...good, course: { ...good.course, questions: [{ id: 'x', kind: 'single', conceptIds: ['nope'], difficulty: 1, prompt: 'p', explanation: 'e', options: [{ id: 'a', text: 'A', why: 'w' }], correct: ['b'] }] } };
    const r = parseCourseImport(bad);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.join('\n')).toMatch(/unknown concept "nope"/);
    expect(r.errors.join('\n')).toMatch(/at least two options/);
    expect(parseCourseImport({}).ok).toBe(false);
  });
});
