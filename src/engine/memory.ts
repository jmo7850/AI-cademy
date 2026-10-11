import { pathById } from '../data/paths';
import { weakConcepts } from './mastery';
import type { Registry } from '../data/registry';
import type { AppState, Profile } from '../store/schema';

/**
 * Everything Poqeni remembers about the learner, in one list, so the "What Poqeni knows about me" screen shows
 * all of it and a later counselor reads from the same place. Nothing is remembered that is not listed here.
 */

export interface KnownItem {
  id: string;
  label: string;
  value: string;
  /** Where Poqeni learned it. */
  source: 'setup questions' | 'settings';
}

const EXPERIENCE: Record<Profile['experience'], string> = { none: 'New to this', some: 'Some experience', developer: 'Already a developer' };
const STYLE: Record<Profile['learningStyle'], string> = { reading: 'Reading', practice: 'Practice', mixed: 'A mix' };
const BUDGET: Record<Profile['budget'], string> = { free: 'Free only', low: 'Up to about $100 per exam', any: 'No constraint' };

/** What the learner told Poqeni through setup and Settings. Empty until setup is done. */
export function knownFromProfile(profile: Profile): KnownItem[] {
  if (!profile.onboarded) return [];
  const source = 'setup questions' as const;
  return [
    { id: 'goal', label: 'Career goal', value: pathById.get(profile.goal)?.title ?? profile.goal, source },
    { id: 'experience', label: 'Experience', value: EXPERIENCE[profile.experience], source },
    { id: 'learningStyle', label: 'How you like to learn', value: STYLE[profile.learningStyle], source },
    { id: 'time', label: 'Time available', value: `${profile.weeklyHours} hours a week for ${profile.timelineWeeks} weeks`, source },
    { id: 'budget', label: 'Budget', value: BUDGET[profile.budget], source },
    { id: 'sessionMinutes', label: 'Session length', value: `${profile.sessionMinutes} minutes`, source: 'settings' },
    { id: 'providers', label: 'Preferred providers', value: profile.providers.length ? profile.providers.join(', ') : 'No preference', source },
  ];
}

export interface Derived {
  label: string;
  value: string;
}

/** Facts worked out on the fly from progress. They are not stored anywhere else. */
export function derivedFromActivity(state: AppState, registry: Registry): Derived[] {
  const out: Derived[] = [];
  const answered = state.attempts.length;
  out.push({ label: 'Questions answered', value: String(answered) });
  const minutes = state.sessions.reduce((s, x) => s + x.minutes, 0);
  out.push({ label: 'Timed study logged', value: minutes ? `${minutes} minutes` : 'None' });
  const weak: string[] = [];
  for (const c of Object.values(state.courses)) {
    const course = registry.courseForEntry(c.courseId);
    if (!course) continue;
    for (const w of weakConcepts(course, state.attempts).slice(0, 2)) {
      const label = course.concepts.find((k) => k.id === w.conceptId)?.label;
      if (label && !weak.includes(label)) weak.push(label);
    }
  }
  out.push({ label: 'Areas to revisit', value: weak.length ? weak.slice(0, 5).join(', ') : 'None yet' });
  return out;
}
