// interactive-book/src/lib/srs.test.ts
import { describe, it, expect } from 'vitest';
import { addDays, seedCard, applyResult, dueCards, DEFAULT_EASE, MIN_EASE } from './srs';

describe('addDays', () => {
  it('adds days DST-safe', () => {
    expect(addDays('2026-06-25', 3)).toBe('2026-06-28');
  });
});

describe('seedCard', () => {
  it('creates a fresh card due `interval` days out', () => {
    const c = seedCard({ id: 'err:articles', concept: 'articles', question: 'q', answer: 'a' }, '2026-06-25');
    expect(c).toMatchObject({ id: 'err:articles', interval: 3, ease: DEFAULT_EASE, lapses: 0, dueDate: '2026-06-28' });
  });
});

describe('applyResult', () => {
  const base = seedCard({ id: 'x', concept: 'c', question: 'q', answer: 'a' }, '2026-06-25');

  it('pass grows the interval by ease', () => {
    const next = applyResult(base, 'pass', '2026-06-25');
    expect(next.interval).toBe(Math.max(1, Math.round(3 * DEFAULT_EASE)));
  });

  it('fail resets interval to 1, drops ease, bumps lapses', () => {
    const next = applyResult(base, 'fail', '2026-06-25');
    expect(next.interval).toBe(1);
    expect(next.lapses).toBe(1);
    expect(next.ease).toBe(Number((DEFAULT_EASE - 0.2).toFixed(2)));
    expect(next.dueDate).toBe('2026-06-26');
  });

  it('never drops ease below MIN_EASE', () => {
    let c = { ...base, ease: MIN_EASE };
    c = applyResult(c, 'fail', '2026-06-25');
    expect(c.ease).toBe(MIN_EASE);
  });
});

describe('dueCards', () => {
  it('returns cards due on or before today', () => {
    const a = { ...seedCard({ id: 'a', concept: 'c', question: 'q', answer: 'a' }, '2026-06-20', 1) };
    const b = { ...seedCard({ id: 'b', concept: 'c', question: 'q', answer: 'a' }, '2026-06-25', 10) };
    expect(dueCards([a, b], '2026-06-25').map((c) => c.id)).toEqual(['a']);
  });
});
