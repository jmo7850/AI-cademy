import { validateStudyCourse } from '../engine/validate';
import { type AppState, initialState, SCHEMA_VERSION } from './schema';

export const STORAGE_KEY = 'ai-career-academy';
const EXPORT_APP = 'ai-career-academy';

type Raw = Record<string, unknown>;

/**
 * Ordered migrations: MIGRATIONS[n] upgrades a version-n object to n+1.
 * v1 (pre-release) lacked import tracking and catalog re-checks.
 * v2 lacked the Arcade: game results and the games on/off preference.
 */
const MIGRATIONS: Record<number, (s: Raw) => Raw> = {
  1: (s) => ({ ...s, importedEntries: [], importedCourses: s.importedCourses ?? [], recheckedOn: {}, schemaVersion: 2 }),
  2: (s) => ({ ...s, games: [], profile: { ...(s.profile as object), games: true }, schemaVersion: 3 }),
};

export function migrate(raw: Raw): AppState {
  let s = { ...raw };
  let v = typeof s.schemaVersion === 'number' ? s.schemaVersion : 1;
  if (v > SCHEMA_VERSION) throw new Error(`Data was saved by a newer version of the app (schema ${v}); this version reads up to ${SCHEMA_VERSION}.`);
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`No migration from schema ${v}.`);
    s = step(s);
    v = s.schemaVersion as number;
  }
  // Fill any missing top-level fields with defaults so older/partial data loads safely.
  const base = initialState();
  const merged = { ...base, ...s, profile: { ...base.profile, ...(s.profile as object) } } as AppState;
  return merged;
}

/** Structural check for imported backups; returns problems found. */
export function checkState(s: AppState): string[] {
  const e: string[] = [];
  if (typeof s.profile !== 'object') e.push('profile missing');
  if (!Array.isArray(s.attempts)) e.push('attempts must be an array');
  if (!Array.isArray(s.exams)) e.push('exams must be an array');
  if (typeof s.courses !== 'object' || Array.isArray(s.courses)) e.push('courses must be an object');
  if (typeof s.reviews !== 'object' || Array.isArray(s.reviews)) e.push('reviews must be an object');
  if (!Array.isArray(s.importedCourses)) e.push('importedCourses must be an array');
  else s.importedCourses.forEach((c, i) => validateStudyCourse(c).forEach((m) => e.push(`importedCourses[${i}]: ${m}`)));
  for (const a of Array.isArray(s.attempts) ? s.attempts : []) {
    if (typeof a.itemId !== 'string' || typeof a.correct !== 'boolean' || typeof a.at !== 'string') {
      e.push('attempts contain malformed entries');
      break;
    }
  }
  return e;
}

export function loadState(storage: Storage | undefined): { state: AppState; error?: string } {
  if (!storage) return { state: initialState(), error: 'Browser storage is unavailable; progress will not be saved.' };
  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: initialState(), error: 'Browser storage is blocked; progress will not be saved.' };
  }
  if (!text) return { state: initialState() };
  try {
    const state = migrate(JSON.parse(text) as Raw);
    const problems = checkState(state);
    if (problems.length) throw new Error(problems.join('; '));
    return { state };
  } catch (err) {
    // Keep the unreadable copy so nothing is lost, then start fresh.
    try { storage.setItem(`${STORAGE_KEY}.corrupt.${Date.now()}`, text); } catch { /* storage full */ }
    return { state: initialState(), error: `Saved progress could not be read (${(err as Error).message}). A copy was kept and a fresh profile started.` };
  }
}

export function saveState(storage: Storage | undefined, state: AppState): string | undefined {
  if (!storage) return 'Browser storage is unavailable.';
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return undefined;
  } catch {
    return 'Progress could not be saved (storage full or blocked). Export a backup from Settings.';
  }
}

export function exportState(state: AppState, now: Date): string {
  return JSON.stringify({ app: EXPORT_APP, exportedAt: now.toISOString(), state }, null, 2);
}

export function importState(text: string): { ok: true; state: AppState } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  if (typeof parsed !== 'object' || parsed === null || (parsed as Raw).app !== EXPORT_APP) {
    return { ok: false, error: 'This is not a Poqeni backup file.' };
  }
  try {
    const state = migrate((parsed as Raw).state as Raw);
    const problems = checkState(state);
    if (problems.length) return { ok: false, error: `Backup failed validation: ${problems.slice(0, 3).join('; ')}` };
    return { ok: true, state };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
