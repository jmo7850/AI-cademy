import type { Flashcard, Question, StudyCourse } from '../domain/types';
import type { AppState, GameResult } from '../store/schema';
import { courseMastery, weakConcepts } from './mastery';
import { seededShuffle } from './random';

/*
 * The Arcade: optional, low-pressure games built on the existing question bank and flashcards.
 * Every answer is recorded like any other practice answer, so it updates concept mastery and the
 * spaced-review schedule. No timers, no streaks, nothing lost for stopping or skipping a day.
 */

const dueAt = (state: Pick<AppState, 'reviews'>, courseId: string, itemId: string) => state.reviews[`${courseId}:${itemId}`]?.due;

/** Bolt Run: due reviews first (most overdue first), then weak concepts, then fresh questions. */
export function pickRun(course: StudyCourse, state: Pick<AppState, 'reviews' | 'attempts'>, now: Date, seed: number, n = 5): Question[] {
  const picked: Question[] = [];
  const add = (q: Question | undefined) => {
    if (q && picked.length < n && !picked.includes(q)) picked.push(q);
  };
  const due = course.questions
    .filter((q) => { const d = dueAt(state, course.id, q.id); return d !== undefined && new Date(d) <= now; })
    .sort((a, b) => dueAt(state, course.id, a.id)!.localeCompare(dueAt(state, course.id, b.id)!));
  due.forEach(add);
  for (const w of weakConcepts(course, state.attempts)) add(seededShuffle(course.questions.filter((q) => q.conceptIds.includes(w.conceptId)), w.conceptId, seed)[0]);
  seededShuffle(course.questions, course.id, seed).forEach(add);
  return picked;
}

export interface MatchBoard {
  cards: Flashcard[];
  /** Definitions in shuffled order (card ids). */
  answers: string[];
}

/** Flash Match: unseen and due cards first, then the rest. */
export function pickMatch(course: StudyCourse, state: Pick<AppState, 'reviews'>, now: Date, seed: number, n = 5): MatchBoard {
  const rank = (f: Flashcard) => {
    const d = dueAt(state, course.id, f.id);
    return d === undefined ? -Infinity : new Date(d).getTime() - now.getTime();
  };
  const shuffled = seededShuffle(course.flashcards, course.id, seed);
  const cards = [...shuffled].sort((a, b) => rank(a) - rank(b)).slice(0, n);
  return { cards, answers: seededShuffle(cards.map((c) => c.id), `${course.id}:answers`, seed) };
}

export interface Boss {
  domainId: string;
  name: string;
  hp: number;
  questions: Question[];
}

/** Boss Battle: one boss per exam domain. HP is how many correct answers beat it; extra questions give room for misses. */
export function bossFor(course: StudyCourse, domainId: string, seed: number): Boss | undefined {
  const domain = course.blueprint?.domains.find((d) => d.id === domainId);
  if (!domain) return undefined;
  const questions = seededShuffle(course.questions.filter((q) => q.domainId === domainId), domainId, seed);
  if (questions.length === 0) return undefined;
  const hp = Math.min(3, questions.length);
  return { domainId, name: domain.name, hp, questions: questions.slice(0, hp + 2) };
}

/** Builds per answer: a correct answer charges 1, and 2 when it continues a run of correct answers. A miss never removes charge. */
export function charge(results: boolean[]): number {
  let total = 0;
  results.forEach((ok, i) => {
    if (ok) total += i > 0 && results[i - 1] ? 2 : 1;
  });
  return total;
}

// ---------- Levels and badges ----------

/** XP comes from what you know, not time spent: concept mastery plus a small bonus per game won. */
export function playerXp(state: Pick<AppState, 'attempts' | 'games'>, courses: StudyCourse[]): number {
  let xp = 0;
  for (const c of courses)
    for (const m of courseMastery(c, state.attempts)) xp += m.level === 'mastered' ? 50 : m.level === 'familiar' ? 20 : m.level === 'learning' ? 5 : 0;
  return xp + 10 * state.games.filter((g) => g.won).length;
}

/** Level n needs 50·n·(n−1) XP in total: 0, 100, 300, 600… */
export function levelFor(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  const floor = 50 * level * (level - 1);
  return { level, into: xp - floor, span: 100 * level };
}

export interface Badge {
  id: string;
  label: string;
  how: string;
  earned: boolean;
}

export function badges(state: Pick<AppState, 'attempts' | 'games' | 'exams'>, courses: StudyCourse[]): Badge[] {
  const won = (k: GameResult['kind']) => state.games.some((g) => g.kind === k && g.won);
  const mastered = courses.reduce((n, c) => n + courseMastery(c, state.attempts).filter((m) => m.level === 'mastered').length, 0);
  const passed = state.exams.some((e) => e.finishedAt && typeof e.score === 'number' && e.score >= 0.7);
  return [
    { id: 'first-spark', label: 'First spark', how: 'Finish any game.', earned: state.games.length > 0 },
    { id: 'full-charge', label: 'Full charge', how: 'Answer every question in a Bolt Run correctly.', earned: state.games.some((g) => g.kind === 'run' && g.correct === g.total && g.total > 0) },
    { id: 'memory-circuit', label: 'Memory circuit', how: 'Clear a Flash Match board.', earned: won('match') },
    { id: 'boss-breaker', label: 'Boss breaker', how: 'Beat a domain boss.', earned: won('boss') },
    { id: 'concept-collector', label: 'Concept collector', how: 'Master 5 concepts.', earned: mastered >= 5 },
    { id: 'exam-ready', label: 'Exam ready', how: 'Score 70% or more on a finished practice exam.', earned: passed },
  ];
}
