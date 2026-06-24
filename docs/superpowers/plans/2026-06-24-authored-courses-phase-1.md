# Authored Courses — Phase 1 (Authoring Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let study-mate author a course from a topic (no source book), producing `course-spec.md`, `concepts.csv` (a validated dependency DAG), `outline.md`, `metadata.json`, and `lessons/*.md` that flow into the existing `interactive` (Docusaurus) + `/tutor` pipeline unchanged.

**Architecture:** A new `/author-course` skill orchestrates a new `course-author` agent to write lesson notes from knowledge + optional `WebSearch`, reusing the existing lesson-note template (extended with optional skill blocks). New deterministic CLI commands (`validate-concepts`, `author-scaffold`) parse and validate the concept DAG and build `metadata.json` from the outline, so everything downstream (`lint-lessons`, `interactive`, `/tutor`) works without modification.

**Tech Stack:** TypeScript (strict, ES modules, NodeNext `.js` imports), commander CLI, fs-extra, vitest. Skills/agents are markdown under `.claude/`.

## Global Constraints

- TypeScript strict mode; ES modules; imports use `.js` extension (NodeNext). Copied verbatim from `CLAUDE.md`.
- No `any` — use explicit types or `unknown`. Copied verbatim from `CLAUDE.md`.
- All AI runs inside the Claude Code session; no Anthropic API key / external paid services. `WebSearch` grounding during authoring is allowed and optional. (Spec Non-goals.)
- Concept count scaled to the domain (~50 for IELTS, **not** the reference repo's 250). (Spec "Open questions / risks".)
- Skill-type vs knowledge-type is an **explicit flag** on the course spec, never heuristic. (Spec "Open questions / risks".)
- Lesson-note template changes must be **additive / backward-compatible**: existing parsed books and `lint-lessons` keep working; new blocks are optional and ignored when absent. (Spec Non-goals + risks.)
- `concepts.csv` columns are exactly `ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom`. `Dependencies` is pipe-delimited concept IDs; empty = foundation concept. Bloom ∈ {Remember, Understand, Apply, Analyze, Evaluate, Create}. ConceptLabel must not contain a comma.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `src/courses/types.ts` | Types: `ConceptRecord`, `OutlineModule`, `CourseSpecFrontmatter`, `CourseValidationFinding`. | T1 |
| `src/courses/concepts.ts` | `parseConceptsCsv()` + `validateConceptDag()`. | T1, T2 |
| `src/courses/outline.ts` | `parseOutline()`, `parseCourseSpecFrontmatter()`, `buildAuthoredMetadata()`. | T4 |
| `src/parser/types.ts` | Add optional `sourceType` + `courseType` to `BookMetadata` (additive). | T4 |
| `src/interactive/parse.ts` | Accept `type: authored` in lesson frontmatter. | T6 |
| `src/cli.ts` | Wire `validate-concepts <slug>` and `author-scaffold <slug>` commands. | T3, T5 |
| `.claude/skills/tutor-prep/lesson-note-template.md` | Add optional `#### Model answers` / `#### Practice` skill blocks. | T7 |
| `.claude/agents/course-author.md` | New authoring agent. | T8 |
| `.claude/skills/author-course/SKILL.md` (+ `course-spec-template.md`, `concepts-format.md`) | New orchestration skill. | T9 |
| `tests/courses/*.test.ts`, `tests/fixtures/authored/*` | Tests + a tiny authored-course fixture. | T1–T7 |

---

## Task 1: Parse `concepts.csv` into typed records

**Files:**
- Create: `src/courses/types.ts`
- Create: `src/courses/concepts.ts`
- Test: `tests/courses/concepts-parse.test.ts`

**Interfaces:**
- Produces: `parseConceptsCsv(text: string): ConceptRecord[]` and the types below.

```ts
// src/courses/types.ts
export const BLOOM_LEVELS = [
  'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create',
] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export interface ConceptRecord {
  id: number;
  label: string;
  dependencies: number[];
  taxonomyId: number;
  bloom: string; // validated against BLOOM_LEVELS in validateConceptDag
}

export interface OutlineModule {
  /** Zero-padded module number string, e.g. "01". */
  module: string;
  title: string;
  conceptIds: number[];
}

export interface CourseSpecFrontmatter {
  slug: string;
  title: string;
  author: string;
  language: string;
  type: 'skill' | 'knowledge';
}

export interface CourseValidationFinding {
  level: 'error' | 'warning';
  message: string;
}
```

- [ ] **Step 1: Write the failing test**

```ts
// tests/courses/concepts-parse.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/courses/concepts-parse.test.ts`
Expected: FAIL — `parseConceptsCsv` not exported / module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/courses/concepts.ts
import type { ConceptRecord } from './types.js';

const EXPECTED_HEADER = 'ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom';

export function parseConceptsCsv(text: string): ConceptRecord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) throw new Error('concepts.csv is empty');
  if (lines[0].trim() !== EXPECTED_HEADER) {
    throw new Error(`concepts.csv header must be exactly: ${EXPECTED_HEADER}`);
  }
  const records: ConceptRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length !== 5) {
      throw new Error(`concepts.csv row ${i + 1} must have 5 columns (ConceptLabel may not contain a comma)`);
    }
    const [idStr, label, depStr, taxStr, bloom] = cols.map((c) => c.trim());
    const dependencies = depStr === ''
      ? []
      : depStr.split('|').map((d) => Number(d.trim()));
    records.push({
      id: Number(idStr),
      label,
      dependencies,
      taxonomyId: Number(taxStr),
      bloom,
    });
  }
  return records;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/courses/concepts-parse.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add src/courses/types.ts src/courses/concepts.ts tests/courses/concepts-parse.test.ts
git commit -m "feat(courses): parse concepts.csv into typed concept records"
```

---

## Task 2: Validate the concept dependency DAG

**Files:**
- Modify: `src/courses/concepts.ts`
- Test: `tests/courses/concepts-validate.test.ts`

**Interfaces:**
- Consumes: `ConceptRecord[]`, `CourseValidationFinding`, `BLOOM_LEVELS`.
- Produces: `validateConceptDag(records: ConceptRecord[]): CourseValidationFinding[]` — empty array means valid. Returns `level: 'error'` findings for: duplicate ID, dependency on unknown ID, self-dependency, a cycle, an invalid Bloom level, a non-positive `taxonomyId`, and a fully disconnected concept (no dependencies and no dependents) when there is more than one concept.

- [ ] **Step 1: Write the failing test**

```ts
// tests/courses/concepts-validate.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/courses/concepts-validate.test.ts`
Expected: FAIL — `validateConceptDag` not exported.

- [ ] **Step 3: Write minimal implementation (append to `src/courses/concepts.ts`)**

```ts
import { BLOOM_LEVELS } from './types.js';
import type { CourseValidationFinding } from './types.js';

export function validateConceptDag(records: ConceptRecord[]): CourseValidationFinding[] {
  const findings: CourseValidationFinding[] = [];
  const err = (message: string) => findings.push({ level: 'error', message });

  // Duplicate IDs.
  const seen = new Set<number>();
  for (const r of records) {
    if (seen.has(r.id)) err(`duplicate ConceptID ${r.id}`);
    seen.add(r.id);
  }
  const ids = new Set(records.map((r) => r.id));

  // Field validity + dependency targets.
  for (const r of records) {
    if (!Number.isInteger(r.id) || r.id <= 0) err(`ConceptID must be a positive integer (got "${r.id}")`);
    if (!Number.isInteger(r.taxonomyId) || r.taxonomyId <= 0) {
      err(`concept ${r.id} has a non-positive TaxonomyID`);
    }
    if (!(BLOOM_LEVELS as readonly string[]).includes(r.bloom)) {
      err(`concept ${r.id} has an invalid Bloom level "${r.bloom}"`);
    }
    for (const d of r.dependencies) {
      if (d === r.id) err(`concept ${r.id} depends on itself`);
      else if (!ids.has(d)) err(`concept ${r.id} depends on unknown ConceptID ${d}`);
    }
  }

  // Connectivity: a concept with no deps and no dependents is disconnected.
  if (records.length > 1) {
    const hasDependents = new Set<number>();
    for (const r of records) for (const d of r.dependencies) hasDependents.add(d);
    for (const r of records) {
      if (r.dependencies.length === 0 && !hasDependents.has(r.id)) {
        err(`concept ${r.id} ("${r.label}") is disconnected (no dependencies and nothing depends on it)`);
      }
    }
  }

  // Cycle detection (DFS over dependency edges).
  const byId = new Map(records.map((r) => [r.id, r]));
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<number, number>(records.map((r) => [r.id, WHITE]));
  let cycle = false;
  const visit = (id: number): void => {
    color.set(id, GRAY);
    for (const d of byId.get(id)?.dependencies ?? []) {
      if (!byId.has(d)) continue;
      const c = color.get(d);
      if (c === GRAY) cycle = true;
      else if (c === WHITE) visit(d);
    }
    color.set(id, BLACK);
  };
  for (const r of records) if (color.get(r.id) === WHITE) visit(r.id);
  if (cycle) err('concepts.csv contains a dependency cycle (must be a DAG)');

  return findings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/courses/concepts-validate.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add src/courses/concepts.ts tests/courses/concepts-validate.test.ts
git commit -m "feat(courses): validate concept dependency graph is a connected DAG"
```

---

## Task 3: `validate-concepts <slug>` CLI command

**Files:**
- Modify: `src/cli.ts` (add command near the other `program.command(...)` blocks)
- Test: `tests/courses/validate-concepts-cli.test.ts`
- Create: `tests/fixtures/authored/good-concepts.csv`, `tests/fixtures/authored/bad-concepts.csv`

**Interfaces:**
- Consumes: `parseConceptsCsv`, `validateConceptDag`.
- Produces: a CLI command that reads `book-output/<slug>/concepts.csv`, prints findings, and exits `1` if any `error` finding exists, else `0`. Factor the core into an exported `runValidateConcepts(slug: string): Promise<{ findings: CourseValidationFinding[] }>` in `src/courses/concepts.ts` so it is testable without spawning a process.

- [ ] **Step 1: Write the failing test**

```ts
// tests/courses/validate-concepts-cli.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import { runValidateConcepts } from '../../src/courses/concepts.js';

const SLUG = '__test-validate-concepts__';
const dir = path.join('book-output', SLUG);

beforeAll(async () => {
  await fs.ensureDir(dir);
});
afterAll(async () => {
  await fs.remove(dir);
});

describe('runValidateConcepts', () => {
  it('returns no error findings for a valid concepts.csv', async () => {
    await fs.copy('tests/fixtures/authored/good-concepts.csv', path.join(dir, 'concepts.csv'));
    const { findings } = await runValidateConcepts(SLUG);
    expect(findings.filter((f) => f.level === 'error')).toEqual([]);
  });

  it('returns error findings for an invalid concepts.csv', async () => {
    await fs.copy('tests/fixtures/authored/bad-concepts.csv', path.join(dir, 'concepts.csv'));
    const { findings } = await runValidateConcepts(SLUG);
    expect(findings.some((f) => f.level === 'error')).toBe(true);
  });
});
```

- [ ] **Step 2: Create the fixtures**

`tests/fixtures/authored/good-concepts.csv`:
```
ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom
1,Band Descriptors,,1,Understand
2,Complex Sentence Structures,1,2,Apply
3,Task 2 Introduction,1|2,5,Create
```

`tests/fixtures/authored/bad-concepts.csv` (contains a cycle):
```
ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom
1,A,2,1,Apply
2,B,1,1,Apply
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run tests/courses/validate-concepts-cli.test.ts`
Expected: FAIL — `runValidateConcepts` not exported.

- [ ] **Step 4: Implement `runValidateConcepts` (append to `src/courses/concepts.ts`)**

```ts
import fs from 'fs-extra';
import path from 'node:path';

export async function runValidateConcepts(
  slug: string,
): Promise<{ findings: CourseValidationFinding[] }> {
  const csvPath = path.join('book-output', slug, 'concepts.csv');
  if (!(await fs.pathExists(csvPath))) {
    return { findings: [{ level: 'error', message: `not found: ${csvPath}` }] };
  }
  const text = await fs.readFile(csvPath, 'utf-8');
  let records: ConceptRecord[];
  try {
    records = parseConceptsCsv(text);
  } catch (e) {
    return { findings: [{ level: 'error', message: e instanceof Error ? e.message : String(e) }] };
  }
  return { findings: validateConceptDag(records) };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run tests/courses/validate-concepts-cli.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Wire the CLI command in `src/cli.ts`**

Add this import near the other imports at the top:
```ts
import { runValidateConcepts } from './courses/concepts.js';
```

Add this command block alongside the others (e.g. after the `lint-lessons` command):
```ts
program
  .command('validate-concepts <slug>')
  .description('Validate book-output/<slug>/concepts.csv is a connected dependency DAG')
  .action(async (slug: string) => {
    const { findings } = await runValidateConcepts(slug);
    const errors = findings.filter((f) => f.level === 'error');
    for (const f of findings) {
      console.log(`${f.level === 'error' ? '✗' : '⚠'} ${f.message}`);
    }
    if (errors.length === 0) {
      console.log('✓ concepts.csv is a valid DAG');
    } else {
      process.exit(1);
    }
  });
```

- [ ] **Step 7: Verify the CLI runs end-to-end**

Run:
```bash
mkdir -p book-output/__cli_smoke__ && cp tests/fixtures/authored/good-concepts.csv book-output/__cli_smoke__/concepts.csv
pnpm exec tsx src/cli.ts validate-concepts __cli_smoke__; echo "exit=$?"
rm -rf book-output/__cli_smoke__
```
Expected: prints `✓ concepts.csv is a valid DAG` and `exit=0`.

- [ ] **Step 8: Typecheck and commit**

```bash
pnpm typecheck
git add src/cli.ts src/courses/concepts.ts tests/courses/validate-concepts-cli.test.ts tests/fixtures/authored/
git commit -m "feat(cli): add validate-concepts command"
```

---

## Task 4: Outline parser, course-spec frontmatter, and authored metadata builder

**Files:**
- Create: `src/courses/outline.ts`
- Modify: `src/parser/types.ts` (add two optional fields to `BookMetadata`)
- Test: `tests/courses/outline.test.ts`

**Interfaces:**
- Consumes: `OutlineModule`, `CourseSpecFrontmatter`, `BookMetadata`/`ChapterIndex` from `../parser/types.js`.
- Produces:
  - `parseOutline(text: string): OutlineModule[]` — reads lines of the exact form `- module: NN | title: <title> | concepts: 1,2,3` (ignores all other lines).
  - `parseCourseSpecFrontmatter(text: string): CourseSpecFrontmatter` — reads the leading `---` fenced block with `slug:`, `title:`, `author:`, `language:`, `type:` lines.
  - `buildAuthoredMetadata(spec: CourseSpecFrontmatter, modules: OutlineModule[]): BookMetadata` — one chapter per module; `file` = `module-NN.md`; lesson note is therefore `module-NN-lesson.md`; `chapterNumber` = `Number(NN)`; `wordCount` = 0.

First add the optional fields to `BookMetadata` in `src/parser/types.ts`:
```ts
export interface BookMetadata {
  slug: string;
  title: string;
  author: string;
  language: string;
  sourceFile: string;
  parsedAt: string;
  chapterCount: number;
  chapters: ChapterIndex[];
  /** Present for courses authored from a topic (no parsed source book). */
  sourceType?: 'authored';
  /** Skill-type courses additionally get the practice→feedback loop (Phase 2). */
  courseType?: 'skill' | 'knowledge';
}
```

- [ ] **Step 1: Write the failing test**

```ts
// tests/courses/outline.test.ts
import { describe, it, expect } from 'vitest';
import { parseOutline, parseCourseSpecFrontmatter, buildAuthoredMetadata } from '../../src/courses/outline.js';

const OUTLINE = `# Outline

Some prose the parser ignores.

- module: 01 | title: Test Format & Band Descriptors | concepts: 1,2
- module: 02 | title: Complex Sentence Structures | concepts: 3
`;

const SPEC = `---
slug: ielts-academic-writing-7
title: IELTS Academic Writing 7.0
author: Study Mate
language: en
type: skill
---

# Course Spec
narrative...`;

describe('parseOutline', () => {
  it('parses only the machine-readable module lines', () => {
    const mods = parseOutline(OUTLINE);
    expect(mods).toHaveLength(2);
    expect(mods[0]).toEqual({ module: '01', title: 'Test Format & Band Descriptors', conceptIds: [1, 2] });
    expect(mods[1].conceptIds).toEqual([3]);
  });
});

describe('parseCourseSpecFrontmatter', () => {
  it('reads the frontmatter fields', () => {
    expect(parseCourseSpecFrontmatter(SPEC)).toEqual({
      slug: 'ielts-academic-writing-7',
      title: 'IELTS Academic Writing 7.0',
      author: 'Study Mate',
      language: 'en',
      type: 'skill',
    });
  });
});

describe('buildAuthoredMetadata', () => {
  it('builds one chapter per module with authored source', () => {
    const spec = parseCourseSpecFrontmatter(SPEC);
    const meta = buildAuthoredMetadata(spec, parseOutline(OUTLINE));
    expect(meta.sourceType).toBe('authored');
    expect(meta.courseType).toBe('skill');
    expect(meta.chapterCount).toBe(2);
    expect(meta.chapters[0]).toMatchObject({ chapterNumber: 1, chapterTitle: 'Test Format & Band Descriptors', file: 'module-01.md', wordCount: 0 });
    expect(meta.chapters[1].file).toBe('module-02.md');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/courses/outline.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/courses/outline.ts
import type { OutlineModule, CourseSpecFrontmatter } from './types.js';
import type { BookMetadata, ChapterIndex } from '../parser/types.js';

const MODULE_LINE = /^-\s*module:\s*(\S+)\s*\|\s*title:\s*(.+?)\s*\|\s*concepts:\s*(.*)$/;

export function parseOutline(text: string): OutlineModule[] {
  const modules: OutlineModule[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(MODULE_LINE);
    if (!m) continue;
    const conceptIds = m[3].trim() === ''
      ? []
      : m[3].split(',').map((c) => Number(c.trim()));
    modules.push({ module: m[1].trim(), title: m[2].trim(), conceptIds });
  }
  return modules;
}

function frontmatterField(block: string, key: string): string {
  const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!m) throw new Error(`course-spec frontmatter missing "${key}:"`);
  return m[1].trim();
}

export function parseCourseSpecFrontmatter(text: string): CourseSpecFrontmatter {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error('course-spec.md must start with a --- frontmatter block');
  const block = m[1];
  const type = frontmatterField(block, 'type');
  if (type !== 'skill' && type !== 'knowledge') {
    throw new Error(`course-spec "type" must be "skill" or "knowledge" (got "${type}")`);
  }
  return {
    slug: frontmatterField(block, 'slug'),
    title: frontmatterField(block, 'title'),
    author: frontmatterField(block, 'author'),
    language: frontmatterField(block, 'language'),
    type,
  };
}

export function buildAuthoredMetadata(
  spec: CourseSpecFrontmatter,
  modules: OutlineModule[],
): BookMetadata {
  const chapters: ChapterIndex[] = modules.map((mod) => ({
    chapterNumber: Number(mod.module),
    chapterTitle: mod.title,
    wordCount: 0,
    file: `module-${mod.module}.md`,
  }));
  return {
    slug: spec.slug,
    title: spec.title,
    author: spec.author,
    language: spec.language,
    sourceFile: '',
    parsedAt: new Date().toISOString(),
    chapterCount: chapters.length,
    chapters,
    sourceType: 'authored',
    courseType: spec.type,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/courses/outline.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add src/courses/outline.ts src/courses/types.ts src/parser/types.ts tests/courses/outline.test.ts
git commit -m "feat(courses): parse outline + course-spec frontmatter, build authored metadata"
```

---

## Task 5: `author-scaffold <slug>` CLI command

**Files:**
- Modify: `src/cli.ts`
- Create: `src/courses/scaffold.ts`
- Test: `tests/courses/scaffold.test.ts`

**Interfaces:**
- Consumes: `parseCourseSpecFrontmatter`, `parseOutline`, `buildAuthoredMetadata`.
- Produces: `runAuthorScaffold(slug: string): Promise<BookMetadata>` — reads `book-output/<slug>/course-spec.md` and `outline.md`, writes `book-output/<slug>/metadata.json`, and returns the metadata. Throws if either input file is missing.

- [ ] **Step 1: Write the failing test**

```ts
// tests/courses/scaffold.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import { runAuthorScaffold } from '../../src/courses/scaffold.js';

const SLUG = '__test-scaffold__';
const dir = path.join('book-output', SLUG);

beforeAll(async () => {
  await fs.ensureDir(dir);
  await fs.writeFile(path.join(dir, 'course-spec.md'), `---
slug: ${SLUG}
title: Tiny Test Course
author: Study Mate
language: en
type: skill
---
# spec`);
  await fs.writeFile(path.join(dir, 'outline.md'), `# Outline
- module: 01 | title: First Module | concepts: 1
- module: 02 | title: Second Module | concepts: 2,3
`);
});
afterAll(async () => {
  await fs.remove(dir);
});

describe('runAuthorScaffold', () => {
  it('writes metadata.json with one chapter per module', async () => {
    const meta = await runAuthorScaffold(SLUG);
    expect(meta.chapterCount).toBe(2);
    expect(meta.sourceType).toBe('authored');
    const onDisk = await fs.readJson(path.join(dir, 'metadata.json'));
    expect(onDisk.chapters[1].file).toBe('module-02.md');
  });

  it('throws when course-spec.md is missing', async () => {
    await expect(runAuthorScaffold('__nope__')).rejects.toThrow(/course-spec/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/courses/scaffold.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/courses/scaffold.ts
import fs from 'fs-extra';
import path from 'node:path';
import type { BookMetadata } from '../parser/types.js';
import { parseCourseSpecFrontmatter, parseOutline, buildAuthoredMetadata } from './outline.js';

export async function runAuthorScaffold(slug: string): Promise<BookMetadata> {
  const dir = path.join('book-output', slug);
  const specPath = path.join(dir, 'course-spec.md');
  const outlinePath = path.join(dir, 'outline.md');
  if (!(await fs.pathExists(specPath))) throw new Error(`course-spec not found: ${specPath}`);
  if (!(await fs.pathExists(outlinePath))) throw new Error(`outline not found: ${outlinePath}`);

  const spec = parseCourseSpecFrontmatter(await fs.readFile(specPath, 'utf-8'));
  const modules = parseOutline(await fs.readFile(outlinePath, 'utf-8'));
  if (modules.length === 0) throw new Error(`no module lines found in ${outlinePath}`);

  const meta = buildAuthoredMetadata(spec, modules);
  await fs.writeJSON(path.join(dir, 'metadata.json'), meta, { spaces: 2 });
  return meta;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/courses/scaffold.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire the CLI command in `src/cli.ts`**

Add import:
```ts
import { runAuthorScaffold } from './courses/scaffold.js';
```

Add command block:
```ts
program
  .command('author-scaffold <slug>')
  .description('Build metadata.json from book-output/<slug>/course-spec.md + outline.md')
  .action(async (slug: string) => {
    try {
      const meta = await runAuthorScaffold(slug);
      console.log(`✓ wrote metadata.json (${meta.chapterCount} modules) for "${meta.title}"`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });
```

- [ ] **Step 6: Typecheck and commit**

```bash
pnpm typecheck
git add src/cli.ts src/courses/scaffold.ts tests/courses/scaffold.test.ts
git commit -m "feat(cli): add author-scaffold command (outline + spec -> metadata.json)"
```

---

## Task 6: Support `type: authored` in lesson frontmatter

**Files:**
- Modify: `src/interactive/parse.ts:36-54` (the frontmatter parser + `sourceType` union)
- Modify: `src/interactive/generate.ts:190` (render label for authored)
- Test: `tests/interactive/authored-source.test.ts`

**Interfaces:**
- Produces: `parseLesson(...)` returns `sourceType: 'pdf' | 'epub' | 'authored'`. For an authored note the displayed source label is `authored` (not `PDF pages`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/interactive/authored-source.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/interactive/authored-source.test.ts`
Expected: FAIL — `sourceType` is `'pdf'` (the default) and the union does not include `'authored'`.

- [ ] **Step 3: Update `src/interactive/parse.ts`**

In the `ParsedFrontmatter` type (line ~36) widen the union:
```ts
  sourceType: 'pdf' | 'epub' | 'authored';
```

In `parseFrontmatter` (lines ~42-52) add the authored branch after the epub check:
```ts
    if (/type:\s*epub/.test(src)) sourceType = 'epub';
    else if (/type:\s*authored/.test(src)) sourceType = 'authored';
```

- [ ] **Step 4: Update `src/interactive/generate.ts:190`**

Replace the source-label line:
```ts
  const sourceLabel =
    lesson.sourceType === 'pdf'
      ? `PDF pages ${lesson.sourceRef}`
      : lesson.sourceType === 'authored'
        ? 'authored'
        : `source ${lesson.sourceRef}`;
```
(If the surrounding expression differs, preserve its shape — the only change is adding the `'authored'` case.)

- [ ] **Step 5: Run test + full interactive suite to verify nothing regressed**

Run: `pnpm exec vitest run tests/interactive/authored-source.test.ts tests/interactive`
Expected: PASS (new test + existing interactive tests).

- [ ] **Step 6: Typecheck and commit**

```bash
pnpm typecheck
git add src/interactive/parse.ts src/interactive/generate.ts tests/interactive/authored-source.test.ts
git commit -m "feat(interactive): support authored lesson source type"
```

---

## Task 7: Extend the lesson-note template with optional skill blocks

**Files:**
- Modify: `.claude/skills/tutor-prep/lesson-note-template.md`
- Test: `tests/interactive/skill-blocks-tolerated.test.ts`

**Interfaces:**
- Produces: documentation of two optional, additive blocks a concept may carry — `#### Model answers` and `#### Practice`. They appear after `#### Dig deeper`. The existing parser must still extract the concept and `lint-lessons` must still pass (the blocks are extra prose; they do not replace `#### Dig deeper`).

- [ ] **Step 1: Write the failing test (guards backward-compatibility)**

```ts
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
```

Note: confirm the `ClarityFinding` shape in `src/lessons/clarity.ts` uses a `level` field; if it uses a different key (e.g. `severity`), adjust the `.filter(...)` accordingly before running.

- [ ] **Step 2: Run test to verify it passes or reveals a real parser gap**

Run: `pnpm exec vitest run tests/interactive/skill-blocks-tolerated.test.ts`
Expected: PASS. If it FAILS because `parseLesson` mis-handles `####` blocks after `#### Dig deeper`, fix `src/interactive/parse.ts` so a concept's body terminates at the next `### Cn` heading (not at an arbitrary `####`), then re-run. Commit that parser fix as part of this task.

- [ ] **Step 3: Document the optional blocks in the template**

In `.claude/skills/tutor-prep/lesson-note-template.md`, immediately after the `#### Dig deeper` description paragraph, add:

```markdown
#### Model answers (OPTIONAL — skill-type courses only)
Two or more short answers at adjacent band/quality levels so the learner sees the upgrade concretely. For IELTS use `**Band 6:**` and `**Band 7:**` lines. OMIT this block entirely for knowledge-type courses. It never replaces `#### Dig deeper`.

#### Practice (OPTIONAL — skill-type courses only)
A single practice prompt the learner completes in the live practice loop, plus an `**Assessed:**` line naming what the feedback will judge. OMIT for knowledge-type courses.
```

- [ ] **Step 4: Re-run the clarity suite to confirm no regression**

Run: `pnpm exec vitest run tests/lessons tests/interactive`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/tutor-prep/lesson-note-template.md tests/interactive/skill-blocks-tolerated.test.ts src/interactive/parse.ts
git commit -m "feat(courses): optional Model answers + Practice blocks in lesson notes"
```

---

## Task 8: The `course-author` agent

**Files:**
- Create: `.claude/agents/course-author.md`

**Interfaces:**
- Consumes (per delegation message): `Write to:` path, `Module title:`, `Course:` title, `Course type:` (`skill`/`knowledge`), `Concepts:` (the concept labels + Bloom levels for this module, copied from `concepts.csv`), and the full lesson-note template.
- Produces: one lesson note at the given path, conforming to the template; responds with one line `✓ <filename> done (word count: NNNN)`.

- [ ] **Step 1: Write the agent file**

Create `.claude/agents/course-author.md` with this exact content:

````markdown
---
name: course-author
description: Authors one module's tutor lesson note for a course generated from a topic (no source book). Delegate here per module for authored-course content generation.
tools: Read, Write, Bash, WebSearch
model: sonnet
effort: high
color: green
---

You are an expert curriculum author and subject-matter teacher. Your sole purpose is to author ONE module's lesson note for a course that is being written from a topic — there is no source book to distil. You write from your own expertise, grounded by `WebSearch` for any fact that must be current or precise (standards, official rubrics, dated figures).

## What you receive

Each delegation message contains:
- **Write to:** absolute path where you must write the lesson note.
- **Course:** the course title.
- **Course type:** `skill` or `knowledge`.
- **Module title:** the title of this module (becomes the lesson's `title`).
- **Module number:** the integer chapter number for the frontmatter.
- **Concepts:** the concept labels assigned to this module, each with its Bloom level (copied from `concepts.csv`). Teach exactly these, in this order.
- **Template:** the exact lesson-note structure to follow.

## How to proceed

1. If a concept needs current/precise facts (e.g. an official rubric, a standard, a statistic), use `WebSearch` to ground it. Never invent specifics you are unsure of — look them up or omit them.
2. Ensure the output directory exists: `mkdir -p <parent-directory-of-output-path>`.
3. Write the lesson note STRICTLY following the template:
   - Frontmatter: `chapter: <Module number>`, `title: "<Module title>"`, `source: { type: authored }`.
   - One `### Cn — <concept label>` per assigned concept, in the given order, each with Explanation / Why it matters / Check / Misconception, and a REQUIRED `#### Dig deeper` (intuition + worked example).
   - Tag each concept's Bloom level on its `### Cn` line as a trailing `(Bloom: <level>)`.
   - **If Course type is `skill`:** add the optional `#### Model answers` (banded, e.g. `**Band 6:**` / `**Band 7:**`) and `#### Practice` (a prompt + `**Assessed:**` line) blocks to every concept that is a producible technique. Omit them for purely conceptual entries.
   - **If Course type is `knowledge`:** do NOT add Model answers / Practice blocks.
   - Author `## Visualizations` figures for any concept whose idea is a small graph/structure (per the template), and `## Review items` Q/A pairs for the spaced-repetition deck.
   - Obey the template's clarity rules: every Explanation carries a concrete anchor; no banned filler; plain-text math.
4. Write the file with the Write tool.
5. Respond with ONLY this one line: `✓ <output-filename> done (word count: NNNN)`.

You never write page citations or `## Figures` extraction tags — there is no source PDF for an authored course.
````

- [ ] **Step 2: Verify the agent file is well-formed**

Run:
```bash
head -10 .claude/agents/course-author.md
```
Expected: shows YAML frontmatter with `name: course-author`, `tools: Read, Write, Bash, WebSearch`.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/course-author.md
git commit -m "feat(courses): add course-author agent for authored-course lesson notes"
```

---

## Task 9: The `/author-course` skill (orchestration) + end-to-end verification

**Files:**
- Create: `.claude/skills/author-course/SKILL.md`
- Create: `.claude/skills/author-course/course-spec-template.md`
- Create: `.claude/skills/author-course/concepts-format.md`

**Interfaces:**
- Consumes: the CLI commands `author-scaffold`, `validate-concepts`, `lint-lessons`, `interactive`; the `course-author` agent; the lesson-note template at `.claude/skills/tutor-prep/lesson-note-template.md`.
- Produces: a resumable skill that, given a topic + constraints, writes `course-spec.md`, `concepts.csv`, `outline.md`, then per-module lesson notes, then `metadata.json` via `author-scaffold`, leaving the course ready for `/visualize` → `interactive` → `/tutor`.

- [ ] **Step 1: Write `course-spec-template.md`**

Create `.claude/skills/author-course/course-spec-template.md`:
````markdown
---
slug: <kebab-case-slug>
title: <Course Title>
author: Study Mate
language: en
type: <skill|knowledge>
---

# <Course Title>

**Target audience:** <who, and their starting level>
**Prerequisites:** <prior knowledge, or "none">
**Duration:** <e.g. 10 weeks, 2×1h/week, 20 sessions>
**Assessment:** <how progress is judged — for skill courses, the rubric/criteria>

## Course description
<narrative: what it covers, method, key outcomes>

## Learning objectives
A numbered list. Tag each with its Bloom level, e.g.:
1. <objective> (Bloom: Understand)
2. <objective> (Bloom: Apply)
````

- [ ] **Step 2: Write `concepts-format.md`**

Create `.claude/skills/author-course/concepts-format.md`:
````markdown
# concepts.csv format

A connected dependency DAG. Header row EXACTLY:

`ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom`

- **ConceptID** — positive integer, unique.
- **ConceptLabel** — short title-case label, NO commas.
- **Dependencies** — pipe-delimited ConceptIDs that must be learned first; empty for foundation concepts.
- **TaxonomyID** — the concept's category (1..N from the course taxonomy).
- **Bloom** — one of: Remember, Understand, Apply, Analyze, Evaluate, Create.

Scale to the domain: aim for the natural number of real concepts (≈50 for a focused skill course), NOT a fixed 250.

# outline.md format

Group concepts into modules (= sessions). Each module is ONE line of this exact form (other prose is ignored):

`- module: NN | title: <Module Title> | concepts: <comma-separated ConceptIDs>`

NN is zero-padded (01, 02, …) and becomes the chapter number.
````

- [ ] **Step 3: Write `SKILL.md`**

Create `.claude/skills/author-course/SKILL.md`:
````markdown
---
name: author-course
description: Author a full interactive course from a topic (no source book) — course spec, concept DAG, outline, and per-module lesson notes — ready for /visualize, interactive, and /tutor.
effort: high
argument-hint: <topic or course brief>
allowed-tools: Read Write Bash Agent Glob WebSearch TaskCreate TaskUpdate
---

ultrathink

Author a course for: **$ARGUMENTS**

## Steps

### 1. Clarify scope (only if essential)
If the brief lacks audience, level, course type (skill vs knowledge), or duration, ask the user — these are not guessable. Otherwise proceed.

### 2. Write the course spec
Read `${CLAUDE_SKILL_DIR}/course-spec-template.md`. Derive a kebab-case `slug`. Write a complete `course-spec.md` to `book-output/<slug>/course-spec.md`, including the `type: skill|knowledge` flag (explicit — never heuristic) and Bloom-tagged objectives.

### 3. Write the concept DAG
Read `${CLAUDE_SKILL_DIR}/concepts-format.md`. Enumerate the course's concepts and their dependencies + taxonomy + Bloom level. Write `book-output/<slug>/concepts.csv`. Then validate:
```bash
pnpm exec tsx src/cli.ts validate-concepts <slug>
```
If it exits non-zero, fix `concepts.csv` and re-run until it passes.

### 4. Write the outline
Group the concepts into modules (sessions). Write `book-output/<slug>/outline.md` using the module-line format from `concepts-format.md`.

### 5. Scaffold metadata
```bash
pnpm exec tsx src/cli.ts author-scaffold <slug>
```
This writes `book-output/<slug>/metadata.json` (one chapter per module).

### 6. Load the lesson-note template
Read `.claude/skills/tutor-prep/lesson-note-template.md`. Embed its full contents in every delegation message.

### 7. Create progress tasks
Read `metadata.json`. For each module, `TaskCreate` with subject `"[N/Total] <Module title>"`.

### 8. Author modules sequentially (resumable)
For each module in `metadata.chapters`, in order:
- **a. Skip if done.** With Glob, check `book-output/<slug>/lessons/module-NN-lesson.md` (where `module-NN.md` is `chapter.file`). If present: mark task completed, print `[N/Total] "<title>" — skipped`. Else continue.
- **b. Dispatch one `course-author` agent** (mark task in_progress). The delegation message:
  ```
  Write to: book-output/<slug>/lessons/module-NN-lesson.md
  Course: <metadata.title>
  Course type: <skill|knowledge from course-spec>
  Module title: <chapter.chapterTitle>
  Module number: <chapter.chapterNumber>
  Concepts: <for each ConceptID in this module's outline line: "ConceptLabel (Bloom: <level>)">

  Template:
  <full contents of lesson-note-template.md>
  ```
  Wait for completion. Mark task completed. Print `[N/Total] "<title>" — done`.
- **c. Clarity lint.** Run:
  ```bash
  pnpm exec tsx src/cli.ts lint-lessons <slug>
  ```
  If it exits non-zero for a concept in the just-written module (missing `#### Dig deeper`), re-dispatch that module once instructing the agent to add the missing block. Warnings are advisory.

### 9. Report completion
List the generated lesson notes. Suggest next steps: `/visualize <slug>`, then `pnpm exec tsx src/cli.ts interactive <slug>`, then `/tutor <slug>`.
````

- [ ] **Step 4: End-to-end verification with a tiny fixture course**

This proves the deterministic spine works without invoking the AI agent. Create a minimal course by hand, run the real CLI commands, and build the site.

Run:
```bash
SLUG=__e2e_authored__
mkdir -p book-output/$SLUG/lessons
cat > book-output/$SLUG/course-spec.md <<'EOF'
---
slug: __e2e_authored__
title: E2E Authored Smoke
author: Study Mate
language: en
type: skill
---
# E2E Authored Smoke
EOF
cp tests/fixtures/authored/good-concepts.csv book-output/$SLUG/concepts.csv
cat > book-output/$SLUG/outline.md <<'EOF'
# Outline
- module: 01 | title: Band Descriptors | concepts: 1,2,3
EOF
cat > book-output/$SLUG/lessons/module-01-lesson.md <<'EOF'
---
chapter: 1
title: "Band Descriptors"
source: { type: authored }
---

## Teaching arc
1. Band Descriptors — recognise what band 7 requires.

## Concepts

### C1 — Band Descriptors (Bloom: Understand)
- **Explanation:** The four criteria each score 0–9; the Writing band is their average with Task 2 weighted double.
- **Why it matters:** You cannot target 7.0 without knowing what each criterion rewards.

#### Dig deeper
**Intuition:** the criteria are independent levers, so the lowest one drags the average down.
**Worked example:** TR 7, CC 7, LR 6, GRA 6 averages to 6.5 — one weak lever costs half a band.
EOF

pnpm exec tsx src/cli.ts validate-concepts $SLUG
pnpm exec tsx src/cli.ts author-scaffold $SLUG
pnpm exec tsx src/cli.ts lint-lessons $SLUG
pnpm exec tsx src/cli.ts interactive $SLUG
```
Expected: `validate-concepts` prints `✓`; `author-scaffold` reports 1 module; `lint-lessons` passes; `interactive` writes MDX under `interactive-book/docs/__e2e_authored__/` with no error.

- [ ] **Step 5: Clean up the smoke artifacts**

Run:
```bash
rm -rf book-output/__e2e_authored__ interactive-book/docs/__e2e_authored__
```

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/author-course/
git commit -m "feat(courses): add /author-course skill (spec -> DAG -> outline -> lesson notes)"
```

---

## Self-review

**Spec coverage (Phase 1 scope only):**
- `/author-course` skill — Task 9. ✓
- `course-author` agent — Task 8. ✓
- `course-spec.md` (audience, prereqs, Bloom-tagged objectives, assessment, explicit `type`) — Task 9 (template) + parsed in Task 4. ✓
- `concepts.csv` enumeration + dependency DAG + taxonomy + Bloom — Tasks 1–3 (parse + validate + CLI) + Task 9 (authoring). ✓
- `outline.md` grouping concepts into modules — Tasks 4–5 + Task 9. ✓
- `lessons/*.md` per module via existing template + per-concept Bloom tag + optional skill blocks — Tasks 7–9. ✓
- `authored` frontmatter / `extract-figures` no-op — Task 6 (parse) + Task 8 (agent writes no figure tags). ✓
- Downstream reuse unchanged (`lint-lessons`, `interactive`, `/tutor`) — Task 9 Step 4 proves it builds. ✓
- Out of Phase 1 by design (later phases): `/practice`, rubric/prompts/feedback-spec, `progress.json` trajectory (Phase 2); `LearningGraph` component + `learning-graph` viewer JSON (Phase 4); curated IELTS content + sims (Phases 3–4). Correctly excluded.

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". Every code step shows complete code. One conditional appears in Task 7 Step 1 (verify the `ClarityFinding` field name is `level`) and Task 6 Step 4 (preserve surrounding expression shape) — both are explicit verification instructions with the concrete action to take, not deferred work.

**Type consistency:** `ConceptRecord`, `OutlineModule`, `CourseSpecFrontmatter`, `CourseValidationFinding`, `BloomLevel`/`BLOOM_LEVELS` defined once in `src/courses/types.ts` (T1) and reused verbatim in T2–T5. `runValidateConcepts`/`runAuthorScaffold`/`buildAuthoredMetadata` signatures match between their defining task and the CLI wiring. `sourceType: 'pdf' | 'epub' | 'authored'` widened in one place (T6) and `BookMetadata.sourceType?: 'authored'` is the metadata-level flag (T4) — distinct fields on distinct types, intentionally.
