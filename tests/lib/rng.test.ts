import { describe, it, expect } from 'vitest';
import { seedFromString, mulberry32 } from '../../interactive-book/src/lib/rng.js';

describe('seedFromString', () => {
  it('is deterministic and differs by input', () => {
    expect(seedFromString('Schelling')).toBe(seedFromString('Schelling'));
    expect(seedFromString('a')).not.toBe(seedFromString('b'));
  });
});

describe('mulberry32', () => {
  it('produces a deterministic sequence in [0,1)', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
