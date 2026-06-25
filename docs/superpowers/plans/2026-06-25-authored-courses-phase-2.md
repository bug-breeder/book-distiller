# Authored Courses Phase 2 — Browser Practice→Feedback Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browser-side IELTS essay scorer to the generated Docusaurus site — each visitor supplies their own OpenAI-compatible API key, writes an essay, gets a validated 4-criterion band score with inline errors + band-7 rewrites, and tracks a band trajectory + persistent SM-2 review deck, all in their own `localStorage`.

**Architecture:** The `interactive` generator gains a skill-course branch that reads `rubric.md` / `prompts.md` / `feedback-spec.md` from `book-output/<slug>/` and emits a co-located `practice.json` + a `practice.mdx` that mounts `<PracticeScorer>`. In the browser, pure libs (`score.ts`, `practiceStore.ts`, `srs.ts`) drive the loop: `scoreEssay` calls the visitor's provider directly (with a keyless Cloudflare Pages Function `/api/score` as a CORS fallback), `parseScoreResponse` validates the JSON contract before any render, and the result feeds `localStorage`-backed attempts + an SM-2 deck. A `course-author` skill step authors the three assets.

**Tech Stack:** TypeScript (strict, ES modules, NodeNext `.js` imports), Node generator under `src/` (tested by root `vitest`), React 19 + Docusaurus 3.10 + Recharts 3.8 under `interactive-book/` (new local `vitest` for pure libs; `tsc` + `pnpm build` as the render gate for components), Cloudflare Pages + Pages Functions for hosting, raw `fetch` (no OpenAI SDK, no new npm runtime deps).

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from `docs/superpowers/specs/2026-06-24-authored-courses-and-ielts-writing-design.md`.

- **Bring-your-own-key.** study-mate ships **no API key** in the bundle and runs **no key-holding server**. The visitor's key lives only in their `localStorage` and is sent only to the provider they configure. The Cloudflare Function forwards the visitor's own `Authorization` header and stores nothing.
- **No auth gate, no shared/pooled key, no accounts.** A visitor without a key can read the course but cannot score essays.
- **Validated grading contract.** `parseScoreResponse` rejects any response missing a criterion, missing a `descriptorQuote`, or with a band outside 0–9 in 0.5 steps — garbage is never rendered.
- **Official rounding.** `overall` = mean of the four criterion bands (TR, CC, LR, GRA), rounded to the nearest half band.
- **At most one automatic retry per submit** (CORS→fallback, or format→re-request); beyond that is a manual retry button. No loops, no double-charging.
- **Do not persist essay text by default.** Store only grade + metadata. Offer export-to-JSON + per-course reset.
- **Leave `<Flashcards>` untouched.** `<ReviewDrills>` is a new, separate persistent SM-2 deck.
- **No new viz library** — `recharts@^3.8.1` is already a dependency of `interactive-book`.
- **Code style:** TypeScript strict mode, ES modules, `async/await`, imports use `.js` extension (NodeNext) in `src/`, **no `any`** (use explicit types or `unknown`).
- **Commit message footer** (every commit): a trailing line `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Node generator side (`src/`, tested by root `vitest run`):**
- Create `src/courses/practice.ts` — practice-asset types + `parsePrompts`, `buildPracticeBundle`, `renderPracticeMdx`, `readPracticeAssets`.
- Modify `src/interactive/generate.ts` — add the skill-course branch that writes `practice.json` + `practice.mdx`.

**Browser side (`interactive-book/`):**
- Create `interactive-book/vitest.config.ts` + add `vitest` devDep & `test` script to `interactive-book/package.json` — local test runner for pure libs.
- Create `interactive-book/src/lib/practiceTypes.ts` — shared TS types (`ScoreResult`, `Attempt`, `Config`, `ReviewCard`, `PracticeBundle`, errors).
- Create `interactive-book/src/lib/srs.ts` — pure SM-2 (adapted from `src/progress/schedule.ts`).
- Create `interactive-book/src/lib/practiceStore.ts` — `localStorage` store (injected `Storage`).
- Create `interactive-book/src/lib/score.ts` — error classes + `parseScoreResponse` + `buildScoreRequest` + `scoreEssay` (injected `fetch`).
- Create `interactive-book/src/components/PracticeScorer.tsx`, `BandTrajectory.tsx`, `ReviewDrills.tsx`.
- Modify `interactive-book/src/theme/MDXComponents.tsx` — register the three components.
- Create `interactive-book/functions/api/score.ts` — keyless CORS pass-through Pages Function.
- Create `interactive-book/CLOUDFLARE.md` — deploy notes.

**Authoring side:**
- Create `.claude/skills/author-course/practice-assets-format.md` — format templates for the three assets.
- Modify `.claude/skills/author-course/SKILL.md` — add the skill-artifacts authoring step.
- Modify `.claude/agents/course-author.md` — add the practice-assets authoring capability.

---

## Data Contracts (read before any task)

These types are introduced in Task 1 (`src/courses/practice.ts`) and Task 3 (`interactive-book/src/lib/practiceTypes.ts`). The browser `PracticeBundle` mirror MUST stay structurally identical to the generator's output.

```typescript
// Emitted as practice.json by the generator; consumed by <PracticeScorer>.
interface PracticePrompt {
  id: string;            // stable, kebab-case, unique within the bundle
  task: 1 | 2;
  type: string;          // e.g. "opinion", "discussion", "line-chart", "process"
  prompt: string;        // the full question text shown to the learner
  imageUrl?: string;     // optional Task 1 chart/diagram image (site-relative)
}
interface PracticeBundle {
  slug: string;
  title: string;
  rubric: string;        // raw rubric.md text — goes verbatim into the system prompt
  feedbackSpec: string;  // raw feedback-spec.md text — goes verbatim into the system prompt
  prompts: PracticePrompt[];
}

// The validated grading result (output of parseScoreResponse).
type Criterion = 'TR' | 'CC' | 'LR' | 'GRA';
interface CriterionScore { band: number; justification: string; descriptorQuote: string; }
interface InlineError { quote: string; type: 'grammar' | 'lexis' | 'cohesion' | 'task'; issue: string; fix: string; }
interface Rewrite { original: string; improved: string; why: string; }
interface ScoreResult {
  overall: number;
  criteria: Record<Criterion, CriterionScore>;
  inlineErrors: InlineError[];
  rewrites: Rewrite[];
  recurringErrorTags: string[];
}

// Persistence shapes.
interface Config { apiKey: string; baseURL: string; model: string; }
interface Attempt {
  id: string;            // crypto.randomUUID()
  ts: string;            // ISO timestamp
  task: 1 | 2;
  promptId: string;
  wordCount: number;
  overall: number;
  criteria: Record<Criterion, number>;   // bands only, for the trajectory chart
  recurringErrorTags: string[];
}
interface ReviewCard {   // SM-2 card; no `chapter` field (browser cards are not chapter-bound)
  id: string;            // "err:<tag>"
  concept: string;       // the error tag
  question: string;
  answer: string;
  dueDate: string;       // YYYY-MM-DD
  interval: number;
  ease: number;
  lapses: number;
}
```

---

### Task 1: Practice-asset types, prompt parser, and bundle/MDX builders (`src/courses/practice.ts`)

**Files:**
- Create: `src/courses/practice.ts`
- Test: `tests/courses/practice.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module). `fs-extra` and `node:path` are already used across `src/`.
- Produces:
  - `interface PracticePrompt { id: string; task: 1 | 2; type: string; prompt: string; imageUrl?: string }`
  - `interface PracticeBundle { slug: string; title: string; rubric: string; feedbackSpec: string; prompts: PracticePrompt[] }`
  - `parsePrompts(md: string): PracticePrompt[]`
  - `buildPracticeBundle(slug: string, title: string, rubricMd: string, feedbackSpecMd: string, promptsMd: string): PracticeBundle`
  - `renderPracticeMdx(slug: string, title: string): string`
  - `readPracticeAssets(slug: string): Promise<{ rubric: string; feedbackSpec: string; prompts: string } | null>` (returns `null` if any asset is missing)

**Prompt file format** (`prompts.md`) the parser must accept — one prompt per `###` heading:

```markdown
### opinion-tech-replaces-teachers
- task: 2
- type: opinion
Some people believe technology will replace teachers. To what extent do you agree or disagree?

### line-chart-energy-2000-2020
- task: 1
- type: line-chart
- image: /practice-assets/ielts-writing-7/energy.png
The line graph shows energy consumption by source between 2000 and 2020. Summarise the information.
```

The heading text is the `id`. The `- task:` / `- type:` / optional `- image:` metadata lines follow. Every remaining non-blank line until the next `###` is joined with spaces to form `prompt`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/courses/practice.test.ts
import { describe, it, expect } from 'vitest';
import { parsePrompts, buildPracticeBundle, renderPracticeMdx } from '../../src/courses/practice.js';

const PROMPTS = `### opinion-tech-replaces-teachers
- task: 2
- type: opinion
Some people believe technology will replace teachers.
To what extent do you agree?

### line-chart-energy
- task: 1
- type: line-chart
- image: /practice-assets/ielts/energy.png
The line graph shows energy consumption between 2000 and 2020.
`;

describe('parsePrompts', () => {
  const prompts = parsePrompts(PROMPTS);

  it('parses each ### block into a structured prompt', () => {
    expect(prompts).toHaveLength(2);
  });

  it('uses the heading as id and reads task/type', () => {
    expect(prompts[0]).toMatchObject({ id: 'opinion-tech-replaces-teachers', task: 2, type: 'opinion' });
  });

  it('joins multi-line prompt text with spaces', () => {
    expect(prompts[0].prompt).toBe('Some people believe technology will replace teachers. To what extent do you agree?');
  });

  it('captures the optional image for Task 1', () => {
    expect(prompts[1].imageUrl).toBe('/practice-assets/ielts/energy.png');
    expect(prompts[0].imageUrl).toBeUndefined();
  });
});

describe('buildPracticeBundle', () => {
  it('ships rubric + feedback-spec verbatim and parsed prompts', () => {
    const bundle = buildPracticeBundle('ielts', 'IELTS', 'RUBRIC TEXT', 'SPEC TEXT', PROMPTS);
    expect(bundle).toMatchObject({ slug: 'ielts', title: 'IELTS', rubric: 'RUBRIC TEXT', feedbackSpec: 'SPEC TEXT' });
    expect(bundle.prompts).toHaveLength(2);
  });
});

describe('renderPracticeMdx', () => {
  const mdx = renderPracticeMdx('ielts', 'IELTS Academic Writing 7.0');

  it('imports the co-located practice.json', () => {
    expect(mdx).toContain("import practice from './practice.json';");
  });

  it('mounts PracticeScorer, BandTrajectory and ReviewDrills with the bundle', () => {
    expect(mdx).toContain('<PracticeScorer bundle={practice} />');
    expect(mdx).toContain('<BandTrajectory slug="ielts" />');
    expect(mdx).toContain('<ReviewDrills slug="ielts" />');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/courses/practice.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/courses/practice.js"` / functions not defined.

- [ ] **Step 3: Write the implementation**

```typescript
// src/courses/practice.ts
import fs from 'fs-extra';
import path from 'node:path';

export interface PracticePrompt {
  id: string;
  task: 1 | 2;
  type: string;
  prompt: string;
  imageUrl?: string;
}

export interface PracticeBundle {
  slug: string;
  title: string;
  rubric: string;
  feedbackSpec: string;
  prompts: PracticePrompt[];
}

/** Parse a prompts.md file: one prompt per `### <id>` heading, with `- task:`,
 *  `- type:`, optional `- image:` metadata lines, then free prompt text. */
export function parsePrompts(md: string): PracticePrompt[] {
  const blocks = md.split(/^###\s+/m).map((b) => b.trim()).filter(Boolean);
  const prompts: PracticePrompt[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const id = lines[0].trim();
    let task: 1 | 2 = 2;
    let type = '';
    let imageUrl: string | undefined;
    const textLines: string[] = [];
    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (!line) continue;
      const meta = line.match(/^-\s*(task|type|image)\s*:\s*(.+)$/i);
      if (meta) {
        const key = meta[1].toLowerCase();
        const val = meta[2].trim();
        if (key === 'task') task = val === '1' ? 1 : 2;
        else if (key === 'type') type = val;
        else if (key === 'image') imageUrl = val;
        continue;
      }
      textLines.push(line);
    }
    const prompt = textLines.join(' ').trim();
    prompts.push(imageUrl ? { id, task, type, prompt, imageUrl } : { id, task, type, prompt });
  }
  return prompts;
}

export function buildPracticeBundle(
  slug: string,
  title: string,
  rubricMd: string,
  feedbackSpecMd: string,
  promptsMd: string,
): PracticeBundle {
  return {
    slug,
    title,
    rubric: rubricMd.trim(),
    feedbackSpec: feedbackSpecMd.trim(),
    prompts: parsePrompts(promptsMd),
  };
}

/** The practice page MDX. Imports the co-located bundle and mounts the three
 *  globally-registered components (no per-file component imports needed). */
export function renderPracticeMdx(slug: string, title: string): string {
  return [
    '---',
    `title: "Practice & Feedback — ${title}"`,
    'sidebar_position: 999',
    '---',
    '',
    "import practice from './practice.json';",
    '',
    `# Practice & Feedback`,
    '',
    'Write a full essay against a prompt below and get an estimated band score against the four IELTS criteria. You supply your own OpenAI-compatible API key — it is stored only in this browser and sent only to the provider you configure.',
    '',
    '<PracticeScorer bundle={practice} />',
    '',
    '## Your band trajectory',
    '',
    `<BandTrajectory slug="${slug}" />`,
    '',
    '## Review drills',
    '',
    `<ReviewDrills slug="${slug}" />`,
    '',
  ].join('\n');
}

/** Read the three skill assets from book-output/<slug>/. Returns null if any is absent. */
export async function readPracticeAssets(
  slug: string,
): Promise<{ rubric: string; feedbackSpec: string; prompts: string } | null> {
  const dir = path.join('book-output', slug);
  const files = {
    rubric: path.join(dir, 'rubric.md'),
    feedbackSpec: path.join(dir, 'feedback-spec.md'),
    prompts: path.join(dir, 'prompts.md'),
  };
  for (const p of Object.values(files)) {
    if (!(await fs.pathExists(p))) return null;
  }
  return {
    rubric: await fs.readFile(files.rubric, 'utf-8'),
    feedbackSpec: await fs.readFile(files.feedbackSpec, 'utf-8'),
    prompts: await fs.readFile(files.prompts, 'utf-8'),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/courses/practice.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/courses/practice.ts tests/courses/practice.test.ts
git commit -m "feat(courses): practice-asset parser + bundle/MDX builders

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Generator emits practice.json + practice.mdx for skill courses (`src/interactive/generate.ts`)

**Files:**
- Modify: `src/interactive/generate.ts` (the `generateInteractiveBook` function, around lines 328–406)
- Test: `tests/interactive/practice-generate.test.ts`

**Interfaces:**
- Consumes: `readPracticeAssets`, `buildPracticeBundle`, `renderPracticeMdx` from `src/courses/practice.js` (Task 1); `BookMetadata.courseType` (already `'skill' | 'knowledge'` on `src/parser/types.ts:29-42`).
- Produces: when `meta.courseType === 'skill'` and the three assets exist, writes `interactive-book/docs/<slug>/practice.json` and `interactive-book/docs/<slug>/practice.mdx`, and includes `practice.mdx` in the returned `written[]`.

**Context:** `generateInteractiveBook(slug)` reads `book-output/<slug>/metadata.json` into `meta`, loops chapters writing `<base>.mdx` + `<base>.reviews.json` into `bookDocs` (the `interactive-book/docs/<slug>` dir), and returns `{ written, prepared, total, skipped }`. Add the practice emission **after** the chapter loop, before `return`. The variable holding the output dir is `bookDocs`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/interactive/practice-generate.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { generateInteractiveBook } from '../../src/interactive/generate.js';

const SLUG = 'test-skill-course';
let cwd: string;

beforeAll(async () => {
  cwd = process.cwd();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'phase2-gen-'));
  process.chdir(tmp);
  // Minimal book-output for a skill course (one module, no lesson note needed for this assertion).
  await fs.outputJson(path.join('book-output', SLUG, 'metadata.json'), {
    slug: SLUG,
    title: 'Test Skill Course',
    author: 'x',
    language: 'en',
    sourceFile: '',
    parsedAt: new Date().toISOString(),
    chapterCount: 0,
    chapters: [],
    sourceType: 'authored',
    courseType: 'skill',
  });
  await fs.outputFile(path.join('book-output', SLUG, 'rubric.md'), 'RUBRIC BODY');
  await fs.outputFile(path.join('book-output', SLUG, 'feedback-spec.md'), 'SPEC BODY');
  await fs.outputFile(
    path.join('book-output', SLUG, 'prompts.md'),
    '### p1\n- task: 2\n- type: opinion\nDo you agree?\n',
  );
  // interactive-book/docs must exist (generator writes under it).
  await fs.ensureDir(path.join('interactive-book', 'docs'));
});

afterAll(async () => {
  const tmp = process.cwd();
  process.chdir(cwd);
  await fs.remove(tmp);
});

describe('generateInteractiveBook — skill course', () => {
  it('emits practice.json and practice.mdx mounting PracticeScorer', async () => {
    const result = await generateInteractiveBook(SLUG);
    const docs = path.join('interactive-book', 'docs', SLUG);

    const bundle = await fs.readJson(path.join(docs, 'practice.json'));
    expect(bundle).toMatchObject({ slug: SLUG, rubric: 'RUBRIC BODY', feedbackSpec: 'SPEC BODY' });
    expect(bundle.prompts).toHaveLength(1);

    const mdx = await fs.readFile(path.join(docs, 'practice.mdx'), 'utf-8');
    expect(mdx).toContain('<PracticeScorer bundle={practice} />');
    expect(result.written.some((p) => p.endsWith('practice.mdx'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/interactive/practice-generate.test.ts`
Expected: FAIL — `practice.json` does not exist (generator hasn't written it yet).

- [ ] **Step 3: Add the imports at the top of `src/interactive/generate.ts`**

Add to the existing import block:

```typescript
import { readPracticeAssets, buildPracticeBundle, renderPracticeMdx } from '../courses/practice.js';
```

- [ ] **Step 4: Add the practice emission after the chapter loop**

Find the end of the `for (const chapter of meta.chapters) { ... }` loop in `generateInteractiveBook`, and immediately **after** the loop closes (before `return { written, ... }`), insert:

```typescript
  if (meta.courseType === 'skill') {
    const assets = await readPracticeAssets(slug);
    if (assets) {
      const bundle = buildPracticeBundle(slug, meta.title, assets.rubric, assets.feedbackSpec, assets.prompts);
      const practiceJsonPath = path.join(bookDocs, 'practice.json');
      const practiceMdxPath = path.join(bookDocs, 'practice.mdx');
      await fs.ensureDir(bookDocs);
      await fs.writeJson(practiceJsonPath, bundle, { spaces: 0 });
      await fs.writeFile(practiceMdxPath, renderPracticeMdx(slug, meta.title), 'utf-8');
      written.push(practiceMdxPath);
    }
  }
```

> Note: if the local variable for the output directory is not named `bookDocs`, use whatever name the function already uses for `interactive-book/docs/<slug>` (confirm by reading the function — it is the dir `<base>.mdx` is written into).

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/interactive/practice-generate.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full generator suite + typecheck (no regressions)**

Run: `pnpm exec vitest run tests/interactive/ && pnpm typecheck`
Expected: all PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/interactive/generate.ts tests/interactive/practice-generate.test.ts
git commit -m "feat(interactive): emit practice.json + practice.mdx for skill courses

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Bootstrap interactive-book tests + shared types + SM-2 port

**Files:**
- Modify: `interactive-book/package.json` (add `vitest` devDependency + `test` script)
- Create: `interactive-book/vitest.config.ts`
- Create: `interactive-book/src/lib/practiceTypes.ts`
- Create: `interactive-book/src/lib/srs.ts`
- Test: `interactive-book/src/lib/srs.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - All types listed in **Data Contracts** above, exported from `practiceTypes.ts`.
  - `srs.ts`: `addDays(date: string, days: number): string`, `seedCard(base: { id: string; concept: string; question: string; answer: string }, today: string, interval?: number): ReviewCard`, `applyResult(card: ReviewCard, result: 'pass' | 'fail', today: string): ReviewCard`, `dueCards(deck: ReviewCard[], today: string): ReviewCard[]`, plus `DEFAULT_EASE = 2.5`, `MIN_EASE = 1.3`.

> Note on imports: `interactive-book` uses bundler resolution (Docusaurus), so intra-`src` imports here are **extensionless** (e.g. `import { addDays } from './srs'`), unlike the `.js`-suffixed imports in the root `src/`.

- [ ] **Step 1: Add the test runner to `interactive-book/package.json`**

In `"scripts"`, add:

```json
    "test": "vitest run"
```

In (or add) `"devDependencies"`, add:

```json
    "vitest": "^3.0.0"
```

Then install:

Run: `cd interactive-book && pnpm install`
Expected: vitest added to the lockfile.

- [ ] **Step 2: Create `interactive-book/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
```

- [ ] **Step 3: Create the shared types `interactive-book/src/lib/practiceTypes.ts`**

```typescript
export type Criterion = 'TR' | 'CC' | 'LR' | 'GRA';
export const CRITERIA: Criterion[] = ['TR', 'CC', 'LR', 'GRA'];

export interface CriterionScore {
  band: number;
  justification: string;
  descriptorQuote: string;
}
export interface InlineError {
  quote: string;
  type: 'grammar' | 'lexis' | 'cohesion' | 'task';
  issue: string;
  fix: string;
}
export interface Rewrite {
  original: string;
  improved: string;
  why: string;
}
export interface ScoreResult {
  overall: number;
  criteria: Record<Criterion, CriterionScore>;
  inlineErrors: InlineError[];
  rewrites: Rewrite[];
  recurringErrorTags: string[];
}

export interface PracticePrompt {
  id: string;
  task: 1 | 2;
  type: string;
  prompt: string;
  imageUrl?: string;
}
export interface PracticeBundle {
  slug: string;
  title: string;
  rubric: string;
  feedbackSpec: string;
  prompts: PracticePrompt[];
}

export interface Config {
  apiKey: string;
  baseURL: string;
  model: string;
}
export interface Attempt {
  id: string;
  ts: string;
  task: 1 | 2;
  promptId: string;
  wordCount: number;
  overall: number;
  criteria: Record<Criterion, number>;
  recurringErrorTags: string[];
}
export interface ReviewCard {
  id: string;
  concept: string;
  question: string;
  answer: string;
  dueDate: string;
  interval: number;
  ease: number;
  lapses: number;
}
```

- [ ] **Step 4: Write the failing SM-2 test**

```typescript
// interactive-book/src/lib/srs.test.ts
import { describe, it, expect } from 'vitest';
import { addDays, seedCard, applyResult, dueCards, DEFAULT_EASE, MIN_EASE } from './srs';

describe('addDays', () => {
  it('adds days DST-safe', () => {
    expect(addDays('2026-06-25', 3)).toBe('2026-06-28');
  });
});

describe('seedCard', () => {
  it('creates a fresh card due `interval` days out', () => {
    const c = seedCard({ id: 'err:articles', concept: 'articles', question: 'q', answer: 'a' }, '2026-06-25');
    expect(c).toMatchObject({ id: 'err:articles', interval: 3, ease: DEFAULT_EASE, lapses: 0, dueDate: '2026-06-28' });
  });
});

describe('applyResult', () => {
  const base = seedCard({ id: 'x', concept: 'c', question: 'q', answer: 'a' }, '2026-06-25');

  it('pass grows the interval by ease', () => {
    const next = applyResult(base, 'pass', '2026-06-25');
    expect(next.interval).toBe(Math.max(1, Math.round(3 * DEFAULT_EASE)));
  });

  it('fail resets interval to 1, drops ease, bumps lapses', () => {
    const next = applyResult(base, 'fail', '2026-06-25');
    expect(next.interval).toBe(1);
    expect(next.lapses).toBe(1);
    expect(next.ease).toBe(Number((DEFAULT_EASE - 0.2).toFixed(2)));
    expect(next.dueDate).toBe('2026-06-26');
  });

  it('never drops ease below MIN_EASE', () => {
    let c = { ...base, ease: MIN_EASE };
    c = applyResult(c, 'fail', '2026-06-25');
    expect(c.ease).toBe(MIN_EASE);
  });
});

describe('dueCards', () => {
  it('returns cards due on or before today', () => {
    const a = { ...seedCard({ id: 'a', concept: 'c', question: 'q', answer: 'a' }, '2026-06-20', 1) };
    const b = { ...seedCard({ id: 'b', concept: 'c', question: 'q', answer: 'a' }, '2026-06-25', 10) };
    expect(dueCards([a, b], '2026-06-25').map((c) => c.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `cd interactive-book && pnpm exec vitest run src/lib/srs.test.ts`
Expected: FAIL — cannot resolve `./srs`.

- [ ] **Step 6: Create `interactive-book/src/lib/srs.ts`**

```typescript
// Pure SM-2 scheduler, adapted from src/progress/schedule.ts for the browser.
// ReviewCard has no `chapter` field — browser cards are not chapter-bound.
import type { ReviewCard } from './practiceTypes';

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

/** Add `days` to a YYYY-MM-DD string, returning YYYY-MM-DD (UTC math, DST-safe). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

type SeedBase = { id: string; concept: string; question: string; answer: string };

/** Create a fresh review card. `interval` defaults to 3 days. */
export function seedCard(base: SeedBase, today: string, interval = 3): ReviewCard {
  return { ...base, interval, ease: DEFAULT_EASE, lapses: 0, dueDate: addDays(today, interval) };
}

/** Apply a review result, returning an updated card (pure). */
export function applyResult(card: ReviewCard, result: 'pass' | 'fail', today: string): ReviewCard {
  if (result === 'pass') {
    const interval = Math.max(1, Math.round(card.interval * card.ease));
    return { ...card, interval, dueDate: addDays(today, interval) };
  }
  return {
    ...card,
    interval: 1,
    lapses: card.lapses + 1,
    ease: Math.max(MIN_EASE, Number((card.ease - 0.2).toFixed(2))),
    dueDate: addDays(today, 1),
  };
}

/** Cards due on or before `today` (YYYY-MM-DD string comparison is valid). */
export function dueCards(deck: ReviewCard[], today: string): ReviewCard[] {
  return deck.filter((c) => c.dueDate <= today);
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd interactive-book && pnpm exec vitest run src/lib/srs.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add interactive-book/package.json interactive-book/pnpm-lock.yaml interactive-book/vitest.config.ts interactive-book/src/lib/practiceTypes.ts interactive-book/src/lib/srs.ts interactive-book/src/lib/srs.test.ts
git commit -m "feat(interactive-book): add vitest + practice types + SM-2 port

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

> If `interactive-book` has its own lockfile name or no separate lockfile, adjust the `git add` to whatever `pnpm install` actually changed.

---

### Task 4: localStorage practice store (`interactive-book/src/lib/practiceStore.ts`)

**Files:**
- Create: `interactive-book/src/lib/practiceStore.ts`
- Test: `interactive-book/src/lib/practiceStore.test.ts`

**Interfaces:**
- Consumes: `seedCard` from `./srs`; types from `./practiceTypes`.
- Produces (all take an injected `Storage`-shaped object as first arg so they're testable without a browser):
  - `loadConfig(s, slug): Config`, `saveConfig(s, slug, cfg): void`
  - `loadAttempts(s, slug): Attempt[]`, `appendAttempt(s, slug, a): Attempt[]`
  - `loadDeck(s, slug): ReviewCard[]`, `saveDeck(s, slug, deck): void`
  - `seedCardsFromResult(deck, result, today): ReviewCard[]` (dedup by id `err:<tag>`; pure, no storage)
  - `summarizeAttempt(result, meta): Attempt` (pure; `meta = { task, promptId, wordCount }`)
  - `exportData(s, slug): string`, `resetData(s, slug): void`
  - `DEFAULT_CONFIG: Config = { apiKey: '', baseURL: 'https://api.openai.com/v1', model: '' }`

**Storage shape** (matches the `Storage` DOM interface subset used):

```typescript
export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

- [ ] **Step 1: Write the failing test**

```typescript
// interactive-book/src/lib/practiceStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadConfig, saveConfig, loadAttempts, appendAttempt, loadDeck, saveDeck,
  seedCardsFromResult, summarizeAttempt, exportData, resetData, DEFAULT_CONFIG, type KeyValue,
} from './practiceStore';
import type { ScoreResult } from './practiceTypes';

function memStorage(): KeyValue {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

const RESULT: ScoreResult = {
  overall: 6.5,
  criteria: {
    TR: { band: 6, justification: 'j', descriptorQuote: 'd' },
    CC: { band: 7, justification: 'j', descriptorQuote: 'd' },
    LR: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
    GRA: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
  },
  inlineErrors: [{ quote: 'a car', type: 'grammar', issue: 'article', fix: 'the car' }],
  rewrites: [],
  recurringErrorTags: ['article-misuse', 'subject-verb-agreement'],
};

let s: KeyValue;
beforeEach(() => { s = memStorage(); });

describe('config', () => {
  it('returns DEFAULT_CONFIG when unset', () => {
    expect(loadConfig(s, 'ielts')).toEqual(DEFAULT_CONFIG);
  });
  it('round-trips', () => {
    saveConfig(s, 'ielts', { apiKey: 'sk-x', baseURL: 'https://api.openai.com/v1', model: 'gpt-5.5' });
    expect(loadConfig(s, 'ielts').model).toBe('gpt-5.5');
  });
  it('namespaces by slug', () => {
    saveConfig(s, 'ielts', { apiKey: 'sk-x', baseURL: 'b', model: 'm' });
    expect(loadConfig(s, 'other')).toEqual(DEFAULT_CONFIG);
  });
});

describe('attempts', () => {
  it('appends and reads back', () => {
    const a = summarizeAttempt(RESULT, { task: 2, promptId: 'p1', wordCount: 250 });
    appendAttempt(s, 'ielts', a);
    const out = loadAttempts(s, 'ielts');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ overall: 6.5, task: 2, promptId: 'p1', wordCount: 250 });
    expect(out[0].criteria).toEqual({ TR: 6, CC: 7, LR: 6.5, GRA: 6.5 });
  });
});

describe('seedCardsFromResult', () => {
  it('creates one card per new tag', () => {
    const deck = seedCardsFromResult([], RESULT, '2026-06-25');
    expect(deck.map((c) => c.id)).toEqual(['err:article-misuse', 'err:subject-verb-agreement']);
  });
  it('dedupes against existing cards by id', () => {
    const first = seedCardsFromResult([], RESULT, '2026-06-25');
    const again = seedCardsFromResult(first, RESULT, '2026-06-26');
    expect(again).toHaveLength(2); // no duplicates added
  });
});

describe('export/reset', () => {
  it('exports attempts + deck and reset clears them', () => {
    appendAttempt(s, 'ielts', summarizeAttempt(RESULT, { task: 2, promptId: 'p1', wordCount: 250 }));
    saveDeck(s, 'ielts', seedCardsFromResult([], RESULT, '2026-06-25'));
    const json = JSON.parse(exportData(s, 'ielts'));
    expect(json.attempts).toHaveLength(1);
    expect(json.deck).toHaveLength(2);
    resetData(s, 'ielts');
    expect(loadAttempts(s, 'ielts')).toEqual([]);
    expect(loadDeck(s, 'ielts')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd interactive-book && pnpm exec vitest run src/lib/practiceStore.test.ts`
Expected: FAIL — cannot resolve `./practiceStore`.

- [ ] **Step 3: Create `interactive-book/src/lib/practiceStore.ts`**

```typescript
import { seedCard } from './srs';
import { CRITERIA, type Attempt, type Config, type ReviewCard, type ScoreResult, type Criterion } from './practiceTypes';

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_CONFIG: Config = {
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: '',
};

const k = (slug: string, leaf: string) => `studymate:${slug}:${leaf}`;

function readJson<T>(s: KeyValue, key: string, fallback: T): T {
  const raw = s.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadConfig(s: KeyValue, slug: string): Config {
  return { ...DEFAULT_CONFIG, ...readJson<Partial<Config>>(s, k(slug, 'config'), {}) };
}
export function saveConfig(s: KeyValue, slug: string, cfg: Config): void {
  s.setItem(k(slug, 'config'), JSON.stringify(cfg));
}

export function loadAttempts(s: KeyValue, slug: string): Attempt[] {
  return readJson<Attempt[]>(s, k(slug, 'attempts'), []);
}
export function appendAttempt(s: KeyValue, slug: string, a: Attempt): Attempt[] {
  const next = [...loadAttempts(s, slug), a];
  s.setItem(k(slug, 'attempts'), JSON.stringify(next));
  return next;
}

export function loadDeck(s: KeyValue, slug: string): ReviewCard[] {
  return readJson<ReviewCard[]>(s, k(slug, 'deck'), []);
}
export function saveDeck(s: KeyValue, slug: string, deck: ReviewCard[]): void {
  s.setItem(k(slug, 'deck'), JSON.stringify(deck));
}

/** Build the per-criterion band map for the trajectory. */
function bandMap(result: ScoreResult): Record<Criterion, number> {
  const out = {} as Record<Criterion, number>;
  for (const c of CRITERIA) out[c] = result.criteria[c].band;
  return out;
}

export function summarizeAttempt(
  result: ScoreResult,
  meta: { task: 1 | 2; promptId: string; wordCount: number },
): Attempt {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `a-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: new Date().toISOString(),
    task: meta.task,
    promptId: meta.promptId,
    wordCount: meta.wordCount,
    overall: result.overall,
    criteria: bandMap(result),
    recurringErrorTags: result.recurringErrorTags,
  };
}

/** Add one SM-2 card per NEW recurring-error tag (deduped by id `err:<tag>`). Pure. */
export function seedCardsFromResult(deck: ReviewCard[], result: ScoreResult, today: string): ReviewCard[] {
  const have = new Set(deck.map((c) => c.id));
  const next = [...deck];
  for (const tag of result.recurringErrorTags) {
    const id = `err:${tag}`;
    if (have.has(id)) continue;
    const fix = result.inlineErrors.find((e) => e.fix)?.fix ?? 'Check the relevant band descriptor.';
    next.push(
      seedCard(
        {
          id,
          concept: tag,
          question: `Recurring issue: "${tag}". Write a correct sentence that avoids it.`,
          answer: fix,
        },
        today,
      ),
    );
    have.add(id);
  }
  return next;
}

export function exportData(s: KeyValue, slug: string): string {
  return JSON.stringify(
    { slug, attempts: loadAttempts(s, slug), deck: loadDeck(s, slug) },
    null,
    2,
  );
}
export function resetData(s: KeyValue, slug: string): void {
  s.removeItem(k(slug, 'attempts'));
  s.removeItem(k(slug, 'deck'));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd interactive-book && pnpm exec vitest run src/lib/practiceStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add interactive-book/src/lib/practiceStore.ts interactive-book/src/lib/practiceStore.test.ts
git commit -m "feat(interactive-book): localStorage practice store (attempts + SM-2 deck)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Scoring client + validation gate (`interactive-book/src/lib/score.ts`)

**Files:**
- Create: `interactive-book/src/lib/score.ts`
- Test: `interactive-book/src/lib/score.test.ts`

**Interfaces:**
- Consumes: types from `./practiceTypes`.
- Produces:
  - Error classes (all extend `ScoreError` with a `kind` field): `NoKeyError`, `AuthError`, `RateLimitError`, `NetworkError`, `ScoreFormatError`, `ProviderError`.
  - `parseScoreResponse(content: string): ScoreResult` — validates the model's JSON content string; throws `ScoreFormatError` on any violation.
  - `buildScoreRequest(args): { url: string; init: RequestInit }` — builds the provider chat-completions request (system = rubric + feedbackSpec, user = task + prompt + essay, `response_format` json_schema).
  - `scoreEssay(args, deps?): Promise<ScoreResult>` — orchestrates the call with one auto-retry (CORS→`/api/score`, format→re-request). `deps` injects `fetch` for tests.
  - `args` type: `{ config: Config; rubric: string; feedbackSpec: string; task: 1 | 2; prompt: string; essay: string }`.

- [ ] **Step 1: Write the failing test**

```typescript
// interactive-book/src/lib/score.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  parseScoreResponse, scoreEssay, ScoreFormatError, NoKeyError, AuthError, RateLimitError,
} from './score';
import type { Config, ScoreResult } from './practiceTypes';

const VALID: ScoreResult = {
  overall: 6.5,
  criteria: {
    TR: { band: 6, justification: 'j', descriptorQuote: 'd' },
    CC: { band: 7, justification: 'j', descriptorQuote: 'd' },
    LR: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
    GRA: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
  },
  inlineErrors: [],
  rewrites: [],
  recurringErrorTags: [],
};

const CONFIG: Config = { apiKey: 'sk-x', baseURL: 'https://api.openai.com/v1', model: 'gpt-5.5' };
const ARGS = { config: CONFIG, rubric: 'R', feedbackSpec: 'S', task: 2 as const, prompt: 'P', essay: 'E' };

function chatResponse(body: ScoreResult, status = 200): Response {
  const payload = { choices: [{ message: { content: JSON.stringify(body) } }] };
  return new Response(JSON.stringify(payload), { status });
}

describe('parseScoreResponse', () => {
  it('accepts a valid contract', () => {
    expect(parseScoreResponse(JSON.stringify(VALID)).overall).toBe(6.5);
  });
  it('rejects non-JSON', () => {
    expect(() => parseScoreResponse('not json')).toThrow(ScoreFormatError);
  });
  it('rejects a missing criterion', () => {
    const bad = { ...VALID, criteria: { ...VALID.criteria } } as Record<string, unknown>;
    delete (bad.criteria as Record<string, unknown>).GRA;
    expect(() => parseScoreResponse(JSON.stringify(bad))).toThrow(ScoreFormatError);
  });
  it('rejects a missing descriptorQuote', () => {
    const bad = JSON.parse(JSON.stringify(VALID));
    bad.criteria.TR.descriptorQuote = '';
    expect(() => parseScoreResponse(JSON.stringify(bad))).toThrow(ScoreFormatError);
  });
  it('rejects an out-of-range / non-half-step band', () => {
    const bad = JSON.parse(JSON.stringify(VALID));
    bad.criteria.TR.band = 6.3;
    expect(() => parseScoreResponse(JSON.stringify(bad))).toThrow(ScoreFormatError);
  });
});

describe('scoreEssay', () => {
  it('throws NoKeyError when the key is empty', async () => {
    await expect(scoreEssay({ ...ARGS, config: { ...CONFIG, apiKey: '' } })).rejects.toThrow(NoKeyError);
  });
  it('returns a parsed result on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue(chatResponse(VALID));
    const out = await scoreEssay(ARGS, { fetchFn });
    expect(out.overall).toBe(6.5);
    expect(fetchFn).toHaveBeenCalledOnce();
  });
  it('maps 401 to AuthError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('no', { status: 401 }));
    await expect(scoreEssay(ARGS, { fetchFn })).rejects.toThrow(AuthError);
  });
  it('maps 429 to RateLimitError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('slow', { status: 429 }));
    await expect(scoreEssay(ARGS, { fetchFn })).rejects.toThrow(RateLimitError);
  });
  it('on a network error, retries once via the /api/score fallback', async () => {
    const fetchFn = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(chatResponse(VALID));
    const out = await scoreEssay(ARGS, { fetchFn });
    expect(out.overall).toBe(6.5);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(String(fetchFn.mock.calls[1][0])).toContain('/api/score');
  });
  it('on a format error, retries once then throws ScoreFormatError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(chatResponse({ ...VALID, overall: 99 } as ScoreResult));
    await expect(scoreEssay(ARGS, { fetchFn })).rejects.toThrow(ScoreFormatError);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd interactive-book && pnpm exec vitest run src/lib/score.test.ts`
Expected: FAIL — cannot resolve `./score`.

- [ ] **Step 3: Create `interactive-book/src/lib/score.ts`**

```typescript
import { CRITERIA, type Config, type Criterion, type ScoreResult } from './practiceTypes';

export type ScoreErrorKind =
  | 'no-key' | 'auth' | 'rate-limit' | 'network' | 'format' | 'provider';

export class ScoreError extends Error {
  kind: ScoreErrorKind;
  constructor(kind: ScoreErrorKind, message: string) {
    super(message);
    this.name = 'ScoreError';
    this.kind = kind;
  }
}
export class NoKeyError extends ScoreError { constructor() { super('no-key', 'No API key set. Add your key in settings.'); } }
export class AuthError extends ScoreError { constructor() { super('auth', 'Key rejected — check your API key.'); } }
export class RateLimitError extends ScoreError { constructor() { super('rate-limit', 'Rate-limited — retry in a moment.'); } }
export class NetworkError extends ScoreError { constructor(m = 'Network error reaching the provider.') { super('network', m); } }
export class ScoreFormatError extends ScoreError { constructor(m = "Couldn't parse the grade — retry.") { super('format', m); } }
export class ProviderError extends ScoreError { constructor(m = 'The provider returned an error.') { super('provider', m); } }

const isHalfStep = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 9 && Math.round(n * 2) === n * 2;
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Validate the model's JSON content string against the grading contract. */
export function parseScoreResponse(content: string): ScoreResult {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new ScoreFormatError('Response was not valid JSON.');
  }
  if (typeof raw !== 'object' || raw === null) throw new ScoreFormatError('Response was not an object.');
  const o = raw as Record<string, unknown>;

  if (!isHalfStep(o.overall)) throw new ScoreFormatError('overall band is missing or not a 0–9 half-step.');

  const criteria = o.criteria as Record<string, unknown> | undefined;
  if (!criteria || typeof criteria !== 'object') throw new ScoreFormatError('criteria object missing.');
  const outCriteria = {} as Record<Criterion, ScoreResult['criteria'][Criterion]>;
  for (const c of CRITERIA) {
    const entry = criteria[c] as Record<string, unknown> | undefined;
    if (!entry || typeof entry !== 'object') throw new ScoreFormatError(`criterion ${c} missing.`);
    if (!isHalfStep(entry.band)) throw new ScoreFormatError(`criterion ${c} band invalid.`);
    if (!nonEmpty(entry.justification)) throw new ScoreFormatError(`criterion ${c} justification missing.`);
    if (!nonEmpty(entry.descriptorQuote)) throw new ScoreFormatError(`criterion ${c} descriptorQuote missing.`);
    outCriteria[c] = { band: entry.band, justification: entry.justification, descriptorQuote: entry.descriptorQuote };
  }

  const inlineErrors = Array.isArray(o.inlineErrors) ? (o.inlineErrors as ScoreResult['inlineErrors']) : [];
  const rewrites = Array.isArray(o.rewrites) ? (o.rewrites as ScoreResult['rewrites']) : [];
  const recurringErrorTags = Array.isArray(o.recurringErrorTags)
    ? (o.recurringErrorTags as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  return { overall: o.overall, criteria: outCriteria, inlineErrors, rewrites, recurringErrorTags };
}

const SCORE_SCHEMA = {
  name: 'ielts_score',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['overall', 'criteria', 'inlineErrors', 'rewrites', 'recurringErrorTags'],
    properties: {
      overall: { type: 'number' },
      criteria: {
        type: 'object',
        additionalProperties: false,
        required: ['TR', 'CC', 'LR', 'GRA'],
        properties: Object.fromEntries(
          ['TR', 'CC', 'LR', 'GRA'].map((c) => [c, {
            type: 'object',
            additionalProperties: false,
            required: ['band', 'justification', 'descriptorQuote'],
            properties: {
              band: { type: 'number' },
              justification: { type: 'string' },
              descriptorQuote: { type: 'string' },
            },
          }]),
        ),
      },
      inlineErrors: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['quote', 'type', 'issue', 'fix'],
          properties: {
            quote: { type: 'string' },
            type: { type: 'string', enum: ['grammar', 'lexis', 'cohesion', 'task'] },
            issue: { type: 'string' },
            fix: { type: 'string' },
          },
        },
      },
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['original', 'improved', 'why'],
          properties: { original: { type: 'string' }, improved: { type: 'string' }, why: { type: 'string' } },
        },
      },
      recurringErrorTags: { type: 'array', items: { type: 'string' } },
    },
  },
} as const;

export interface ScoreArgs {
  config: Config;
  rubric: string;
  feedbackSpec: string;
  task: 1 | 2;
  prompt: string;
  essay: string;
}

export function buildScoreRequest(args: ScoreArgs, url: string): { url: string; init: RequestInit } {
  const system = `${args.rubric}\n\n---\n\n${args.feedbackSpec}\n\nReturn ONLY JSON matching the required schema.`;
  const user = `IELTS Academic Writing — Task ${args.task}.\n\nPrompt:\n${args.prompt}\n\nCandidate essay:\n${args.essay}`;
  const body = {
    model: args.config.model,
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_schema', json_schema: SCORE_SCHEMA },
  };
  return {
    url,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${args.config.apiKey}` },
      body: JSON.stringify(body),
    },
  };
}

interface ScoreDeps {
  fetchFn?: typeof fetch;
}

function directUrl(config: Config): string {
  return `${config.baseURL.replace(/\/$/, '')}/chat/completions`;
}

/** Map an HTTP status to a typed error (or null if OK). */
function statusError(status: number): ScoreError | null {
  if (status === 401 || status === 403) return new AuthError();
  if (status === 429) return new RateLimitError();
  if (status >= 500) return new ProviderError(`Provider returned ${status}.`);
  if (status >= 400) return new ProviderError(`Request rejected (${status}).`);
  return null;
}

async function callOnce(url: string, init: RequestInit, fetchFn: typeof fetch): Promise<ScoreResult> {
  let res: Response;
  try {
    res = await fetchFn(url, init);
  } catch {
    throw new NetworkError();
  }
  const httpErr = statusError(res.status);
  if (httpErr) throw httpErr;
  let outer: unknown;
  try {
    outer = await res.json();
  } catch {
    throw new ScoreFormatError('Provider response was not JSON.');
  }
  const content = (outer as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new ScoreFormatError('Provider response had no message content.');
  return parseScoreResponse(content);
}

/** Score an essay with at most one automatic retry (CORS→fallback, or format→re-request). */
export async function scoreEssay(args: ScoreArgs, deps: ScoreDeps = {}): Promise<ScoreResult> {
  if (!args.config.apiKey.trim()) throw new NoKeyError();
  const fetchFn = deps.fetchFn ?? fetch;
  const direct = buildScoreRequest(args, directUrl(args.config));

  try {
    return await callOnce(direct.url, direct.init, fetchFn);
  } catch (err) {
    if (err instanceof NetworkError) {
      // CORS / network: retry once through the keyless Pages Function.
      const fallback = buildScoreRequest(args, '/api/score');
      const init = { ...fallback.init, headers: { ...(fallback.init.headers as Record<string, string>), 'X-Target': directUrl(args.config) } };
      return await callOnce('/api/score', init, fetchFn);
    }
    if (err instanceof ScoreFormatError) {
      // Bad JSON: one re-request before giving up.
      return await callOnce(direct.url, direct.init, fetchFn);
    }
    throw err;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd interactive-book && pnpm exec vitest run src/lib/score.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add interactive-book/src/lib/score.ts interactive-book/src/lib/score.test.ts
git commit -m "feat(interactive-book): scoreEssay client + parseScoreResponse gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `<PracticeScorer>` component + MDX registration

**Files:**
- Create: `interactive-book/src/components/PracticeScorer.tsx`
- Modify: `interactive-book/src/theme/MDXComponents.tsx`
- (No unit test — gated by `tsc` typecheck here and the `pnpm build` render gate in Task 10. This matches how AI-authored sims are gated in this repo.)

**Interfaces:**
- Consumes: `PracticeBundle` from `../lib/practiceTypes`; `scoreEssay`, `ScoreError` from `../lib/score`; `loadConfig`, `saveConfig`, `appendAttempt`, `summarizeAttempt`, `loadDeck`, `saveDeck`, `seedCardsFromResult` from `../lib/practiceStore`.
- Produces: `export default function PracticeScorer({ bundle }: { bundle: PracticeBundle })`.

**Browser-storage guard:** `localStorage` is unavailable during Docusaurus SSR/build. Read it only inside effects/handlers, never at module top level, and guard with `typeof window !== 'undefined'`.

- [ ] **Step 1: Create the component**

```tsx
// interactive-book/src/components/PracticeScorer.tsx
import React, { useEffect, useState } from 'react';
import type { PracticeBundle, Config, ScoreResult } from '../lib/practiceTypes';
import { scoreEssay, ScoreError } from '../lib/score';
import {
  loadConfig, saveConfig, appendAttempt, summarizeAttempt,
  loadDeck, saveDeck, seedCardsFromResult, DEFAULT_CONFIG,
} from '../lib/practiceStore';

const today = (): string => new Date().toISOString().slice(0, 10);
const wordCount = (s: string): number => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function PracticeScorer({ bundle }: { bundle: PracticeBundle }): React.ReactElement {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [promptId, setPromptId] = useState<string>(bundle.prompts[0]?.id ?? '');
  const [essay, setEssay] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setConfig(loadConfig(window.localStorage, bundle.slug));
  }, [bundle.slug]);

  const prompt = bundle.prompts.find((p) => p.id === promptId) ?? bundle.prompts[0];

  function persistConfig(next: Config): void {
    setConfig(next);
    if (typeof window !== 'undefined') saveConfig(window.localStorage, bundle.slug, next);
  }

  async function onSubmit(): Promise<void> {
    if (!prompt) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await scoreEssay({
        config, rubric: bundle.rubric, feedbackSpec: bundle.feedbackSpec,
        task: prompt.task, prompt: prompt.prompt, essay,
      });
      setResult(r);
      if (typeof window !== 'undefined') {
        const s = window.localStorage;
        appendAttempt(s, bundle.slug, summarizeAttempt(r, { task: prompt.task, promptId: prompt.id, wordCount: wordCount(essay) }));
        saveDeck(s, bundle.slug, seedCardsFromResult(loadDeck(s, bundle.slug), r, today()));
      }
    } catch (e) {
      setError(e instanceof ScoreError ? e.message : 'Unexpected error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, padding: 16 }}>
      <details style={{ marginBottom: 12 }}>
        <summary><strong>API settings</strong> (stored only in this browser)</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <label>API key
            <input type="password" value={config.apiKey} placeholder="sk-..."
              onChange={(e) => persistConfig({ ...config, apiKey: e.target.value })} style={{ width: '100%' }} />
          </label>
          <label>Base URL
            <input type="text" value={config.baseURL}
              onChange={(e) => persistConfig({ ...config, baseURL: e.target.value })} style={{ width: '100%' }} />
          </label>
          <label>Model
            <input type="text" value={config.model} placeholder="gpt-5.5"
              onChange={(e) => persistConfig({ ...config, model: e.target.value })} style={{ width: '100%' }} />
          </label>
        </div>
      </details>

      <label>Prompt
        <select value={promptId} onChange={(e) => setPromptId(e.target.value)} style={{ width: '100%' }}>
          {bundle.prompts.map((p) => (
            <option key={p.id} value={p.id}>Task {p.task} — {p.type}: {p.prompt.slice(0, 60)}…</option>
          ))}
        </select>
      </label>

      {prompt?.imageUrl && <img src={prompt.imageUrl} alt="Task 1 visual" style={{ maxWidth: '100%', margin: '8px 0' }} />}
      {prompt && <p style={{ fontStyle: 'italic' }}>{prompt.prompt}</p>}

      <textarea value={essay} onChange={(e) => setEssay(e.target.value)} rows={14}
        placeholder="Write your essay here…" style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        <span>{wordCount(essay)} words</span>
        <button onClick={onSubmit} disabled={busy || !essay.trim()}>
          {busy ? 'Scoring…' : 'Score my essay'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--ifm-color-danger)', marginBottom: 8 }}>
          {error} <button onClick={onSubmit} disabled={busy}>Retry</button>
        </div>
      )}

      {result && <ScoreView result={result} />}

      <p style={{ fontSize: '0.8em', opacity: 0.7, marginTop: 12 }}>
        Your key and history stay in this browser; your essay is sent only to the provider you configured. Estimated
        bands are practice feedback, not an official IELTS score.
      </p>
    </div>
  );
}

function ScoreView({ result }: { result: ScoreResult }): React.ReactElement {
  const labels: Record<string, string> = {
    TR: 'Task Response', CC: 'Coherence & Cohesion', LR: 'Lexical Resource', GRA: 'Grammatical Range & Accuracy',
  };
  return (
    <div style={{ marginTop: 16 }}>
      <h3>Overall band: {result.overall}</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {(['TR', 'CC', 'LR', 'GRA'] as const).map((c) => (
          <div key={c} style={{ border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: 6, padding: 8 }}>
            <strong>{labels[c]}: {result.criteria[c].band}</strong>
            <p style={{ margin: '4px 0' }}>{result.criteria[c].justification}</p>
            <p style={{ margin: 0, fontSize: '0.85em', opacity: 0.8 }}>Descriptor: “{result.criteria[c].descriptorQuote}”</p>
          </div>
        ))}
      </div>

      {result.inlineErrors.length > 0 && (
        <>
          <h4>Errors to fix</h4>
          <ul>
            {result.inlineErrors.map((e, i) => (
              <li key={i}><code>{e.quote}</code> — <em>{e.type}</em>: {e.issue} → <strong>{e.fix}</strong></li>
            ))}
          </ul>
        </>
      )}

      {result.rewrites.length > 0 && (
        <>
          <h4>Band-7 rewrites</h4>
          <ul>
            {result.rewrites.map((r, i) => (
              <li key={i}><s>{r.original}</s> → <strong>{r.improved}</strong> <em>({r.why})</em></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Register the component in `interactive-book/src/theme/MDXComponents.tsx`**

Add the import (alongside the existing component imports):

```typescript
import PracticeScorer from '@site/src/components/PracticeScorer';
```

Add to the default-export object (alongside `Flashcards`, etc.):

```typescript
  PracticeScorer,
```

- [ ] **Step 3: Typecheck the interactive-book**

Run: `cd interactive-book && pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add interactive-book/src/components/PracticeScorer.tsx interactive-book/src/theme/MDXComponents.tsx
git commit -m "feat(interactive-book): PracticeScorer component (settings + scorer + feedback)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: `<BandTrajectory>` + `<ReviewDrills>` components + registration

**Files:**
- Create: `interactive-book/src/components/BandTrajectory.tsx`
- Create: `interactive-book/src/components/ReviewDrills.tsx`
- Modify: `interactive-book/src/theme/MDXComponents.tsx`
- (Gated by `tsc` + the Task 10 build gate.)

**Interfaces:**
- Consumes: `loadAttempts`, `loadDeck`, `saveDeck`, `exportData`, `resetData` from `../lib/practiceStore`; `dueCards`, `applyResult` from `../lib/srs`; `recharts` (already a dependency).
- Produces: `export default function BandTrajectory({ slug }: { slug: string })` and `export default function ReviewDrills({ slug }: { slug: string })`.

- [ ] **Step 1: Create `interactive-book/src/components/BandTrajectory.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Attempt } from '../lib/practiceTypes';
import { loadAttempts, exportData, resetData } from '../lib/practiceStore';

export default function BandTrajectory({ slug }: { slug: string }): React.ReactElement {
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  function refresh(): void {
    if (typeof window !== 'undefined') setAttempts(loadAttempts(window.localStorage, slug));
  }
  useEffect(refresh, [slug]);

  if (attempts.length === 0) return <p>No scored essays yet. Your band trajectory appears here after your first submission.</p>;

  const data = attempts.map((a, i) => ({
    n: i + 1,
    Overall: a.overall,
    TR: a.criteria.TR, CC: a.criteria.CC, LR: a.criteria.LR, GRA: a.criteria.GRA,
  }));

  function onExport(): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([exportData(window.localStorage, slug)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug}-practice.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function onReset(): void {
    if (typeof window === 'undefined') return;
    if (window.confirm('Clear all practice history for this course?')) { resetData(window.localStorage, slug); refresh(); }
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="n" label={{ value: 'attempt', position: 'insideBottom', offset: -4 }} />
          <YAxis domain={[4, 9]} />
          <Tooltip /><Legend />
          <Line type="monotone" dataKey="Overall" strokeWidth={2} />
          <Line type="monotone" dataKey="TR" /><Line type="monotone" dataKey="CC" />
          <Line type="monotone" dataKey="LR" /><Line type="monotone" dataKey="GRA" />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onExport}>Export data</button>
        <button onClick={onReset}>Reset this course</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `interactive-book/src/components/ReviewDrills.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import type { ReviewCard } from '../lib/practiceTypes';
import { loadDeck, saveDeck } from '../lib/practiceStore';
import { dueCards, applyResult } from '../lib/srs';

const today = (): string => new Date().toISOString().slice(0, 10);

export default function ReviewDrills({ slug }: { slug: string }): React.ReactElement {
  const [deck, setDeck] = useState<ReviewCard[]>([]);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setDeck(loadDeck(window.localStorage, slug));
  }, [slug]);

  const due = dueCards(deck, today());
  const card = due[0];

  function grade(result: 'pass' | 'fail'): void {
    if (!card || typeof window === 'undefined') return;
    const next = deck.map((c) => (c.id === card.id ? applyResult(c, result, today()) : c));
    saveDeck(window.localStorage, slug, next);
    setDeck(next);
    setFlipped(false);
  }

  if (deck.length === 0) return <p>No review drills yet. Cards are created from the recurring errors in your scored essays.</p>;
  if (!card) return <p>No drills due today. {deck.length} card(s) scheduled for later.</p>;

  return (
    <div style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, padding: 16, maxWidth: 560 }}>
      <p style={{ fontSize: '0.85em', opacity: 0.7 }}>{due.length} due · {deck.length} total</p>
      <p><strong>{card.question}</strong></p>
      {flipped ? (
        <>
          <p style={{ background: 'var(--ifm-color-emphasis-100)', padding: 8, borderRadius: 6 }}>{card.answer}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => grade('fail')}>Still hard</button>
            <button onClick={() => grade('pass')}>Got it</button>
          </div>
        </>
      ) : (
        <button onClick={() => setFlipped(true)}>Show guidance</button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Register both in `interactive-book/src/theme/MDXComponents.tsx`**

Add imports:

```typescript
import BandTrajectory from '@site/src/components/BandTrajectory';
import ReviewDrills from '@site/src/components/ReviewDrills';
```

Add to the default-export object:

```typescript
  BandTrajectory,
  ReviewDrills,
```

- [ ] **Step 4: Typecheck**

Run: `cd interactive-book && pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add interactive-book/src/components/BandTrajectory.tsx interactive-book/src/components/ReviewDrills.tsx interactive-book/src/theme/MDXComponents.tsx
git commit -m "feat(interactive-book): BandTrajectory + ReviewDrills components

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Keyless Cloudflare Pages Function + deploy notes

**Files:**
- Create: `interactive-book/functions/api/score.ts`
- Create: `interactive-book/CLOUDFLARE.md`
- (No unit test — this is a thin pass-through exercised by the Task 5 fallback test and manual smoke. It holds no secret.)

**Interfaces:**
- Consumes: nothing (Cloudflare Pages Functions runtime). The browser calls it with the visitor's `Authorization` header and an `X-Target` header carrying the absolute provider chat-completions URL (set by `scoreEssay`'s fallback path in Task 5).
- Produces: a POST handler that forwards the body + `Authorization` to `X-Target` and returns the response with permissive CORS; plus an OPTIONS preflight handler.

- [ ] **Step 1: Create `interactive-book/functions/api/score.ts`**

```typescript
// Keyless CORS pass-through. Holds NO secret. Forwards the visitor's own
// Authorization header + body to the provider URL given in the X-Target header.
// Used only when a provider blocks browser-origin (CORS) calls.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Target',
};

interface Ctx { request: Request; }

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request }: Ctx): Promise<Response> {
  const target = request.headers.get('X-Target');
  if (!target || !/^https:\/\//.test(target)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid X-Target' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
  const auth = request.headers.get('Authorization') ?? '';
  const upstream = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: await request.text(),
  });
  const headers = new Headers(upstream.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(upstream.body, { status: upstream.status, headers });
}
```

- [ ] **Step 2: Create `interactive-book/CLOUDFLARE.md`**

```markdown
# Deploying to Cloudflare Pages

The interactive book is a static Docusaurus site with one keyless Pages Function.

## Build settings (Cloudflare Pages dashboard)

- **Framework preset:** None / Docusaurus
- **Build command:** `pnpm install && pnpm build`
- **Build output directory:** `interactive-book/build`
- **Root directory:** repository root (the build command `cd`s as needed) or `interactive-book` if configured per-package.

## Functions

`functions/api/score.ts` is auto-deployed as the `/api/score` route. It is a
**keyless** CORS pass-through: it forwards the visitor's own `Authorization`
header and request body to the provider URL in the `X-Target` header and stores
nothing.

## Secrets / environment

**None.** Do not add any API key, KV namespace, or environment variable. Access
is bring-your-own-key: each visitor enters their own OpenAI-compatible key in the
practice page, stored only in their browser's `localStorage`.

## Local preview of the Function

```bash
cd interactive-book && pnpm build && npx wrangler pages dev build
```
```

- [ ] **Step 3: Typecheck (the function is plain TS; confirm it compiles under the interactive-book tsconfig)**

Run: `cd interactive-book && pnpm typecheck`
Expected: no errors. (If the function dir is excluded from the app tsconfig, this is a no-op — that's fine; it has no app imports.)

- [ ] **Step 4: Commit**

```bash
git add interactive-book/functions/api/score.ts interactive-book/CLOUDFLARE.md
git commit -m "feat(interactive-book): keyless /api/score Cloudflare Pages Function + deploy notes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Author the practice assets (`/author-course` skill + `course-author` agent)

**Files:**
- Create: `.claude/skills/author-course/practice-assets-format.md`
- Modify: `.claude/skills/author-course/SKILL.md`
- Modify: `.claude/agents/course-author.md`

**Interfaces:**
- Consumes: the generator's expectations from Task 1/2 — files at `book-output/<slug>/rubric.md`, `prompts.md`, `feedback-spec.md`; the `prompts.md` heading/metadata format; the JSON grading contract from Task 5.
- Produces: documentation that makes `/author-course` write those three files for skill-type courses, grounded in official band descriptors.

This is a documentation/prompt task — there is no automated test. The deliverable is verified by reading it back and by Task 10 (running `/author-course` produces the three files in the correct format).

- [ ] **Step 1: Create `.claude/skills/author-course/practice-assets-format.md`**

```markdown
# Practice assets format (skill-type courses)

Skill-type courses emit three files into `book-output/<slug>/` that drive the
browser practice scorer. Author them AFTER the lesson notes, once the rubric
content is grounded.

## `rubric.md`

The grading criteria, **grounded in the official public band descriptors**. Before
writing, use `WebSearch` to retrieve the official IELTS Writing Task 1 and Task 2
band descriptors (public version) and cite them. Include, for each of the four
criteria — Task Response/Achievement (TR), Coherence & Cohesion (CC), Lexical
Resource (LR), Grammatical Range & Accuracy (GRA) — the descriptor wording for
bands 5, 6, 7 and 8. This file is sent verbatim to the model as part of the
system prompt; write it so a grader could quote a specific line per criterion.

## `feedback-spec.md`

The output contract. State explicitly:
- Grade all four criteria (TR, CC, LR, GRA), each a whole or half band 0–9.
- `overall` = mean of the four criterion bands, rounded to the nearest half band.
- For each criterion, return `band`, a `justification`, and a `descriptorQuote`
  (the exact band-descriptor line the essay was matched against — REQUIRED).
- Mark concrete `inlineErrors` (`quote`, `type` ∈ grammar|lexis|cohesion|task,
  `issue`, `fix`) and band-7 `rewrites` (`original`, `improved`, `why`).
- Emit `recurringErrorTags`: short kebab-case tags for systemic error patterns
  (e.g. `article-omission`, `subject-verb-agreement`).
- Return ONLY JSON in this exact shape:
  `{ overall, criteria: { TR|CC|LR|GRA: { band, justification, descriptorQuote } }, inlineErrors[], rewrites[], recurringErrorTags[] }`.

## `prompts.md`

A practice-prompt bank. One prompt per `###` heading (the heading is a stable,
kebab-case `id`). Under each heading, metadata lines then the prompt text:

    ### opinion-tech-replaces-teachers
    - task: 2
    - type: opinion
    Some people believe technology will replace teachers. To what extent do you agree or disagree?

    ### line-chart-energy-2000-2020
    - task: 1
    - type: line-chart
    - image: /practice-assets/<slug>/energy.png
    The line graph shows energy consumption by source between 2000 and 2020. Summarise the information.

Cover both Task 1 and Task 2 across the question/chart types taught in the course.
The optional `- image:` is a site-relative path under `interactive-book/static/`.
```

- [ ] **Step 2: Add the skill-artifacts step to `.claude/skills/author-course/SKILL.md`**

After the module-authoring step (Step 8, "Author modules sequentially") and before any final summary step, insert a new step:

```markdown
### 9. Author practice assets (skill-type courses only)

If `course-spec` `type` is `skill`, author the practice→feedback assets that drive
the browser scorer. Read `${CLAUDE_SKILL_DIR}/practice-assets-format.md`, then
dispatch one `course-author` agent with this delegation message:

```
Author the practice assets for a skill-type course.
Write three files:
  - book-output/<slug>/rubric.md
  - book-output/<slug>/feedback-spec.md
  - book-output/<slug>/prompts.md
Course: <metadata.title>
Ground rubric.md in the official public IELTS band descriptors via WebSearch and
cite them. Follow this format exactly:
<full contents of practice-assets-format.md>
```

Wait for completion. Verify all three files exist before finishing.
```

(Renumber any subsequent steps accordingly.)

- [ ] **Step 3: Add the capability to `.claude/agents/course-author.md`**

Add a section (after the existing lesson-note instructions) describing the alternate task:

```markdown
## Authoring practice assets (when asked)

When the delegation message asks you to author practice assets (not a lesson
note), write `rubric.md`, `feedback-spec.md`, and `prompts.md` to
`book-output/<slug>/` following the format given in the message. For `rubric.md`,
use `WebSearch` to ground the criteria in the official public band descriptors and
cite them — do not invent band wording. Do not write a lesson note in this mode.
```

- [ ] **Step 4: Verify the docs read correctly**

Run: `cat .claude/skills/author-course/practice-assets-format.md` and re-read the two edited files; confirm the `prompts.md` format here matches `parsePrompts` in `src/courses/practice.ts` (heading = id, `- task:`/`- type:`/`- image:` metadata, then text).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/author-course/practice-assets-format.md .claude/skills/author-course/SKILL.md .claude/agents/course-author.md
git commit -m "feat(author-course): author rubric/prompts/feedback-spec for skill courses

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: End-to-end integration — generate the IELTS practice assets and verify the build

**Files:**
- No new source. This task exercises the whole Phase 2 pipeline and is the render/integration gate.

**Interfaces:**
- Consumes: everything from Tasks 1–9.
- Produces: a verified `practice.mdx` + `practice.json` in the built site, rendering without errors.

This task has no unit test; it is a guided manual integration check. The IELTS course content itself (Phase 3) is out of scope — here we only verify the **mechanism** with whatever skill-course content exists (or a minimal fixture course if the IELTS lesson notes are not yet authored).

- [ ] **Step 1: Run the full root test suite (no regressions across the branch)**

Run: `pnpm test`
Expected: all PASS (Tasks 1 & 2 suites included).

- [ ] **Step 2: Run the interactive-book lib suite**

Run: `cd interactive-book && pnpm test`
Expected: srs / practiceStore / score suites PASS.

- [ ] **Step 3: Ensure a skill-course exists with the three assets**

If the IELTS course (`book-output/ielts-writing-7/`) has been authored via `/author-course` with `type: skill`, confirm `rubric.md`, `prompts.md`, `feedback-spec.md` are present. Otherwise, create a minimal skill course for the mechanism check: a `metadata.json` with `courseType: 'skill'` plus the three asset files (as in the Task 2 test fixture), under a temporary slug.

- [ ] **Step 4: Generate the interactive book**

Run: `pnpm exec tsx src/cli.ts interactive <slug>`
Expected: output reports a written `practice.mdx`; `interactive-book/docs/<slug>/practice.json` and `practice.mdx` exist.

- [ ] **Step 5: Build the site (the render gate)**

Run: `cd interactive-book && pnpm build`
Expected: build succeeds. The practice page compiles — `<PracticeScorer>`, `<BandTrajectory>`, `<ReviewDrills>` resolve from `MDXComponents.tsx` and no SSR error occurs (the `typeof window` guards prevent `localStorage` access during prerender).

- [ ] **Step 6: Manual smoke (optional, needs a real key)**

Run: `cd interactive-book && pnpm serve` (or `pnpm start`), open the practice page, enter a real OpenAI-compatible key + model, paste a short essay, and submit. Confirm: a band + per-criterion cards render, an attempt appears in the trajectory after refresh, and a review card appears under drills. (This spends real tokens on the tester's own key — skip if not desired.)

- [ ] **Step 7: Commit any fixup**

If Steps 1–5 surfaced a fix, commit it:

```bash
git add -A
git commit -m "fix(phase-2): integration fixes from end-to-end build

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage** — every Phase 2 spec element maps to a task:
- `course-author` authors rubric/prompts/feedback-spec (WebSearch-grounded) → Task 9.
- `interactive` emits `practice.json` + `practice.mdx` → Tasks 1–2.
- Browser `scoreEssay` + `parseScoreResponse` gate + error taxonomy + one-retry CORS fallback → Task 5.
- `practiceStore` (per-slug localStorage, attempts + deck, dedup seed, export/reset, no essay text) → Task 4.
- `srs` ported pure SM-2 → Task 3.
- `<PracticeScorer>` / `<BandTrajectory>` / `<ReviewDrills>`, Flashcards untouched → Tasks 6–7.
- Keyless `functions/api/score.ts` + Cloudflare deploy notes, no secrets → Task 8.
- Validated 4-criterion JSON contract, `descriptorQuote` required, half-band rounding → Tasks 1/5/9 (schema + validation + spec text).
- Testing: pure modules fully tested, scoreEssay injected-fetch, generator fixture, build render gate, provider always mocked → Tasks 1–5 (vitest) + Task 10 (build).

**2. Placeholder scan** — no "TBD"/"add error handling"/"similar to Task N"; every code step shows complete code; every command shows expected output.

**3. Type consistency** — `ScoreResult`, `Criterion`, `Config`, `Attempt`, `ReviewCard`, `PracticeBundle`, `PracticePrompt` are defined once in `practiceTypes.ts` (Task 3) and the generator's `PracticeBundle`/`PracticePrompt` in `practice.ts` (Task 1) are structurally identical (verified field-by-field). `scoreEssay`'s fallback sets `X-Target` (Task 5) and the Function reads `X-Target` (Task 8) — names match. `seedCard`/`applyResult`/`dueCards` names are consistent between `srs.ts` (Task 3) and its consumers (Tasks 4, 7). `summarizeAttempt`/`seedCardsFromResult`/`appendAttempt`/`saveDeck`/`loadDeck` names match between `practiceStore.ts` (Task 4) and `PracticeScorer` (Task 6).

**Open implementation notes (not blockers):**
- The browser `ReviewCard` intentionally omits the Node `ReviewItem`'s `chapter` field; `srs.ts` is an *adaptation*, not a verbatim copy. Documented in Task 3.
- `interactive-book` intra-`src` imports are extensionless (bundler resolution); root `src/` imports keep `.js` (NodeNext). Documented in Task 3.
- Review-card content is intentionally simple (one card per recurring-error tag with the first available fix as guidance); richer drill content is a later refinement.
