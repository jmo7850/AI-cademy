import type { CatalogEntry, CredentialType } from '../domain/types';
import { STALE_AFTER_DAYS } from '../data/facts';

export const credentialTypeLabel: Record<CredentialType, string> = {
  'professional-cert': 'Official professional certification',
  'foundational-cert': 'Official foundational certification',
  'course-certificate': 'Course completion certificate or badge',
  microcredential: 'Vendor skill credential',
  'independent-assessment': 'Independent learning assessment',
  'portfolio-project': 'Portfolio project',
};

export const providerLabel: Record<CatalogEntry['provider'], string> = {
  anthropic: 'Claude Academy (Anthropic)',
  aws: 'AWS',
  microsoft: 'Microsoft',
  google: 'Google Cloud',
  academy: 'This app',
  custom: 'Your import',
};

export interface CatalogQuery {
  text?: string;
  providers?: string[];
  types?: CredentialType[];
  categories?: string[];
  difficulty?: string[];
  includeRetired?: boolean;
}

export function searchCatalog(entries: CatalogEntry[], q: CatalogQuery): CatalogEntry[] {
  const words = (q.text ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (!q.includeRetired && e.availability.value === 'retired') return false;
    if (q.providers?.length && !q.providers.includes(e.provider)) return false;
    if (q.types?.length && !q.types.includes(e.credentialType)) return false;
    if (q.categories?.length && !q.categories.includes(e.category)) return false;
    if (q.difficulty?.length && !q.difficulty.includes(e.difficulty)) return false;
    if (!words.length) return true;
    const hay = [e.title, providerLabel[e.provider], e.category, ...(e.tags ?? []), ...e.objectives, e.exam?.code?.value ?? ''].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

// ---------- Quick credentials ----------

export type QuickFilter =
  | 'free-learning'
  | 'free-credential'
  | 'paid-exam'
  | 'under-2h'
  | 'under-1d'
  | 'under-1w'
  | 'beginner'
  | 'no-programming'
  | 'programming'
  | 'ai'
  | 'cloud'
  | 'hands-on'
  | 'formal-cert';

export const quickFilterLabel: Record<QuickFilter, string> = {
  'free-learning': 'Free learning',
  'free-credential': 'Free credential',
  'paid-exam': 'Paid exam',
  'under-2h': 'Under 2 hours',
  'under-1d': 'Under 1 day',
  'under-1w': 'Under 1 week',
  beginner: 'Beginner-friendly',
  'no-programming': 'No programming',
  programming: 'Programming required',
  ai: 'AI-focused',
  cloud: 'Cloud-focused',
  'hands-on': 'Hands-on',
  'formal-cert': 'Formal certification',
};

/** Hours thresholds. "1 day" = 8 study hours, "1 week" = 40 (stated as such in the UI). */
const HOURS = { 'under-2h': 2, 'under-1d': 8, 'under-1w': 40 } as const;

export function matchesQuick(e: CatalogEntry, f: QuickFilter): boolean {
  switch (f) {
    case 'free-learning':
      return e.learningCost.value === 'free';
    case 'free-credential':
      return e.credentialFree.value === true;
    case 'paid-exam':
      return e.credentialFree.value === false;
    case 'under-2h':
    case 'under-1d':
    case 'under-1w':
      return e.studyHours.value <= HOURS[f];
    case 'beginner':
      return e.difficulty === 'beginner';
    case 'no-programming':
      return !e.programmingRequired;
    case 'programming':
      return e.programmingRequired;
    case 'ai':
      return e.category === 'ai';
    case 'cloud':
      return e.category === 'cloud';
    case 'hands-on':
      return e.handsOn;
    case 'formal-cert':
      return e.credentialType === 'professional-cert' || e.credentialType === 'foundational-cert';
  }
}

/** Quick-win candidates: available, beginner-accessible, and not app-internal. */
export function quickCredentials(entries: CatalogEntry[], filters: QuickFilter[]): CatalogEntry[] {
  return entries
    .filter((e) => e.availability.value !== 'retired' && e.origin !== 'app' && e.difficulty !== 'advanced')
    .filter((e) => filters.every((f) => matchesQuick(e, f)))
    .sort((a, b) => a.studyHours.value - b.studyHours.value);
}

/** Plain-language trade-off note: speed vs depth vs cost vs recognition. */
export function tradeOff(e: CatalogEntry): string {
  const formal = e.credentialType === 'foundational-cert' || e.credentialType === 'professional-cert';
  const fee = e.exam?.feeUSD?.value;
  if (formal) return `Slower and ${fee ? `costs $${fee}` : 'paid'}, but a proctored, employer-recognised certification.`;
  if (e.studyHours.value <= 2) return 'Fast and low-risk. Shows initiative, but proves little on its own; pair it with a project.';
  if (e.credentialType === 'microcredential') return 'Hands-on proof of a specific skill. Narrower than a certification.';
  return 'Builds real skill. Recognition depends on the evidence you produce.';
}

// ---------- Freshness ----------

export function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** Official facts are stale when neither the seed check nor a user re-check is recent. */
export function isStale(e: CatalogEntry, recheckedOn: string | undefined, now: Date): boolean {
  if (e.origin !== 'official') return false;
  const latest = [e.checkedOn, recheckedOn].filter(Boolean).sort().at(-1);
  return !latest || daysSince(latest, now) > STALE_AFTER_DAYS;
}
