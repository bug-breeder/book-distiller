import { describe, it, expect } from 'vitest';
import { parseConceptsCsv } from '../../src/courses/concepts.js';

const CSV = `ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom
1,Band Descriptors,,1,Understand
2,Complex Sentence Structures,1,2,Apply
3,Task 2 Introduction,1|2,5,Create
`;

describe('parseConceptsCsv', () => {
  it('parses each data row into a typed record', () => {
    const rows = parseConceptsCsv(CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      id: 1, label: 'Band Descriptors', dependencies: [], taxonomyId: 1, bloom: 'Understand',
    });
  });

  it('parses pipe-delimited dependencies into a number array', () => {
    const rows = parseConceptsCsv(CSV);
    expect(rows[2].dependencies).toEqual([1, 2]);
  });

  it('ignores a trailing blank line', () => {
    expect(parseConceptsCsv(CSV)).toHaveLength(3);
  });

  it('throws when the header row is wrong', () => {
    expect(() => parseConceptsCsv('id,label\n1,x')).toThrow(/header/i);
  });

  it('throws when a row does not have exactly 5 columns', () => {
    const bad = `ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom\n1,Has, Comma,,1,Apply`;
    expect(() => parseConceptsCsv(bad)).toThrow(/5 columns/);
  });
});
