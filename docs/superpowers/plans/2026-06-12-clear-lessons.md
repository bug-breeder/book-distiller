# Clear, Not-Vague Lessons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Study Mate's content-generation flow so each concept ships a concrete visible summary plus a required `#### Dig deeper` block (intuition + worked example), rendered as a collapsible in the interactive book — so a learner understands the concept cold instead of reading a vague summary.

**Architecture:** Fix at the single source (the lesson note). Parser captures a new `#### Dig deeper` markdown block into `Concept.digDeeper`; the generator emits a `<DigDeeper>` collapsible; the template + `book-analyst` agent require concrete summaries + Dig deeper + ban vague filler; a new advisory `study-mate lint-lessons` check enforces structure. networks-book is then fully regenerated through the upgraded flow.

**Tech Stack:** TypeScript (strict, ESM/NodeNext, `.js` import suffixes), Vitest, Docusaurus 3 + React 19 (MDX), Commander CLI.

**Spec:** `docs/superpowers/specs/2026-06-12-clear-lessons-design.md`

---

## File Structure

**Core pipeline (root project):**
- `src/interactive/types.ts` — add `digDeeper?: string` to `Concept`.
- `src/interactive/parse.ts` — capture `#### Dig deeper` into `Concept.digDeeper` (+ a `dedent` helper).
- `src/interactive/generate.ts` — emit `<DigDeeper>` in `renderConcept`.
- `src/lessons/clarity.ts` *(new)* — deterministic clarity checker (banned phrases, Dig-deeper presence/length).
- `src/cli.ts` — new `lint-lessons <slug>` command.

**Interactive book (Docusaurus app):**
- `interactive-book/src/components/DigDeeper.tsx` *(new)* — collapsed-by-default disclosure.
- `interactive-book/src/theme/MDXComponents.tsx` — register `DigDeeper`.
- `interactive-book/src/css/custom.css` — `.digDeeper` styling (light + dark).

**Authoring flow (skills/agents/templates):**
- `.claude/skills/tutor-prep/lesson-note-template.md` — concrete-summary rule + `#### Dig deeper` format + banned-vagueness list + self-review checklist.
- `.claude/agents/book-analyst.md` — clarity rules + self-review before returning.
- `.claude/skills/tutor-prep/SKILL.md` — run `lint-lessons` as a final per-chapter step.
- `.claude/skills/tutor/SKILL.md` — one-line note that Dig deeper holds the worked example (optional, low-touch).

**Tests:**
- `tests/interactive/parse.test.ts` — Dig-deeper parsing.
- `tests/interactive/generate.test.ts` — `<DigDeeper>` emission + position.
- `tests/lessons/clarity.test.ts` *(new)* — checker findings.

---

## Task 1: Parse `#### Dig deeper` into `Concept.digDeeper`

**Files:**
- Modify: `src/interactive/types.ts` (the `Concept` interface)
- Modify: `src/interactive/parse.ts` (`parseConcepts` + new `dedent` helper)
- Test: `tests/interactive/parse.test.ts`

- [ ] **Step 1: Add the failing test**

Add this `it` block inside the existing `describe('parseLesson', ...)` in `tests/interactive/parse.test.ts`. It needs a concept that actually has a Dig-deeper block — add a `#### Dig deeper` block to the `### C1 — Homophily` concept in the `md` fixture string at the top of the file (insert it right after the C1 `- **Application:**` line, before the blank line preceding `### C7`):

```md
- **Application:** Recommender systems exploit homophily.

#### Dig deeper
**Intuition:** Similar people share contexts, so they meet more often.

**Worked example:** 6 boys, 3 girls, 18 edges. p = 2/3, q = 1/3, so
2pq = 4/9; expect 8 cross-gender edges. Observed 5 < 8 -> homophily.

- a list item survives the capture
```

Then add the test:

```ts
it('captures the #### Dig deeper block into digDeeper', () => {
  const homophily = lesson.concepts.find((c) => c.name === 'Homophily');
  expect(homophily?.digDeeper).toBeDefined();
  expect(homophily?.digDeeper).toContain('**Intuition:**');
  expect(homophily?.digDeeper).toContain('**Worked example:**');
  // multi-paragraph + inequalities + list items are preserved verbatim
  expect(homophily?.digDeeper).toContain('5 < 8');
  expect(homophily?.digDeeper).toContain('- a list item survives the capture');
  // the next concept (no Dig deeper) leaves it undefined; capture stops at ## Figures
  const schelling = lesson.concepts.find((c) => c.name === "Schelling's Segregation Model");
  expect(schelling?.digDeeper).toBeUndefined();
  // ## Figures content never leaks into a concept body
  expect(homophily?.digDeeper).not.toContain('Figure 4.1');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/interactive/parse.test.ts`
Expected: FAIL — `digDeeper` is `undefined` (property doesn't exist yet).

- [ ] **Step 3: Add the type field**

In `src/interactive/types.ts`, add to `interface Concept` (after the `application?` field):

```ts
  /** Present only when the chapter genuinely supports a real-world use. */
  application?: string;
  /** Optional `#### Dig deeper` block: intuition + a fully worked example. Multi-paragraph markdown. */
  digDeeper?: string;
```

- [ ] **Step 4: Add the `dedent` helper to `parse.ts`**

In `src/interactive/parse.ts`, add this helper just above `function parseConcepts` (after `sectionLines`):

```ts
/** Remove the smallest common leading indentation from a block of raw lines, then join. */
function dedent(lines: string[]): string {
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^[ \t]*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}
```

- [ ] **Step 5: Rewrite `parseConcepts` to capture Dig deeper**

Replace the entire `parseConcepts` function in `src/interactive/parse.ts` with:

```ts
function parseConcepts(lines: string[]): Concept[] {
  const start = lines.findIndex((l) => /^##\s+concepts/i.test(l.trim()));
  if (start === -1) return [];
  const concepts: Concept[] = [];
  let current: Concept | null = null;
  let digBuf: string[] | null = null; // non-null while capturing a `#### Dig deeper` block

  const flushDig = () => {
    if (current && digBuf) {
      const text = dedent(digBuf).trim();
      if (text) current.digDeeper = text;
    }
    digBuf = null;
  };

  for (let i = start + 1; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (/^##\s+/.test(line)) {
      flushDig();
      break; // next top-level section (e.g. ## Figures)
    }
    const head = line.match(/^###\s+(C\d+)\s*[—–-]\s*(.+)$/);
    if (head) {
      flushDig();
      if (current) concepts.push(current);
      current = { label: head[1], name: head[2].trim(), explanation: '', whyItMatters: '' };
      continue;
    }
    if (/^####\s+dig deeper/i.test(line)) {
      flushDig();
      digBuf = []; // start capturing the block body
      continue;
    }
    if (/^####\s+/.test(line)) {
      flushDig(); // any other sub-heading ends a Dig-deeper capture
      continue;
    }
    if (digBuf) {
      digBuf.push(raw); // inside Dig deeper: keep RAW markdown (blank lines, lists, bold)
      continue;
    }

    if (!current) continue;
    if (/^-\s*\*\*Explanation:\*\*/i.test(line)) current.explanation = bulletValue(line) ?? '';
    else if (/^-\s*\*\*Why it matters:\*\*/i.test(line)) current.whyItMatters = bulletValue(line) ?? '';
    else if (/^-\s*\*\*Check:\*\*/i.test(line)) {
      const val = bulletValue(line) ?? '';
      const split = val.split(/\s*[—–-]\s*\*\*Ideal answer:\*\*\s*/i);
      current.check = { question: split[0].trim(), idealAnswer: (split[1] ?? '').trim() };
    } else if (/^-\s*\*\*Misconception:\*\*/i.test(line)) current.misconception = bulletValue(line);
    else if (/^-\s*\*\*Application:\*\*/i.test(line)) current.application = bulletValue(line);
  }
  flushDig();
  if (current) concepts.push(current);
  return concepts;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/interactive/parse.test.ts`
Expected: PASS (all parse tests, including the new one).

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/interactive/types.ts src/interactive/parse.ts tests/interactive/parse.test.ts
git commit -m "feat(interactive): parse #### Dig deeper block into Concept.digDeeper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Clarity checker (`src/lessons/clarity.ts`)

**Files:**
- Create: `src/lessons/clarity.ts`
- Test: `tests/lessons/clarity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lessons/clarity.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/lessons/clarity.test.ts`
Expected: FAIL — `Cannot find module '../../src/lessons/clarity.js'`.

- [ ] **Step 3: Implement the checker**

Create `src/lessons/clarity.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/lessons/clarity.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lessons/clarity.ts tests/lessons/clarity.test.ts
git commit -m "feat(lessons): deterministic clarity checker (Dig deeper + banned filler)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `study-mate lint-lessons <slug>` CLI command

**Files:**
- Modify: `src/cli.ts` (add import + command, before the final `program.parseAsync()`)

- [ ] **Step 1: Add the import**

In `src/cli.ts`, after the existing line `import { lintSimSource } from './viz/lint.js';` add:

```ts
import { checkConcepts } from './lessons/clarity.js';
```

- [ ] **Step 2: Add the command**

In `src/cli.ts`, immediately before the final `program.parseAsync().catch(...)` block (currently around line 463), insert:

```ts
program
  .command('lint-lessons <slug>')
  .description('Clarity check: flag concepts missing/short "Dig deeper" blocks or using vague filler')
  .action(async (slug: string) => {
    const lessonsDir = path.join('book-output', slug, 'lessons');
    if (!(await fs.pathExists(lessonsDir))) {
      console.log(`No lessons for "${slug}" (${lessonsDir} not found). Run /tutor-prep ${slug} first.`);
      return;
    }
    const files = (await fs.readdir(lessonsDir)).filter((f) => f.endsWith('-lesson.md')).sort();
    let errors = 0;
    let warnings = 0;
    for (const file of files) {
      const lesson = parseLesson(await fs.readFile(path.join(lessonsDir, file), 'utf-8'));
      for (const f of checkConcepts(lesson.concepts)) {
        if (f.level === 'error') {
          errors++;
          console.error(`✗ ${file} — ${f.concept}: ${f.message}`);
        } else {
          warnings++;
          console.warn(`⚠ ${file} — ${f.concept}: ${f.message}`);
        }
      }
    }
    console.log(`\n${files.length} lesson(s): ${errors} error(s), ${warnings} warning(s).`);
    if (errors > 0) process.exit(1);
  });
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Verify the command is wired (manual smoke test)**

Run: `pnpm exec tsx src/cli.ts lint-lessons networks-book`
Expected: it reads the current notes and prints errors (the existing notes have NO Dig deeper yet, so every concept reports `missing "#### Dig deeper" block`, and the process exits non-zero). This confirms wiring; the errors disappear after Task 10 regenerates the notes.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts
git commit -m "feat(cli): add lint-lessons clarity command

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `DigDeeper` MDX component + registration + styling

**Files:**
- Create: `interactive-book/src/components/DigDeeper.tsx`
- Modify: `interactive-book/src/theme/MDXComponents.tsx`
- Modify: `interactive-book/src/css/custom.css` (append)

- [ ] **Step 1: Create the component**

Create `interactive-book/src/components/DigDeeper.tsx`:

```tsx
import React from 'react';

/**
 * Collapsed-by-default disclosure holding a concept's intuition + worked example.
 * Generated MDX wraps the Dig-deeper markdown as children:
 *   <DigDeeper>\n\n ...markdown... \n\n</DigDeeper>
 */
export default function DigDeeper({
  title = 'Dig deeper',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="digDeeper">
      <summary className="digDeeper__summary">{title}</summary>
      <div className="digDeeper__body">{children}</div>
    </details>
  );
}
```

- [ ] **Step 2: Register it globally**

In `interactive-book/src/theme/MDXComponents.tsx`, add the import after the `BookFigure` import:

```tsx
import BookFigure from '@site/src/components/BookFigure';
import DigDeeper from '@site/src/components/DigDeeper';
```

and add `DigDeeper,` to the default export object (after `BookFigure,`):

```tsx
export default {
  ...MDXComponents,
  GraphFigure,
  SimHost,
  Flashcards,
  Check,
  Callout,
  BookFigure,
  DigDeeper,
};
```

- [ ] **Step 3: Append styling**

Append to `interactive-book/src/css/custom.css`:

```css
/* Dig deeper — collapsible intuition + worked example under a concept. */
.digDeeper {
  margin: 1rem 0;
  border: 1px solid var(--ifm-color-emphasis-300);
  border-radius: 8px;
  background: var(--ifm-background-surface-color);
  padding: 0 1rem;
}
.digDeeper__summary {
  cursor: pointer;
  font-weight: 600;
  padding: 0.6rem 0;
  color: var(--ifm-color-primary);
  list-style-position: inside;
}
.digDeeper[open] .digDeeper__summary {
  border-bottom: 1px solid var(--ifm-color-emphasis-200);
  margin-bottom: 0.5rem;
}
.digDeeper__body {
  padding-bottom: 0.75rem;
}
.digDeeper__body > :last-child {
  margin-bottom: 0;
}
[data-theme='dark'] .digDeeper {
  border-color: var(--ifm-color-emphasis-300);
}
```

- [ ] **Step 4: Typecheck the app**

Run: `cd interactive-book && pnpm exec tsc --noEmit && cd ..`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add interactive-book/src/components/DigDeeper.tsx interactive-book/src/theme/MDXComponents.tsx interactive-book/src/css/custom.css
git commit -m "feat(interactive-book): DigDeeper collapsible component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Generator emits `<DigDeeper>` in the right position

**Files:**
- Modify: `src/interactive/generate.ts` (`renderConcept`)
- Test: `tests/interactive/generate.test.ts`

- [ ] **Step 1: Add the failing test**

In `tests/interactive/generate.test.ts`, add a new `describe` block at the end of the file:

```ts
describe('renderChapter Dig deeper', () => {
  const digLesson: ParsedLesson = {
    chapter: 4,
    title: 'Chapter 4: Contexts',
    sourceType: 'pdf',
    sourceRef: '99-132',
    teachingArc: [],
    concepts: [
      {
        label: 'C1',
        name: 'Homophily',
        explanation: 'Ties form between similar people.',
        whyItMatters: 'Networks are not random.',
        digDeeper: '**Intuition:** similar people share contexts.\n\nObserved 5 < 8 -> homophily.',
      },
      {
        label: 'C2',
        name: 'No Dig',
        explanation: 'Has no dig deeper.',
        whyItMatters: '',
      },
    ],
    figures: [],
    visualizations: [],
    reviewItems: [],
  };

  const mdx = renderChapter(digLesson, chapter, 'networks-book', 'Networks', new Map(), []);

  it('emits a <DigDeeper> block for a concept that has one', () => {
    expect(mdx).toContain('<DigDeeper>');
    expect(mdx).toContain('Observed 5 &lt; 8'); // inequality MDX-escaped so build is safe
  });

  it('omits <DigDeeper> for a concept without one', () => {
    // exactly one DigDeeper in the whole chapter (only C1 has it)
    expect(mdx.match(/<DigDeeper>/g)?.length).toBe(1);
  });

  it('places Dig deeper before the why callout', () => {
    const dig = mdx.indexOf('<DigDeeper>');
    const why = mdx.indexOf('variant="why"');
    expect(dig).toBeGreaterThan(-1);
    expect(why).toBeGreaterThan(dig);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/interactive/generate.test.ts`
Expected: FAIL — no `<DigDeeper>` in output.

- [ ] **Step 3: Emit Dig deeper in `renderConcept`**

In `src/interactive/generate.ts`, in `renderConcept`, insert the Dig-deeper emission **after** the sims loop (the `for (const {entry, index} of ctx.sims)` block that ends at `}`) and **before** `if (concept.whyItMatters)`:

```ts
  // AI-authored sims anchored to this concept (exact concept-name match).
  for (const {entry, index} of ctx.sims) {
    if (ctx.usedSims.has(index)) continue;
    if (entry.concept.toLowerCase().trim() === name) {
      parts.push(`<SimHost meta={simMeta_${index}} component={Sim_${index}} />`);
      ctx.usedSims.add(index);
    }
  }

  // The "Dig deeper" disclosure (intuition + worked example). Emitted as MDX children
  // so its markdown renders; mdxText escapes < > { } so worked-example inequalities and
  // braces cannot break the build.
  if (concept.digDeeper) {
    parts.push(`<DigDeeper>\n\n${mdxText(concept.digDeeper)}\n\n</DigDeeper>`);
  }

  if (concept.whyItMatters) parts.push(`<Callout variant="why" text={${jsStr(concept.whyItMatters)}} />`);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/interactive/generate.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all tests pass; no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/interactive/generate.ts tests/interactive/generate.test.ts
git commit -m "feat(interactive): render <DigDeeper> per concept before the why callout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Update the lesson-note template

**Files:**
- Modify: `.claude/skills/tutor-prep/lesson-note-template.md` (the `## Concepts` section)

- [ ] **Step 1: Rewrite the `## Concepts` block**

In `.claude/skills/tutor-prep/lesson-note-template.md`, replace the `## Concepts` section (the `### C1 — <concept name>` example block and its trailing "(Repeat …)" line) with:

````md
## Concepts

### C1 — <concept name>
- **Explanation:** The concrete visible summary a learner reads first. 2–4 sentences, plain English. MUST carry a concrete anchor — a named quantity, a one-line concrete example, or the core intuition stated plainly. State what the thing IS and how you'd recognize or compute it; never a bare textbook definition.
- **Why it matters:** 1–2 sentences.
- **Check:** one question that proves understanding (not recall). — **Ideal answer:** <answer>
- **Misconception:** the single most common wrong mental model, in one sentence.
- **Application:** one concrete real-life use. OMIT THIS LINE ENTIRELY if the chapter offers no genuine application — never invent one.

#### Dig deeper
**Intuition:** plain-English WHY the mechanism works / why the formula has the shape it does — the mental model, not a restatement of the summary.

**Worked example:** a fully stepped example with every number and term shown. REQUIRED whenever the concept has any formula or procedure. Use the chapter's own example when it has one.

(Repeat `### C2`, `### C3`, … for every concept in the teaching arc. Every concept MUST have a `#### Dig deeper` block.)

**Clarity rules (non-negotiable):**
- Write the `#### Dig deeper` body **left-aligned** (no leading indentation) so it renders as prose, not a code block. Use `**bold:**` mini-labels (`**Intuition:**`, `**Worked example:**`), not deeper headings.
- Plain-text math only: `2pq`, `4/9`, `5 < 8`. No `$…$`.
- **Banned vagueness** — never assert importance without substance. Do not write: "plays a key role", "plays an important role", "is important", "is crucial", "is essential", "various", "a number of", "in many ways", "as we will see", "it is interesting", "fundamental concept", "key concept". Replace each with the specific fact.
- **Self-review before finishing:** every Explanation has a concrete anchor; every concept has a `#### Dig deeper`; every formula/procedure concept has a numeric worked example; no banned phrase appears.
````

- [ ] **Step 2: Verify the parser round-trips the template's example**

Run: `pnpm exec vitest run tests/interactive/parse.test.ts`
Expected: PASS (the Task 1 test already proves a `#### Dig deeper` block matching this shape parses correctly).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/tutor-prep/lesson-note-template.md
git commit -m "docs(tutor-prep): require concrete summary + Dig deeper in lesson template

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Update the `book-analyst` agent

**Files:**
- Modify: `.claude/agents/book-analyst.md` (the "Lesson task" section)

- [ ] **Step 1: Add clarity rules**

In `.claude/agents/book-analyst.md`, in the `## Lesson task (the tutor's prep)` section, add a new numbered rule after the existing rule about applications (rule 2):

```md
3. **Clarity (non-negotiable).** Write each concept so a learner understands it cold.
   - The `**Explanation:**` is the concrete visible summary: plain English with a concrete anchor (a named quantity, a one-line concrete example, or the core intuition). Never a bare definition.
   - Every concept MUST have a `#### Dig deeper` block containing `**Intuition:**` (why the mechanism/formula works) and, for any concept with a formula or procedure, a `**Worked example:**` with every number shown. Write it left-aligned; plain-text math only (`2pq`, `5 < 8`); no `$…$`.
   - Banned filler (replace with the specific fact): "plays a key role", "plays an important role", "is important", "is crucial", "is essential", "various", "a number of", "in many ways", "as we will see", "it is interesting", "fundamental concept", "key concept".
   - **Before emitting your `✓ … done` line, self-review:** every Explanation has a concrete anchor; every concept has a `#### Dig deeper`; every formula/procedure concept has a numeric worked example; no banned phrase appears.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/book-analyst.md
git commit -m "docs(book-analyst): enforce concrete summary + Dig deeper + ban filler

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Wire `lint-lessons` into the `/tutor-prep` flow

**Files:**
- Modify: `.claude/skills/tutor-prep/SKILL.md` (add a step after a note is written)

- [ ] **Step 1: Add the clarity-lint step**

In `.claude/skills/tutor-prep/SKILL.md`, in step 6 ("Process chapters sequentially"), add a new sub-step after the existing **d. Auto-correct figure page citations** sub-step:

```md
**e. Clarity lint (all modes).** After the note is written, run:
```bash
pnpm exec tsx src/cli.ts lint-lessons $0
```
If it exits non-zero because a concept in the just-written chapter is missing a `#### Dig deeper` block, re-dispatch the same chapter once, instructing the analyst to add the missing Dig-deeper block(s) (intuition + worked example). Warnings (short Dig deeper, vague filler) are advisory — report them but do not re-dispatch.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/tutor-prep/SKILL.md
git commit -m "docs(tutor-prep): run lint-lessons clarity check after each chapter

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Note Dig deeper in the `/tutor` skill (low-touch)

**Files:**
- Modify: `.claude/skills/tutor/SKILL.md`

- [ ] **Step 1: Add one line**

In `.claude/skills/tutor/SKILL.md`, where it describes reading a concept's lesson-note fields, add a sentence:

```md
Each concept's `#### Dig deeper` block holds the intuition and a worked example — lean on it to elaborate when a learner is stuck or asks "why".
```

(If the skill does not enumerate concept fields, add this sentence to the section that explains how the tutor teaches a concept.)

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/tutor/SKILL.md
git commit -m "docs(tutor): point the tutor at the Dig deeper block for elaboration

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Regenerate networks-book through the upgraded flow

**Run this task in the MAIN session** — it invokes skills (`/tutor-prep`, `/visualize`), which subagents cannot call. (If executing via subagent-driven-development, the controller performs this task directly.)

**Files:**
- Regenerate: `book-output/networks-book/lessons/*.md`, `interactive-book/docs/networks-book/*`, possibly `interactive-book/src/sims/networks-book/*`

- [ ] **Step 1: Clear existing notes (full regenerate)**

```bash
rm book-output/networks-book/lessons/*.md
```

- [ ] **Step 2: Regenerate lesson notes through the upgraded flow**

Invoke the skill: `/tutor-prep networks-book`
Expected: 5 chapter notes rewritten, each concept with a concrete Explanation + `#### Dig deeper`; the per-chapter `lint-lessons` step reports 0 errors.

- [ ] **Step 3: Verify clarity**

```bash
pnpm exec tsx src/cli.ts lint-lessons networks-book
```
Expected: `0 error(s)` (warnings acceptable). If any error, the regenerate step's re-dispatch did not fire — re-run `/tutor-prep networks-book 0N` for the failing chapter number.

- [ ] **Step 4: Reconcile concept names against the sim manifest**

```bash
echo "=== manifest concept anchors ===" ; \
grep -o '"concept": *"[^"]*"' interactive-book/src/sims/networks-book/manifest.json | sort -u ; \
echo "=== regenerated concept names ===" ; \
grep -h '^### C[0-9]' book-output/networks-book/lessons/*.md | sed 's/^### C[0-9]* *[—–-] *//' | sort -u
```
Compare the two lists. For any chapter whose concept names **changed** such that a sim's `concept` no longer matches a `### Cn — <name>` heading, re-author that chapter's sims: `/visualize networks-book <N>`. Concept names that still match need no action (preserves the hand-polished sims).

- [ ] **Step 5: Re-extract figures and regenerate the site**

```bash
pnpm exec tsx src/cli.ts extract-figures networks-book
pnpm exec tsx src/cli.ts interactive networks-book
```
Expected: figures extracted (or gracefully skipped if Python/PyMuPDF unavailable); MDX regenerated under `interactive-book/docs/networks-book/`.

- [ ] **Step 6: Build gate**

```bash
cd interactive-book && pnpm build && cd ..
```
Expected: `[SUCCESS] Generated static files`. If a sim page fails because a concept was renamed and a sim no longer anchors, return to Step 4 for that chapter.

- [ ] **Step 7: Lint sims (unchanged gate) + final clarity check**

```bash
pnpm exec tsx src/cli.ts lint-sims networks-book
pnpm exec tsx src/cli.ts lint-lessons networks-book
```
Expected: sims clean; lessons report 0 errors.

- [ ] **Step 8: Commit the regenerated tracked artifacts**

`interactive-book/docs/` and `book-output/` are gitignored; only tracked changes (sims/manifest, if re-authored) get committed.

```bash
git add interactive-book/src/sims/networks-book
git commit -m "chore(networks-book): regenerate sims after lesson reflow (if changed)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" || echo "no tracked sim changes to commit"
```

---

## Self-Review

**1. Spec coverage:**
- Concrete visible summary → Task 6 (template) + Task 7 (agent).
- Required `#### Dig deeper` (intuition + worked example) → Tasks 1 (parse), 5 (render), 6, 7.
- `Concept.digDeeper` type → Task 1.
- `<DigDeeper>` render order (after sim, before why) → Task 5 (test asserts position).
- `DigDeeper.tsx` + registration + CSS → Task 4.
- MDX-escaping of inequalities → Task 5 (test asserts `5 &lt; 8`).
- `lint-lessons` advisory check (missing=error, short/filler=warning) → Tasks 2 (checker) + 3 (CLI).
- Wire into `/tutor-prep` → Task 8.
- `/tutor` note → Task 9.
- Plain-text math, banned phrases, self-review checklist → Tasks 6, 7.
- networks-book full regenerate + name reconcile → Task 10.
- Tests (parse, clarity, generate) → Tasks 1, 2, 5.
All spec requirements map to a task.

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; every command has an expected result.

**3. Type consistency:** `Concept.digDeeper?: string` (Task 1) is read identically by `checkConcept` (Task 2), the CLI via `checkConcepts` (Task 3), and `renderConcept` (Task 5). `ClarityFinding { concept; level; message }` is consistent between `clarity.ts` and the CLI. `checkConcepts`/`checkConcept`/`BANNED_PHRASES`/`MIN_DIG_DEEPER_WORDS` exports match their imports in the test and CLI. `renderChapter(lesson, chapter, slug, bookTitle, imageByLabel, sims)` signature in the Task 5 test matches the existing `generate.ts` signature.
