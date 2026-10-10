import type { CatalogEntry, CredentialType, Question, StudyCourse } from '../domain/types';

/*
 * Hand-written validators for external input (course imports and backups).
 * Kept dependency-free; errors are human-readable paths.
 */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const ID = /^[a-z0-9][a-z0-9._-]{1,63}$/;

const CRED_TYPES: CredentialType[] = ['professional-cert', 'foundational-cert', 'course-certificate', 'microcredential', 'independent-assessment', 'portfolio-project'];

export function validateQuestion(q: unknown, path: string, conceptIds: Set<string>): string[] {
  const e: string[] = [];
  if (!isObj(q)) return [`${path}: must be an object`];
  if (!isStr(q.id)) e.push(`${path}.id: required`);
  if (!isStr(q.prompt)) e.push(`${path}.prompt: required`);
  if (!isStr(q.explanation)) e.push(`${path}.explanation: required (every question needs an explanation)`);
  if (!isStrArr(q.conceptIds) || q.conceptIds.length === 0) e.push(`${path}.conceptIds: at least one concept id`);
  else for (const c of q.conceptIds) if (!conceptIds.has(c)) e.push(`${path}.conceptIds: unknown concept "${c}"`);
  if (![1, 2, 3].includes(q.difficulty as number)) e.push(`${path}.difficulty: 1, 2 or 3`);
  switch (q.kind) {
    case 'single':
    case 'multi':
    case 'truefalse': {
      const opts = q.options;
      if (!Array.isArray(opts) || opts.length < 2) { e.push(`${path}.options: at least two options`); break; }
      const ids = new Set<string>();
      opts.forEach((o, i) => {
        if (!isObj(o) || !isStr(o.id) || !isStr(o.text) || !isStr(o.why)) e.push(`${path}.options[${i}]: needs id, text and why`);
        else ids.add(o.id);
      });
      if (!isStrArr(q.correct) || q.correct.length === 0) e.push(`${path}.correct: at least one option id`);
      else {
        for (const c of q.correct) if (!ids.has(c)) e.push(`${path}.correct: "${c}" is not an option id`);
        if (q.kind !== 'multi' && q.correct.length !== 1) e.push(`${path}.correct: ${q.kind} questions need exactly one correct option`);
      }
      break;
    }
    case 'fill':
      if (!isStrArr(q.accept) || q.accept.length === 0) e.push(`${path}.accept: at least one accepted answer`);
      if (q.acceptPatterns !== undefined) {
        if (!isStrArr(q.acceptPatterns)) e.push(`${path}.acceptPatterns: strings`);
        else for (const p of q.acceptPatterns) { try { new RegExp(p); } catch { e.push(`${path}.acceptPatterns: invalid regex "${p}"`); } }
      }
      break;
    case 'order':
      if (!Array.isArray(q.items) || q.items.length < 2) e.push(`${path}.items: at least two items`);
      break;
    case 'match':
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) e.push(`${path}.pairs: at least two pairs`);
      break;
    default:
      e.push(`${path}.kind: one of single, multi, truefalse, fill, order, match`);
  }
  return e;
}

export function validateStudyCourse(c: unknown): string[] {
  const e: string[] = [];
  if (!isObj(c)) return ['course: must be an object'];
  if (!isStr(c.id) || !ID.test(c.id)) e.push('course.id: lowercase letters, digits, ".", "_" or "-" (2–64 chars)');
  if (!isStr(c.title)) e.push('course.title: required');
  if (!Array.isArray(c.concepts) || c.concepts.length === 0) e.push('course.concepts: at least one concept');
  const conceptIds = new Set<string>();
  (Array.isArray(c.concepts) ? c.concepts : []).forEach((k, i) => {
    if (!isObj(k) || !isStr(k.id) || !isStr(k.label)) e.push(`course.concepts[${i}]: needs id and label`);
    else conceptIds.add(k.id);
  });
  if (!Array.isArray(c.lessons)) e.push('course.lessons: array required (may be empty)');
  if (!Array.isArray(c.questions)) e.push('course.questions: array required (may be empty)');
  if (c.flashcards !== undefined && !Array.isArray(c.flashcards)) e.push('course.flashcards: array');
  const qids = new Set<string>();
  (Array.isArray(c.questions) ? c.questions : []).forEach((q, i) => {
    e.push(...validateQuestion(q, `course.questions[${i}]`, conceptIds));
    if (isObj(q) && isStr(q.id)) {
      if (qids.has(q.id)) e.push(`course.questions[${i}].id: duplicate "${q.id}"`);
      qids.add(q.id);
    }
  });
  (Array.isArray(c.lessons) ? c.lessons : []).forEach((l, i) => {
    if (!isObj(l) || !isStr(l.id) || !isStr(l.title) || !Array.isArray(l.sections) || l.sections.length === 0) {
      e.push(`course.lessons[${i}]: needs id, title and at least one section`);
      return;
    }
    for (const id of isStrArr(l.checkIds) ? l.checkIds : []) if (!qids.has(id)) e.push(`course.lessons[${i}].checkIds: unknown question "${id}"`);
  });
  if (c.blueprint !== undefined) {
    const b = c.blueprint;
    if (!isObj(b) || !Array.isArray(b.domains) || b.domains.length === 0) e.push('course.blueprint.domains: at least one domain');
    else {
      const total = b.domains.reduce((s: number, d) => s + (isObj(d) && typeof d.weight === 'number' ? d.weight : 0), 0);
      if (Math.abs(total - 100) > 0.5) e.push(`course.blueprint.domains: weights must sum to 100 (got ${total})`);
    }
  }
  return e;
}

export function validateCatalogEntry(x: unknown): string[] {
  const e: string[] = [];
  if (!isObj(x)) return ['entry: must be an object'];
  if (!isStr(x.id) || !ID.test(x.id)) e.push('entry.id: lowercase id required');
  if (!isStr(x.title)) e.push('entry.title: required');
  if (!CRED_TYPES.includes(x.credentialType as CredentialType)) e.push(`entry.credentialType: one of ${CRED_TYPES.join(', ')}`);
  if (x.officialUrl !== undefined && !(isStr(x.officialUrl) && /^https:\/\//.test(x.officialUrl))) e.push('entry.officialUrl: must be an https URL');
  return e;
}

export interface ImportedCourse {
  entry: CatalogEntry;
  course: StudyCourse;
}

/**
 * Accepts { format: "aca-course@1", entry?: {...}, course: {...} }.
 * Imported data is always labelled user-provided and every fact unverified,
 * regardless of what the file claims.
 */
export function parseCourseImport(json: unknown): { ok: true; value: ImportedCourse } | { ok: false; errors: string[] } {
  if (!isObj(json) || json.format !== 'aca-course@1') return { ok: false, errors: ['format: expected "aca-course@1"'] };
  const errors = validateStudyCourse(json.course);
  const rawEntry = isObj(json.entry) ? json.entry : {};
  if (json.entry !== undefined) errors.push(...validateCatalogEntry({ id: `user-${(json.course as Obj)?.id}`, ...rawEntry }));
  if (errors.length) return { ok: false, errors };

  const c = json.course as unknown as StudyCourse;
  const course: StudyCourse = {
    ...c,
    id: `user-${c.id}`,
    origin: 'user',
    flashcards: c.flashcards ?? [],
    questions: c.questions as Question[],
    blueprint: c.blueprint ? { ...c.blueprint, weightsStatus: 'unverified' } : undefined,
  };
  const entryId = `user-${c.id}`;
  const credentialType = CRED_TYPES.includes(rawEntry.credentialType as CredentialType) ? (rawEntry.credentialType as CredentialType) : 'independent-assessment';
  const entry: CatalogEntry = {
    id: entryId,
    title: isStr(rawEntry.title) ? rawEntry.title : c.title,
    provider: 'custom',
    track: 'E',
    category: (['ai', 'cloud', 'programming', 'career'] as const).find((k) => k === rawEntry.category) ?? 'ai',
    credentialType,
    difficulty: (['beginner', 'intermediate', 'advanced'] as const).find((k) => k === rawEntry.difficulty) ?? 'beginner',
    prerequisites: [],
    studyHours: { value: typeof rawEntry.studyHours === 'number' ? rawEntry.studyHours : 1, status: 'unverified', note: 'User-provided.' },
    learningCost: { value: 'free', status: 'unverified', note: 'User-provided.' },
    credentialFree: { value: true, status: 'unverified', note: 'User-provided.' },
    officialUrl: isStr(rawEntry.officialUrl) ? rawEntry.officialUrl : undefined,
    availability: { value: 'available', status: 'unverified' },
    objectives: isStrArr(rawEntry.objectives) ? rawEntry.objectives : [],
    proves: 'User-imported course. Its claims have not been verified by this app.',
    programmingRequired: rawEntry.programmingRequired === true,
    handsOn: rawEntry.handsOn === true,
    careerValue: 'Depends on the source of this material.',
    nextSteps: [],
    origin: 'user',
    studyCourseId: course.id,
  };
  return { ok: true, value: { entry, course } };
}
