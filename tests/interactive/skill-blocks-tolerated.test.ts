// tests/interactive/skill-blocks-tolerated.test.ts
import { describe, it, expect } from 'vitest';
import { parseLesson } from '../../src/interactive/parse.js';
import { checkConcepts } from '../../src/lessons/clarity.js';

const NOTE = `---
chapter: 1
title: "Task 2 Introductions"
source: { type: authored }
---

## Teaching arc
1. Paraphrasing the prompt — rewrite the question without copying.

## Concepts

### C1 — Paraphrasing the prompt
- **Explanation:** Restate the question using synonyms and changed word forms; copied words are not counted toward the word limit, so paraphrase is worth a real 0.25 band.
- **Why it matters:** A copied introduction caps Task Response.
- **Check:** Rewrite "Many people believe university should be free." — **Ideal answer:** A common view holds that higher education ought to carry no tuition fees.

#### Dig deeper
**Intuition:** synonyms plus a changed clause structure signals lexical range without changing meaning.
**Worked example:** "Some argue cars should be banned in city centres" -> "A number of people contend that private vehicles ought to be prohibited from urban centres."

#### Model answers
**Band 6:** Many people think university should be free for everyone.
**Band 7:** It is often argued that tertiary education ought to be provided at no cost to students.

#### Practice
**Prompt:** Some people think children should start school at age four. Paraphrase this statement.
**Assessed:** lexical change (synonyms + word forms), grammatical accuracy, meaning preserved.
`;

describe('optional skill blocks', () => {
  it('parseLesson still extracts the concept', () => {
    const lesson = parseLesson(NOTE);
    expect(lesson.concepts).toHaveLength(1);
    expect(lesson.concepts[0].name).toBe('Paraphrasing the prompt');
    expect(lesson.concepts[0].digDeeper).toBeTruthy();
  });

  it('clarity lint passes (Dig deeper present, no banned filler)', () => {
    const lesson = parseLesson(NOTE);
    const findings = checkConcepts(lesson.concepts).filter((f) => f.level === 'error');
    expect(findings).toEqual([]);
  });
});
