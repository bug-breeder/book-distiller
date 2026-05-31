// tests/progress/lessonNotes.test.ts
import { describe, it, expect } from 'vitest';
import { parseReviewItems } from '../../src/progress/lessonNotes.js';

const md = `---
chapter: 2
---

## Concepts
### C1 — Reciprocity
- **Explanation:** people repay favors.

## Review items
- id: c1-q1 | concept: C1 | Q: What is the rule of reciprocity? | A: We feel obliged to repay.
- id: c2-q1 | concept: C2 | Q: Name a defense. | A: Relabel the favor as a trick.

## Next section
- not a review item
`;

describe('parseReviewItems', () => {
  it('parses only the Review items section into structured items', () => {
    const items = parseReviewItems(md, 2);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'c1-q1', chapter: 2, concept: 'C1',
      question: 'What is the rule of reciprocity?', answer: 'We feel obliged to repay.',
    });
    expect(items[1].id).toBe('c2-q1');
  });
  it('returns [] when there is no Review items section', () => {
    expect(parseReviewItems('## Concepts\n- nope', 1)).toEqual([]);
  });
});
