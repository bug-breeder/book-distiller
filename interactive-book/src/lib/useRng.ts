// interactive-book/src/lib/useRng.ts
import { useMemo } from 'react';
import { mulberry32 } from './rng';

/** A memoized seeded RNG for a sim. Stable for a given seed. */
export function useRng(seed: number): () => number {
  return useMemo(() => mulberry32(seed), [seed]);
}
