// tests/progress/schedule.test.ts
import { describe, it, expect } from 'vitest';
import { addDays, seedItem, applyResult, dueItems, DEFAULT_EASE, MIN_EASE } from '../../src/progress/schedule.js';
import type { ReviewItem } from '../../src/progress/types.js';

const base = { id: 'c1-q1', chapter: 1, concept: 'C1', question: 'q', answer: 'a' };

describe('addDays', () => {
  it('adds days across a month boundary (UTC, DST-safe)', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09'); // US DST date — must not shift
  });
});

describe('seedItem', () => {
  it('defaults to a 3-day interval', () => {
    const item = seedItem(base, '2026-01-01');
    expect(item.interval).toBe(3);
    expect(item.ease).toBe(DEFAULT_EASE);
    expect(item.lapses).toBe(0);
    expect(item.dueDate).toBe('2026-01-04');
  });
  it('seeds a gap item due tomorrow', () => {
    expect(seedItem(base, '2026-01-01', 1).dueDate).toBe('2026-01-02');
  });
});

describe('applyResult', () => {
  const item: ReviewItem = { ...base, dueDate: '2026-01-01', interval: 4, ease: 2.5, lapses: 0 };
  it('pass multiplies interval by ease and reschedules', () => {
    const r = applyResult(item, 'pass', '2026-01-01');
    expect(r.interval).toBe(10); // round(4 * 2.5)
    expect(r.dueDate).toBe('2026-01-11');
    expect(r.lapses).toBe(0);
  });
  it('fail resets interval, increments lapses, lowers ease, due tomorrow', () => {
    const r = applyResult(item, 'fail', '2026-01-01');
    expect(r.interval).toBe(1);
    expect(r.lapses).toBe(1);
    expect(r.ease).toBe(2.3);
    expect(r.dueDate).toBe('2026-01-02');
  });
  it('never lowers ease below the floor', () => {
    const low: ReviewItem = { ...item, ease: 1.3 };
    expect(applyResult(low, 'fail', '2026-01-01').ease).toBe(MIN_EASE);
  });
});

describe('dueItems', () => {
  it('returns items due on or before today', () => {
    const q: ReviewItem[] = [
      { ...base, id: 'a', dueDate: '2026-01-01', interval: 1, ease: 2.5, lapses: 0 },
      { ...base, id: 'b', dueDate: '2026-01-05', interval: 1, ease: 2.5, lapses: 0 },
    ];
    expect(dueItems(q, '2026-01-03').map((i) => i.id)).toEqual(['a']);
  });
});
