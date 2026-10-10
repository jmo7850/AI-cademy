import type { ReviewCard } from '../store/schema';

export interface ReviewOutcome {
  correct: boolean;
  /** 1 = guessed, 2 = unsure, 3 = confident. */
  confidence?: 1 | 2 | 3;
  difficulty?: 1 | 2 | 3;
}

const MIN_EASE = 1.3;
const RELEARN_MINUTES = 10;
const DAY = 86_400_000;

/** SM-2 quality (0–5) from correctness and confidence. */
export function quality({ correct, confidence }: ReviewOutcome): number {
  if (!correct) return confidence === 3 ? 0 : 1; // a confident miss is a misconception
  if (confidence === 1) return 3;
  if (confidence === 3) return 5;
  return 4;
}

const difficultyFactor = (d?: 1 | 2 | 3) => (d === 3 ? 0.85 : d === 1 ? 1.1 : 1);

/**
 * Modified SM-2. Misses come back in 10 minutes; first successes at 1 then 3
 * days; then interval × ease, adjusted for item difficulty.
 */
export function schedule(
  prev: ReviewCard | undefined,
  base: Pick<ReviewCard, 'itemId' | 'courseId' | 'conceptIds'>,
  outcome: ReviewOutcome,
  now: Date,
): ReviewCard {
  const q = quality(outcome);
  const card: ReviewCard = prev
    ? { ...prev }
    : { ...base, ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: now.toISOString() };

  card.ease = Math.max(MIN_EASE, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (!outcome.correct) {
    card.reps = 0;
    card.lapses += 1;
    card.intervalDays = 0;
    card.due = new Date(now.getTime() + RELEARN_MINUTES * 60_000).toISOString();
    card.lastResult = 'incorrect';
    return card;
  }

  card.reps += 1;
  let interval: number;
  if (card.reps === 1) interval = 1;
  else if (card.reps === 2) interval = 3;
  else interval = Math.max(card.intervalDays + 1, card.intervalDays * card.ease);
  interval *= difficultyFactor(outcome.difficulty);
  if (outcome.confidence === 1) interval = Math.min(interval, 1); // guessed right: check again soon
  card.intervalDays = Math.round(interval * 10) / 10;
  card.due = new Date(now.getTime() + card.intervalDays * DAY).toISOString();
  card.lastResult = 'correct';
  return card;
}

export function dueCards(reviews: Record<string, ReviewCard>, now: Date): ReviewCard[] {
  const t = now.getTime();
  return Object.values(reviews)
    .filter((c) => new Date(c.due).getTime() <= t)
    .sort((a, b) => a.due.localeCompare(b.due));
}

export function upcomingCards(reviews: Record<string, ReviewCard>, now: Date, days: number): ReviewCard[] {
  const t = now.getTime();
  const end = t + days * DAY;
  return Object.values(reviews).filter((c) => {
    const d = new Date(c.due).getTime();
    return d > t && d <= end;
  });
}
