import { describe, it, expect } from 'vitest';
import { checkConcepts, checkConcept, BANNED_PHRASES, MIN_DIG_DEEPER_WORDS } from '../../src/lessons/clarity.js';
import type { Concept } from '../../src/interactive/types.js';

function concept(over: Partial<Concept>): Concept {
  return { label: 'C1', name: 'Test', explanation: 'x', whyItMatters: '', ...over };
}

const longDig = 'word '.repeat(MIN_DIG_DEEPER_WORDS + 5).trim();

describe('clarity checker', () => {
  it('flags a missing Dig deeper as an error', () => {
    const findings = checkConcept(concept({ name: 'NoDig' }));
    expect(findings.some((f) => f.level === 'error' && /Dig deeper/i.test(f.message))).toBe(true);
  });

  it('flags a too-short Dig deeper as a warning', () => {
    const findings = checkConcept(concept({ digDeeper: 'just three words' }));
    expect(findings.some((f) => f.level === 'warning' && /words/.test(f.message))).toBe(true);
    expect(findings.some((f) => f.level === 'error')).toBe(false);
  });

  it('flags a banned filler phrase as a warning', () => {
    const findings = checkConcept(
      concept({ explanation: 'This concept is important.', digDeeper: longDig }),
    );
    expect(findings.some((f) => f.level === 'warning' && f.message.includes('is important'))).toBe(true);
  });

  it('passes a clean concept with a substantial Dig deeper', () => {
    const findings = checkConcept(
      concept({ explanation: 'Compare cross-type edges to the 2pq baseline.', digDeeper: longDig }),
    );
    expect(findings).toHaveLength(0);
  });

  it('checkConcepts aggregates across concepts', () => {
    const findings = checkConcepts([concept({ name: 'A' }), concept({ name: 'B', digDeeper: longDig })]);
    expect(findings.filter((f) => f.level === 'error')).toHaveLength(1);
  });

  it('exports a non-empty banned list', () => {
    expect(BANNED_PHRASES.length).toBeGreaterThan(0);
  });
});
