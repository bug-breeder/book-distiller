// src/lessons/clarity.ts
// Deterministic clarity checks for tutor lesson notes: every concept should carry a
// substantial "#### Dig deeper" block and avoid vague filler. Advisory — used by the
// `study-mate lint-lessons` CLI and as a final /tutor-prep step.
import type { Concept } from '../interactive/types.js';

/** Filler that asserts importance without substance. Matched case-insensitively as substrings. */
export const BANNED_PHRASES: readonly string[] = [
  'plays a key role',
  'plays an important role',
  'is important',
  'is crucial',
  'is essential',
  'various',
  'a number of',
  'in many ways',
  'as we will see',
  'it is interesting',
  'fundamental concept',
  'key concept',
];

export const MIN_DIG_DEEPER_WORDS = 40;

export interface ClarityFinding {
  /** The concept name the finding is about. */
  concept: string;
  level: 'error' | 'warning';
  message: string;
}

function wordCount(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function checkConcept(concept: Concept): ClarityFinding[] {
  const findings: ClarityFinding[] = [];
  const name = concept.name;

  const dig = concept.digDeeper?.trim() ?? '';
  if (!dig) {
    findings.push({ concept: name, level: 'error', message: 'missing "#### Dig deeper" block' });
  } else {
    const wc = wordCount(dig);
    if (wc < MIN_DIG_DEEPER_WORDS) {
      findings.push({
        concept: name,
        level: 'warning',
        message: `Dig deeper is only ${wc} words (< ${MIN_DIG_DEEPER_WORDS})`,
      });
    }
  }

  const haystack = `${concept.explanation}\n${dig}`.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (haystack.includes(phrase)) {
      findings.push({ concept: name, level: 'warning', message: `vague filler: "${phrase}"` });
    }
  }
  return findings;
}

export function checkConcepts(concepts: Concept[]): ClarityFinding[] {
  return concepts.flatMap(checkConcept);
}
