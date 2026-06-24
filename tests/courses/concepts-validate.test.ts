import { describe, it, expect } from 'vitest';
import { validateConceptDag } from '../../src/courses/concepts.js';
import type { ConceptRecord } from '../../src/courses/types.js';

const ok: ConceptRecord[] = [
  { id: 1, label: 'A', dependencies: [], taxonomyId: 1, bloom: 'Understand' },
  { id: 2, label: 'B', dependencies: [1], taxonomyId: 1, bloom: 'Apply' },
  { id: 3, label: 'C', dependencies: [1, 2], taxonomyId: 2, bloom: 'Create' },
];

const errs = (r: ConceptRecord[]) => validateConceptDag(r).filter((f) => f.level === 'error');

describe('validateConceptDag', () => {
  it('returns no errors for a valid DAG', () => {
    expect(errs(ok)).toEqual([]);
  });

  it('flags a duplicate concept ID', () => {
    const r = [...ok, { id: 1, label: 'dup', dependencies: [], taxonomyId: 1, bloom: 'Apply' }];
    expect(errs(r).some((f) => /duplicate/i.test(f.message))).toBe(true);
  });

  it('flags a dependency on an unknown ID', () => {
    const r: ConceptRecord[] = [{ id: 1, label: 'A', dependencies: [99], taxonomyId: 1, bloom: 'Apply' }];
    expect(errs(r).some((f) => /unknown/i.test(f.message))).toBe(true);
  });

  it('flags a cycle', () => {
    const r: ConceptRecord[] = [
      { id: 1, label: 'A', dependencies: [2], taxonomyId: 1, bloom: 'Apply' },
      { id: 2, label: 'B', dependencies: [1], taxonomyId: 1, bloom: 'Apply' },
    ];
    expect(errs(r).some((f) => /cycle/i.test(f.message))).toBe(true);
  });

  it('flags an invalid Bloom level', () => {
    const r: ConceptRecord[] = [{ id: 1, label: 'A', dependencies: [], taxonomyId: 1, bloom: 'Frobnicate' }];
    expect(errs(r).some((f) => /bloom/i.test(f.message))).toBe(true);
  });

  it('flags a fully disconnected concept', () => {
    const r: ConceptRecord[] = [
      { id: 1, label: 'A', dependencies: [], taxonomyId: 1, bloom: 'Apply' },
      { id: 2, label: 'B', dependencies: [1], taxonomyId: 1, bloom: 'Apply' },
      { id: 3, label: 'Island', dependencies: [], taxonomyId: 1, bloom: 'Apply' },
    ];
    expect(errs(r).some((f) => /disconnected/i.test(f.message))).toBe(true);
  });
});
