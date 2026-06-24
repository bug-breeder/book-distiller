import { describe, it, expect } from 'vitest';
import { parseLesson } from '../../src/interactive/parse.js';

const NOTE = `---
chapter: 1
title: "First Module"
source: { type: authored }
---

## Teaching arc
1. A — objective

## Concepts

### C1 — A
- **Explanation:** A concrete thing with a number, 42.
- **Why it matters:** Because.

#### Dig deeper
**Intuition:** because it works.
**Worked example:** 1 + 1 = 2.
`;

describe('parseLesson with authored source', () => {
  it('reports sourceType "authored"', () => {
    const lesson = parseLesson(NOTE);
    expect(lesson.sourceType).toBe('authored');
  });
});
