// Pure SM-2 scheduler, adapted from src/progress/schedule.ts for the browser.
// ReviewCard has no `chapter` field — browser cards are not chapter-bound.
import type { ReviewCard } from './practiceTypes';

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

/** Add `days` to a YYYY-MM-DD string, returning YYYY-MM-DD (UTC math, DST-safe). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

type SeedBase = { id: string; concept: string; question: string; answer: string };

/** Create a fresh review card. `interval` defaults to 3 days. */
export function seedCard(base: SeedBase, today: string, interval = 3): ReviewCard {
  return { ...base, interval, ease: DEFAULT_EASE, lapses: 0, dueDate: addDays(today, interval) };
}

/** Apply a review result, returning an updated card (pure). */
export function applyResult(card: ReviewCard, result: 'pass' | 'fail', today: string): ReviewCard {
  if (result === 'pass') {
    const interval = Math.max(1, Math.round(card.interval * card.ease));
    return { ...card, interval, dueDate: addDays(today, interval) };
  }
  return {
    ...card,
    interval: 1,
    lapses: card.lapses + 1,
    ease: Math.max(MIN_EASE, Number((card.ease - 0.2).toFixed(2))),
    dueDate: addDays(today, 1),
  };
}

/** Cards due on or before `today` (YYYY-MM-DD string comparison is valid). */
export function dueCards(deck: ReviewCard[], today: string): ReviewCard[] {
  return deck.filter((c) => c.dueDate <= today);
}
