// src/progress/schedule.ts
import type { ReviewItem } from './types.js';

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

/** Add `days` to a YYYY-MM-DD string, returning YYYY-MM-DD (UTC math, DST-safe). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

type SeedBase = { id: string; chapter: number; concept: string; question: string; answer: string };

/** Create a fresh review item. `interval` defaults to 3 days; pass 1 for gap items. */
export function seedItem(base: SeedBase, today: string, interval = 3): ReviewItem {
  return { ...base, interval, ease: DEFAULT_EASE, lapses: 0, dueDate: addDays(today, interval) };
}

/** Apply a review result, returning an updated item (pure). */
export function applyResult(item: ReviewItem, result: 'pass' | 'fail', today: string): ReviewItem {
  if (result === 'pass') {
    const interval = Math.max(1, Math.round(item.interval * item.ease));
    return { ...item, interval, dueDate: addDays(today, interval) };
  }
  return {
    ...item,
    interval: 1,
    lapses: item.lapses + 1,
    ease: Math.max(MIN_EASE, Number((item.ease - 0.2).toFixed(2))),
    dueDate: addDays(today, 1),
  };
}

/** Items due on or before `today` (YYYY-MM-DD string comparison is valid). */
export function dueItems(queue: ReviewItem[], today: string): ReviewItem[] {
  return queue.filter((it) => it.dueDate <= today);
}
