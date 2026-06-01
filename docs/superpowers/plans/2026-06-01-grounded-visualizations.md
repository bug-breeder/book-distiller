# Grounded Inline Visualizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let lesson notes carry faithful inline diagrams (Mermaid graphs, markdown tables) for artifacts grounded in the chapter text, render them as a deterministic adjacency view in the live terminal, and lint graph nodes against the text — while everything ungroundable stays a page pointer.

**Architecture:** A new pure, unit-tested `src/diagrams/` module (parse Mermaid → graph; render adjacency; lint node labels; extract fenced blocks) plus a shared `src/pdf/text.ts` helper. Two CLI subcommands (`diagrams render`, `diagrams lint`) expose them. The `book-analyst` agent gains a faithfulness policy that decides when to inline vs. point; `/tutor-prep` lints after prep and `/tutor` renders in the teach step.

**Tech Stack:** TypeScript (strict, ESM, NodeNext — imports use `.js`), commander, fs-extra, Vitest, poppler `pdftotext` (already required by the `figures` command).

**Spec:** `docs/superpowers/specs/2026-06-01-grounded-visualizations-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/diagrams/parse.ts` (new) | `parseMermaidGraph(block)` → `{nodes, edges}`; types `GraphNode/GraphEdge/Graph` |
| `src/diagrams/render.ts` (new) | `renderAdjacency(graph)` → terminal text |
| `src/diagrams/lint.ts` (new) | `lintNodesAgainstText(graph, text)` → `{ok, unknown}` |
| `src/diagrams/extract.ts` (new) | `extractMermaidBlocks(markdown)` → `string[]` |
| `src/pdf/text.ts` (new) | `pdfPageText(pdf, start, end)` → raw `pdftotext` output (shared with `figures`) |
| `src/figures/extract.ts` (modify) | reuse `pdfPageText` instead of its own `pdftotext` spawn |
| `src/cli.ts` (modify) | register `diagrams render` / `diagrams lint` |
| `.claude/skills/tutor-prep/lesson-note-template.md` (modify) | inline mermaid/table convention |
| `.claude/agents/book-analyst.md` (modify) | faithfulness policy + decision table |
| `.claude/skills/tutor-prep/SKILL.md` (modify) | run `diagrams lint` after PDF-mode prep |
| `.claude/skills/tutor/SKILL.md` (modify) | render adjacency in the teach step |
| `tests/diagrams/{parse,render,lint}.test.ts` (new) | unit tests |

---

## Phase 1 — diagrams core (pure TS, TDD)

### Task 1: Parse Mermaid graphs

**Files:**
- Create: `src/diagrams/parse.ts`
- Test: `tests/diagrams/parse.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/diagrams/parse.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseMermaidGraph } from '../../src/diagrams/parse.js';

describe('parseMermaidGraph', () => {
  it('parses undirected edges and registers nodes in order', () => {
    const g = parseMermaidGraph('graph LR\n  B --- A\n  B --- C\n  B --- D');
    expect(g.nodes.map((n) => n.id)).toEqual(['B', 'A', 'C', 'D']);
    expect(g.edges).toEqual([
      { from: 'B', to: 'A', directed: false },
      { from: 'B', to: 'C', directed: false },
      { from: 'B', to: 'D', directed: false },
    ]);
  });

  it('parses directed edges, node labels, and edge labels', () => {
    const g = parseMermaidGraph('graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Go]');
    expect(g.nodes).toEqual([
      { id: 'A', label: 'Start' },
      { id: 'B', label: 'Decision' },
      { id: 'C', label: 'Go' },
    ]);
    expect(g.edges).toEqual([
      { from: 'A', to: 'B', directed: true },
      { from: 'B', to: 'C', directed: true, label: 'Yes' },
    ]);
  });

  it('ignores headers, comments, and unparseable prose lines', () => {
    const g = parseMermaidGraph('graph TD\n  %% a comment\n  A --> B\n  random prose here');
    expect(g.edges).toEqual([{ from: 'A', to: 'B', directed: true }]);
    expect(g.nodes.map((n) => n.id)).toEqual(['A', 'B']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/diagrams/parse.test.ts`
Expected: FAIL — cannot resolve `../../src/diagrams/parse.js`.

- [ ] **Step 3: Write the implementation**

Create `src/diagrams/parse.ts`:
```ts
// src/diagrams/parse.ts

export interface GraphNode {
  id: string;
  label: string;
}
export interface GraphEdge {
  from: string;
  to: string;
  directed: boolean;
  label?: string;
}
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const HEADER_RE = /^\s*(graph|flowchart)\s+(TB|TD|BT|RL|LR)\b/i;
// left token, connector, optional |edge label|, right token
const EDGE_RE = /^\s*(.+?)\s*(<-->|-->|---)\s*(?:\|([^|]*)\|\s*)?(.+?)\s*$/;
// node id with an optional bracketed label: [..] {..} ((..)) (..)
const TOKEN_RE =
  /^([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\]|\{([^}]*)\}|\(\(([^)]*)\)\)|\(([^)]*)\))?$/;

function parseToken(tok: string): GraphNode | null {
  const m = TOKEN_RE.exec(tok.trim());
  if (!m) return null;
  const label = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? m[1]).trim();
  return { id: m[1], label };
}

/**
 * Parse a Mermaid `graph`/`flowchart` block into nodes and edges.
 * Undirected `A --- B`, directed `A --> B` / `A <--> B`, optional node labels
 * and `|edge labels|`. Lines that are not an edge or a node declaration
 * (headers, `%%` comments, prose) are ignored.
 */
export function parseMermaidGraph(block: string): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const addNode = (n: GraphNode | null): void => {
    if (n && !seen.has(n.id)) {
      seen.add(n.id);
      nodes.push(n);
    }
  };

  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line || HEADER_RE.test(line) || line.startsWith('%%')) continue;

    const em = EDGE_RE.exec(line);
    if (em) {
      const from = parseToken(em[1]);
      const to = parseToken(em[4]);
      if (from && to) {
        addNode(from);
        addNode(to);
        const edge: GraphEdge = { from: from.id, to: to.id, directed: em[2] !== '---' };
        if (em[3] && em[3].trim()) edge.label = em[3].trim();
        edges.push(edge);
        continue;
      }
    }
    addNode(parseToken(line));
  }
  return { nodes, edges };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/diagrams/parse.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/diagrams/parse.ts tests/diagrams/parse.test.ts
git commit -m "feat(diagrams): parse Mermaid graph blocks into nodes/edges"
```

---

### Task 2: Render adjacency view

**Files:**
- Create: `src/diagrams/render.ts`
- Test: `tests/diagrams/render.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/diagrams/render.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseMermaidGraph } from '../../src/diagrams/parse.js';
import { renderAdjacency } from '../../src/diagrams/render.js';

describe('renderAdjacency', () => {
  it('renders undirected edges with node labels', () => {
    const g = parseMermaidGraph('graph LR\n B --- A\n B --- C');
    expect(renderAdjacency(g)).toBe('Nodes: B, A, C\nEdges:\n  B — A\n  B — C');
  });

  it('renders directed edges and edge labels using labels', () => {
    const g = parseMermaidGraph('graph TD\n A[Start] --> B{Decision}\n B -->|Yes| C[Go]');
    expect(renderAdjacency(g)).toBe(
      'Nodes: Start, Decision, Go\nEdges:\n  Start → Decision\n  Decision → Go [Yes]',
    );
  });

  it('renders only the node line when there are no edges', () => {
    expect(renderAdjacency(parseMermaidGraph('graph TD\n A[Solo]'))).toBe('Nodes: Solo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/diagrams/render.test.ts`
Expected: FAIL — cannot resolve `render.js`.

- [ ] **Step 3: Write the implementation**

Create `src/diagrams/render.ts`:
```ts
// src/diagrams/render.ts
import type { Graph } from './parse.js';

/**
 * A deterministic, terminal-friendly view of a parsed graph: a node line plus
 * one edge per line (`—` undirected, `→` directed, `[label]` if present).
 * Node display uses the label; ids are only an internal handle.
 */
export function renderAdjacency(g: Graph): string {
  const labelOf = (id: string): string => g.nodes.find((n) => n.id === id)?.label ?? id;
  const nodeLine = `Nodes: ${g.nodes.map((n) => n.label).join(', ')}`;
  if (g.edges.length === 0) return nodeLine;
  const edgeLines = g.edges.map((e) => {
    const sym = e.directed ? '→' : '—';
    const lbl = e.label ? ` [${e.label}]` : '';
    return `  ${labelOf(e.from)} ${sym} ${labelOf(e.to)}${lbl}`;
  });
  return [nodeLine, 'Edges:', ...edgeLines].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/diagrams/render.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/diagrams/render.ts tests/diagrams/render.test.ts
git commit -m "feat(diagrams): render a graph as a terminal adjacency view"
```

---

### Task 3: Extract blocks + lint nodes against text

**Files:**
- Create: `src/diagrams/extract.ts`, `src/diagrams/lint.ts`
- Test: `tests/diagrams/lint.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/diagrams/lint.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseMermaidGraph } from '../../src/diagrams/parse.js';
import { lintNodesAgainstText } from '../../src/diagrams/lint.js';
import { extractMermaidBlocks } from '../../src/diagrams/extract.js';

describe('lintNodesAgainstText', () => {
  it('ignores single-letter ids (unverifiable) and passes', () => {
    const g = parseMermaidGraph('graph LR\n A --- B\n B --- C');
    expect(lintNodesAgainstText(g, 'completely unrelated text')).toEqual({ ok: true, unknown: [] });
  });

  it('flags a named node label absent from the chapter text', () => {
    const g = parseMermaidGraph('graph LR\n MIT --- BBN\n MIT --- UTAH');
    const text = 'the network connected MIT and BBN at distance one';
    expect(lintNodesAgainstText(g, text)).toEqual({ ok: false, unknown: ['UTAH'] });
  });

  it('passes when all named labels appear in the text (case-insensitive)', () => {
    const g = parseMermaidGraph('graph LR\n Reciprocity --- Liking');
    expect(lintNodesAgainstText(g, 'the rule of RECIPROCITY and the principle of liking')).toEqual({
      ok: true,
      unknown: [],
    });
  });
});

describe('extractMermaidBlocks', () => {
  it('extracts the inner content of each fenced mermaid block', () => {
    const md = 'intro\n\n```mermaid\ngraph LR\n A --- B\n```\n\nmid\n\n```mermaid\ngraph TD\n X --> Y\n```\n';
    expect(extractMermaidBlocks(md)).toEqual(['graph LR\n A --- B', 'graph TD\n X --> Y']);
  });

  it('returns [] when there are no mermaid blocks', () => {
    expect(extractMermaidBlocks('# title\n```js\ncode\n```')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: FAIL — cannot resolve `lint.js` / `extract.js`.

- [ ] **Step 3: Write the implementations**

Create `src/diagrams/extract.ts`:
```ts
// src/diagrams/extract.ts

/** Return the inner content of every fenced ```mermaid block in a markdown string. */
export function extractMermaidBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /```mermaid[ \t]*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    blocks.push(m[1].replace(/\s+$/, ''));
  }
  return blocks;
}
```

Create `src/diagrams/lint.ts`:
```ts
// src/diagrams/lint.ts
import type { Graph } from './parse.js';

export interface LintResult {
  ok: boolean;
  unknown: string[];
}

/**
 * Deterministic grounding backstop: every *meaningful* node label (length >= 2,
 * not a bare single letter/number) must appear in the chapter text. Single-char
 * abstract ids are exempt — they occur all over the text and cannot be verified
 * (those graphs rely on the conservative authoring policy instead).
 */
export function lintNodesAgainstText(g: Graph, chapterText: string): LintResult {
  const hay = chapterText.toLowerCase();
  const unknown: string[] = [];
  for (const n of g.nodes) {
    const label = n.label.trim();
    if (/^[A-Za-z0-9]$/.test(label)) continue; // bare single char -> unverifiable
    if (!hay.includes(label.toLowerCase())) unknown.push(label);
  }
  return { ok: unknown.length === 0, unknown: [...new Set(unknown)] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/diagrams/extract.ts src/diagrams/lint.ts tests/diagrams/lint.test.ts
git commit -m "feat(diagrams): extract mermaid blocks and lint node labels against text"
```

---

## Phase 2 — PDF text helper + CLI

### Task 4: Shared `pdfPageText` helper

**Files:**
- Create: `src/pdf/text.ts`
- Modify: `src/figures/extract.ts` (reuse the helper)

- [ ] **Step 1: Write the implementation**

Create `src/pdf/text.ts`:
```ts
// src/pdf/text.ts
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/** Run `pdftotext -layout` over a PDF page range and return its raw stdout. */
export async function pdfPageText(
  pdfPath: string,
  startPage: number,
  endPage: number,
): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      'pdftotext',
      ['-f', String(startPage), '-l', String(endPage), '-layout', pdfPath, '-'],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    return stdout;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') {
      throw new Error(
        'pdftotext not found — install poppler (e.g. `brew install poppler`).',
      );
    }
    throw new Error(`pdftotext failed: ${e.message}`);
  }
}
```

- [ ] **Step 2: Refactor `figuresFromPdf` to use it**

In `src/figures/extract.ts`, replace the body of `figuresFromPdf` (the `execFileAsync('pdftotext', …)` block) so the function reads:
```ts
import { pdfPageText } from '../pdf/text.js';

// ... parseFigures stays unchanged ...

export async function figuresFromPdf(
  pdfPath: string,
  startPage: number,
  endPage: number,
): Promise<FigureLoc[]> {
  const text = await pdfPageText(pdfPath, startPage, endPage);
  return parseFigures(text, startPage);
}
```
Remove the now-unused `execFile`/`promisify`/`execFileAsync` imports and declarations from `src/figures/extract.ts`.

- [ ] **Step 3: Verify typecheck and existing tests still pass**

Run: `pnpm typecheck && pnpm exec vitest run tests/figures`
Expected: typecheck clean; `tests/figures/extract.test.ts` still PASS (3 tests — `parseFigures` is unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/pdf/text.ts src/figures/extract.ts
git commit -m "refactor: extract shared pdfPageText helper (used by figures + diagrams)"
```

---

### Task 5: `diagrams` CLI subcommands

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Add imports**

In `src/cli.ts`, after the existing `import { figuresFromPdf } from './figures/extract.js';` line, add:
```ts
import { extractMermaidBlocks } from './diagrams/extract.js';
import { parseMermaidGraph } from './diagrams/parse.js';
import { renderAdjacency } from './diagrams/render.js';
import { lintNodesAgainstText } from './diagrams/lint.js';
import { pdfPageText } from './pdf/text.js';
```

- [ ] **Step 2: Register the `diagrams` command group**

In `src/cli.ts`, immediately *before* the line `const today = () => new Date().toISOString().slice(0, 10);`, insert:
```ts
const diagramsCmd = program
  .command('diagrams')
  .description('Render or lint grounded diagrams embedded in a lesson note');

diagramsCmd
  .command('render <note>')
  .description('Print each mermaid block in a lesson note as a terminal adjacency view')
  .action(async (note: string) => {
    const md = await fs.readFile(path.resolve(note), 'utf-8');
    const blocks = extractMermaidBlocks(md);
    if (blocks.length === 0) {
      console.log('(no mermaid diagrams)');
      return;
    }
    blocks.forEach((block, i) => {
      if (i > 0) console.log('');
      console.log(renderAdjacency(parseMermaidGraph(block)));
    });
  });

diagramsCmd
  .command('lint <note> <pdf> <start> <end>')
  .description('Verify each mermaid block\'s node labels appear in the chapter text')
  .action(async (note: string, pdf: string, start: string, end: string) => {
    const s = Number(start);
    const e = Number(end);
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < s) {
      console.error('Error: <start> and <end> must be positive integers with start <= end');
      process.exit(1);
    }
    const md = await fs.readFile(path.resolve(note), 'utf-8');
    const text = await pdfPageText(path.resolve(pdf), s, e);
    const offenders: string[] = [];
    for (const block of extractMermaidBlocks(md)) {
      const { unknown } = lintNodesAgainstText(parseMermaidGraph(block), text);
      offenders.push(...unknown);
    }
    if (offenders.length > 0) {
      console.error(
        `✗ ungrounded node labels (not found in chapter text): ${[...new Set(offenders)].join(', ')}`,
      );
      process.exit(1);
    }
    console.log('✓ all diagram node labels are grounded in the chapter text');
  });
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 4: Manual verification with a crafted note**

```bash
printf '## Figures\n\n```mermaid\ngraph LR\n  B --- A\n  B --- C\n  B --- D\n```\n' > /tmp/note-demo.md
pnpm exec tsx src/cli.ts diagrams render /tmp/note-demo.md
```
Expected output:
```
Nodes: B, A, C, D
Edges:
  B — A
  B — C
  B — D
```
Then confirm lint flags an invented named node (requires the parsed networks-book PDF at `/tmp/networks-book.pdf`, pages 37-60):
```bash
printf '```mermaid\ngraph LR\n  Reciprocity --- Banana\n```\n' > /tmp/note-bad.md
pnpm exec tsx src/cli.ts diagrams lint /tmp/note-bad.md /tmp/networks-book.pdf 37 60; echo "exit=$?"
```
Expected: `✗ ungrounded node labels …: Reciprocity, Banana` and `exit=1` (neither word is in the Graphs chapter).

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts
git commit -m "feat(cli): diagrams render + lint subcommands"
```

---

## Phase 3 — authoring policy + skill wiring

### Task 6: Lesson-note template — inline visual convention

**Files:**
- Modify: `.claude/skills/tutor-prep/lesson-note-template.md`

- [ ] **Step 1: Update the Figures section of the template**

In `.claude/skills/tutor-prep/lesson-note-template.md`, replace the `## Figures / Tables / Equations` section body with:
```markdown
## Figures / Tables / Equations
Every figure, table, diagram, or key equation the chapter uses to make a point. One per line:
`- **<label>** — <location> — "<what it shows / what to look for>"`
- PDF location: a page number, e.g. `p. 97`. Write `around p. 97` if you are not certain.
- EPUB location: a section/heading anchor, e.g. `§3.4` or the nearest heading text.
If the chapter has none, write `- (none)`.

**Optional inline visual (faithful only).** Immediately under an artifact's line you MAY add a grounded rendering — but ONLY when its structure/values are stated in the chapter text. The location pointer above stays either way.
- A **small graph** the prose actually describes (≤ 8 nodes) → a fenced ` ```mermaid ` block (`A --- B` undirected, `A --> B` directed). Use the real node names when the text names them.
- A **table / payoff matrix** whose values are in the text → a markdown table.
- A **numbered equation** → render it inline from the text.
Do NOT inline charts/plots, real/large networks, or photographs — point to their page only.
```

- [ ] **Step 2: Verify the template still describes the four sections**

Run: `grep -nE '^## ' .claude/skills/tutor-prep/lesson-note-template.md`
Expected: `## Teaching arc`, `## Concepts`, `## Figures / Tables / Equations`, `## Review items` all present.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/tutor-prep/lesson-note-template.md
git commit -m "feat(tutor-prep): lesson-note template allows faithful inline visuals"
```

---

### Task 7: `book-analyst` faithfulness policy

**Files:**
- Modify: `.claude/agents/book-analyst.md`

- [ ] **Step 1: Add the policy to the Lesson task section**

In `.claude/agents/book-analyst.md`, in the `## Lesson task` section, after rule **1** (figures referenced by LOCATION), insert a new rule:
```markdown
1a. **Inline a visualization ONLY when it is grounded in the chapter text** — never reconstruct a figure you could not read. Decision table:

   | Artifact | Inline? | How |
   |---|---|---|
   | Table / payoff matrix whose values are in the text | yes | markdown table |
   | A small graph whose edges the prose names (≤ 8 nodes) | yes | a ` ```mermaid ` block — `A --- B` undirected, `A --> B` directed; use the names the text uses |
   | Numbered equation | yes | inline from the extracted text |
   | Chart / plot (histogram, distribution) | no | location pointer only |
   | Real or large network (e.g. an enumerated city/host network) | no | location pointer only |
   | Photograph / real-world image | no | location pointer only |

   The location pointer (rule 1) is ALWAYS present, even when you inline a visual. If you are not certain the structure/values are in the text, do not draw — point to the page. A deterministic lint will reject any mermaid node label that is not present in the chapter text.
```

- [ ] **Step 2: Verify the edit landed**

Run: `grep -n "Inline a visualization ONLY when" .claude/agents/book-analyst.md`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/book-analyst.md
git commit -m "feat(book-analyst): faithfulness policy for inline visualizations"
```

---

### Task 8: Wire lint into `/tutor-prep` and render into `/tutor`

**Files:**
- Modify: `.claude/skills/tutor-prep/SKILL.md`, `.claude/skills/tutor/SKILL.md`

- [ ] **Step 1: Add the lint step to `/tutor-prep`**

In `.claude/skills/tutor-prep/SKILL.md`, in step 6, immediately after the line `After the agent completes: mark the task completed. Print `[N/Total] "Title" — done`.`, insert:
```markdown

**c. Lint inline diagrams (PDF mode only).** After the note is written, run:
```bash
pnpm exec tsx src/cli.ts diagrams lint "book-output/$0/lessons/<chapter-slug>-lesson.md" "<metadata.sourceFile>" <chapter.pageRange.start> <chapter.pageRange.end>
```
If it exits non-zero (ungrounded node labels), the analyst invented a diagram. Re-dispatch the same chapter once telling the analyst to remove the offending ` ```mermaid ` block(s) and keep only the location pointer. If it still fails, leave the pointer and drop the block manually.
```

- [ ] **Step 2: Add the render step to `/tutor`'s teach loop**

In `.claude/skills/tutor/SKILL.md`, in step 5 ("Teach, concept-by-concept"), replace sub-point `2.` with:
```markdown
2. If a figure/table/equation in the note relates, point to it by location: "Open **<label>** (<location>) — notice <what to look for>." Do NOT redraw it. If the note contains an inline ` ```mermaid ` diagram for this concept, also show its terminal view by running `pnpm exec tsx src/cli.ts diagrams render <lesson-note-path>` and pasting the relevant block's adjacency output; markdown tables in the note can be shown as-is.
```

- [ ] **Step 3: Verify the edits landed**

Run: `grep -n "diagrams lint" .claude/skills/tutor-prep/SKILL.md && grep -n "diagrams render" .claude/skills/tutor/SKILL.md`
Expected: one match in each file.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/tutor-prep/SKILL.md .claude/skills/tutor/SKILL.md
git commit -m "feat(tutor): lint inline diagrams in prep, render adjacency while teaching"
```

---

## Final verification (after all tasks)

- [ ] `pnpm typecheck` clean.
- [ ] `pnpm test` — all suites pass (existing 50 + 11 new: parse 3, render 3, lint 5).
- [ ] Manual end-to-end: re-dispatch `book-analyst` on networks-book Ch.2 (pp.37-60) with the updated policy; confirm it inlines a faithful mermaid block for a prose-described small graph (or a table where applicable), that `diagrams lint` passes on the note, and `diagrams render` shows a sensible adjacency view.

---

## Self-Review

**1. Spec coverage:**
- Faithful inline visuals (tables/small graphs/equations) → Tasks 6 (template), 7 (policy). ✓
- Notes render in markdown viewers (mermaid/tables) → Task 6 convention. ✓
- Terminal adjacency render → Tasks 2 (render), 5 (CLI), 8 (tutor wiring). ✓
- Deterministic node-lint backstop → Tasks 3 (lint), 5 (CLI), 8 (prep wiring). ✓
- Everything ungroundable stays a pointer → Tasks 6 & 7 (decision table, "pointer always present"). ✓
- `src/diagrams/` module + `diagrams lint`/`render` CLI → Tasks 1-3, 5. ✓
- Reject npm mermaid-ascii (no dependency added) → confirmed: only commander-free pure modules; no new deps. ✓
- Honest lint limit (single-letter ids exempt) → Task 3 implementation + test 1. ✓
- Error handling: pdftotext ENOENT → Task 4 helper; lint failure → Task 8 prep step. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full code; every command has expected output. ✓

**3. Type consistency:** `Graph`/`GraphNode`/`GraphEdge` defined in Task 1 and imported by Tasks 2-3 & 5. `parseMermaidGraph`, `renderAdjacency`, `lintNodesAgainstText`, `extractMermaidBlocks`, `pdfPageText` names are identical across tasks, tests, and CLI. `LintResult.unknown`/`ok` match the lint tests. ✓

---

## Post-plan hardening (from E2E)

The plan's final manual E2E (re-dispatch `book-analyst` on Ch.2) surfaced that the analyst inlined a 13-node real network (the Arpanet, Fig 2.3) which the node-label lint passed (its labels *are* in the chapter text). The size cap — listed as a guard in the spec but originally left to the authoring policy — was added to the deterministic lint gate:

- `src/diagrams/lint.ts`: `export const MAX_GRAPH_NODES = 8` + `exceedsNodeCap(g): boolean`; 2 unit tests in `tests/diagrams/lint.test.ts` (63 tests total).
- `src/cli.ts` `diagrams lint`: oversized blocks fail the gate with `✗ ... exceed the 8-node cap ...` (exit 1).
- `book-analyst.md`: policy notes the lint rejects >8-node graphs.

The cap is a **conservative stopgap**: a proxy for "real/large enumerated network (edges only in the image)." The chosen real fix is **edge-grounding** (verify each edge against the prose), which gets its own spec/plan; once edges are grounded the cap can be relaxed. See the design spec's *Stopgap, not the final answer* and *Future work*.
