# Edge-Grounding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic backstop that rejects any inlined Mermaid graph containing a *named* edge the chapter prose does not assert, so the analyst cannot ship invented edges — while single-letter/abstract edges stay exempt and the ≤8-node cap is unchanged.

**Architecture:** Extend the pure `src/diagrams/lint.ts` module with a shared `isVerifiableLabel` predicate, a word-boundary text matcher (also hardening the existing node-lint), a `splitSentences` helper, and `lintEdgesAgainstText` (an edge is grounded iff some sentence holds both named endpoints + a connection cue). Wire it into the `diagrams lint` CLI as a third failure mode; the existing `/tutor-prep` re-dispatch-on-failure flow handles it. Add one policy line to `book-analyst`.

**Tech Stack:** TypeScript (strict, ESM, NodeNext — imports use `.js`), commander, fs-extra, Vitest, poppler `pdftotext`.

**Spec:** `docs/superpowers/specs/2026-06-01-edge-grounding-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/diagrams/lint.ts` (modify) | add `isVerifiableLabel`, private `escapeRegExp`/`textHasTerm`, refactor `lintNodesAgainstText` to word-boundary, add `splitSentences`, `CONNECTION_CUE_RE`, `EdgeLintResult`, `lintEdgesAgainstText` |
| `tests/diagrams/lint.test.ts` (modify) | node-lint word-boundary regression; `splitSentences` tests; `lintEdgesAgainstText` tests |
| `src/cli.ts` (modify) | run `lintEdgesAgainstText` in `diagrams lint`; third `✗` line; update description + success message |
| `.claude/agents/book-analyst.md` (modify) | policy: draw only prose-stated edges |
| `.claude/skills/tutor-prep/SKILL.md` (modify) | broaden the lint-fail re-dispatch wording to include edges/cap |

---

## Task 1: Shared verifiable-label predicate + word-boundary node-lint

**Files:**
- Modify: `src/diagrams/lint.ts`
- Test: `tests/diagrams/lint.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/diagrams/lint.test.ts`, add this test inside the existing `describe('lintNodesAgainstText', …)` block (after its last `it`):
```ts
  it('uses word boundaries: a substring match does not count as grounded', () => {
    const g = parseMermaidGraph('graph LR\n MIT --- BBN');
    const text = 'many students were admitted; the BBN router connected them';
    expect(lintNodesAgainstText(g, text)).toEqual({ ok: false, unknown: ['MIT'] });
  });
```
(`MIT` appears only inside `admitted` — under the old substring check it would wrongly pass; under word boundaries it is correctly flagged. `BBN` is a whole word and stays grounded.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: FAIL — the new test gets `{ ok: true, unknown: [] }` (old substring logic grounds `MIT` via `admitted`).

- [ ] **Step 3: Implement the helpers and refactor `lintNodesAgainstText`**

In `src/diagrams/lint.ts`, replace the existing `lintNodesAgainstText` function (and its doc comment) with:
```ts
/** A label is verifiable iff it is not a bare single letter/number — those
 * abstract ids occur all over the text and cannot be grounded. Shared by the
 * node-label lint and the edge lint. */
export function isVerifiableLabel(label: string): boolean {
  return !/^[A-Za-z0-9]$/.test(label.trim());
}

/** Escape a string for literal use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive, word-boundary test: does `term` occur as a whole token? */
function textHasTerm(text: string, term: string): boolean {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text);
}

/**
 * Deterministic grounding backstop: every *verifiable* node label (not a bare
 * single letter/number) must appear in the chapter text as a whole word. Single-
 * char abstract ids are exempt — they occur all over the text and cannot be
 * verified (those graphs rely on the conservative authoring policy instead).
 */
export function lintNodesAgainstText(g: Graph, chapterText: string): LintResult {
  const unknown: string[] = [];
  for (const n of g.nodes) {
    const label = n.label.trim();
    if (!isVerifiableLabel(label)) continue;
    if (!textHasTerm(chapterText, label)) unknown.push(label);
  }
  return { ok: unknown.length === 0, unknown: [...new Set(unknown)] };
}
```
(Leave `LintResult`, `MAX_GRAPH_NODES`, and `exceedsNodeCap` exactly as they are.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: PASS — all node-lint tests including the new word-boundary one (the three pre-existing node-lint tests are unaffected: single letters still exempt; `MIT`/`BBN`/`UTAH` and `Reciprocity`/`Liking` are whole-word matches).

- [ ] **Step 5: Commit**

```bash
git add src/diagrams/lint.ts tests/diagrams/lint.test.ts
git commit -m "refactor(diagrams): word-boundary node-lint + shared isVerifiableLabel"
```

---

## Task 2: `splitSentences`

**Files:**
- Modify: `src/diagrams/lint.ts`
- Test: `tests/diagrams/lint.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/diagrams/lint.test.ts`, update the import on line 3 to add `splitSentences`:
```ts
import {
  lintNodesAgainstText,
  exceedsNodeCap,
  MAX_GRAPH_NODES,
  splitSentences,
} from '../../src/diagrams/lint.js';
```
Then append a new describe block at the end of the file:
```ts
describe('splitSentences', () => {
  it('keeps a sentence wrapped across newlines intact', () => {
    expect(splitSentences('MIT is connected\nto BBN and UTAH.')).toEqual([
      'MIT is connected to BBN and UTAH.',
    ]);
  });

  it('splits on sentence-ending punctuation', () => {
    expect(splitSentences('First one. Second two!')).toEqual(['First one.', 'Second two!']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: FAIL — `splitSentences` is not exported.

- [ ] **Step 3: Implement**

In `src/diagrams/lint.ts`, append:
```ts
/**
 * Split chapter text into rough sentences. `pdftotext` wraps lines mid-sentence,
 * so collapse all whitespace (newlines, form-feeds, runs of spaces) to single
 * spaces first, then split on sentence-ending punctuation. Heuristic — good
 * enough for a grounding backstop.
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: PASS (both `splitSentences` tests).

- [ ] **Step 5: Commit**

```bash
git add src/diagrams/lint.ts tests/diagrams/lint.test.ts
git commit -m "feat(diagrams): splitSentences helper for edge grounding"
```

---

## Task 3: `lintEdgesAgainstText`

**Files:**
- Modify: `src/diagrams/lint.ts`
- Test: `tests/diagrams/lint.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/diagrams/lint.test.ts`, add `lintEdgesAgainstText` to the import added in Task 2:
```ts
import {
  lintNodesAgainstText,
  exceedsNodeCap,
  MAX_GRAPH_NODES,
  splitSentences,
  lintEdgesAgainstText,
} from '../../src/diagrams/lint.js';
```
Then append a new describe block at the end of the file:
```ts
describe('lintEdgesAgainstText', () => {
  it('grounds named edges asserted in one sentence with a connection cue', () => {
    const g = parseMermaidGraph('graph LR\n MIT --- BBN\n MIT --- UTAH');
    const text = 'In the network, MIT is connected to BBN and UTAH.';
    expect(lintEdgesAgainstText(g, text)).toEqual({ ok: true, ungrounded: [] });
  });

  it('flags an edge whose endpoints co-occur without a connection cue', () => {
    const g = parseMermaidGraph('graph LR\n MIT --- STAN');
    const text = 'The distance from MIT to STAN is two.';
    expect(lintEdgesAgainstText(g, text)).toEqual({ ok: false, ungrounded: ['MIT—STAN'] });
  });

  it('uses word boundaries: a substring endpoint does not ground an edge', () => {
    const g = parseMermaidGraph('graph LR\n MIT --- BBN');
    const text = 'students were admitted and the bbn link connected them';
    expect(lintEdgesAgainstText(g, text)).toEqual({ ok: false, ungrounded: ['MIT—BBN'] });
  });

  it('skips edges touching a single-letter (unverifiable) node', () => {
    const g = parseMermaidGraph('graph LR\n A --- B\n B --- C');
    expect(lintEdgesAgainstText(g, 'completely unrelated prose')).toEqual({
      ok: true,
      ungrounded: [],
    });
  });
});
```
Note on the `MIT—STAN` / `MIT—BBN` strings: the separator is an em dash `—` (U+2014), the same character `lintEdgesAgainstText` builds in Step 3 — copy it exactly.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: FAIL — `lintEdgesAgainstText` is not exported.

- [ ] **Step 3: Implement**

In `src/diagrams/lint.ts`, append:
```ts
export interface EdgeLintResult {
  ok: boolean;
  ungrounded: string[];
}

// Connection cues that signal an asserted edge. Excludes bare "between"
// ("the distance between A and B" is not an edge); "an edge between …" still
// fires via "edge".
const CONNECTION_CUE_RE =
  /\b(connect(?:s|ed|ion|ions)?|join(?:s|ed|ing)?|edges?|link(?:s|ed|ing)?|adjacent|neighbou?rs?|ties?|tied|attached)\b/i;

/**
 * Deterministic edge backstop: a graph edge whose BOTH endpoints are verifiable
 * (named, multi-char) must be asserted by the prose — some sentence must contain
 * both endpoint labels (word-boundary) AND a connection cue. Edges touching a
 * single-letter node are unverifiable and skipped. Edges store node ids, so each
 * id is resolved to its node label first.
 */
export function lintEdgesAgainstText(g: Graph, chapterText: string): EdgeLintResult {
  const labelOf = (id: string): string => g.nodes.find((n) => n.id === id)?.label ?? id;
  const sentences = splitSentences(chapterText);
  const ungrounded: string[] = [];
  for (const e of g.edges) {
    const from = labelOf(e.from).trim();
    const to = labelOf(e.to).trim();
    if (!isVerifiableLabel(from) || !isVerifiableLabel(to)) continue;
    const grounded = sentences.some(
      (s) => textHasTerm(s, from) && textHasTerm(s, to) && CONNECTION_CUE_RE.test(s),
    );
    if (!grounded) ungrounded.push(`${from}—${to}`);
  }
  return { ok: ungrounded.length === 0, ungrounded: [...new Set(ungrounded)] };
}
```
(`textHasTerm`, `isVerifiableLabel`, and `splitSentences` already exist in this file from Tasks 1–2.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/diagrams/lint.test.ts`
Expected: PASS (4 new edge tests; full file now 70 tests across the suite).

- [ ] **Step 5: Commit**

```bash
git add src/diagrams/lint.ts tests/diagrams/lint.test.ts
git commit -m "feat(diagrams): lintEdgesAgainstText (prose-grounded named edges)"
```

---

## Task 4: Wire edge-lint into the `diagrams lint` CLI

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Add the import**

In `src/cli.ts`, change the line:
```ts
import { lintNodesAgainstText, exceedsNodeCap, MAX_GRAPH_NODES } from './diagrams/lint.js';
```
to:
```ts
import {
  lintNodesAgainstText,
  exceedsNodeCap,
  MAX_GRAPH_NODES,
  lintEdgesAgainstText,
} from './diagrams/lint.js';
```

- [ ] **Step 2: Update the command description**

In `src/cli.ts`, change the `diagrams lint` description line:
```ts
  .description('Verify each mermaid block\'s node labels appear in the chapter text and stay within the node cap')
```
to:
```ts
  .description('Verify each mermaid block\'s node labels and edges are grounded in the chapter text and within the node cap')
```

- [ ] **Step 3: Add the edge check + failure line in the action**

In `src/cli.ts`, replace this exact block (the collectors-through-success-message part of the `diagrams lint` action):
```ts
    const offenders: string[] = [];
    const oversized: number[] = [];
    for (const block of blocks) {
      const graph = parseMermaidGraph(block);
      if (exceedsNodeCap(graph)) oversized.push(graph.nodes.length);
      offenders.push(...lintNodesAgainstText(graph, text).unknown);
    }
    let failed = false;
    if (oversized.length > 0) {
      console.error(
        `✗ ${oversized.length} diagram(s) exceed the ${MAX_GRAPH_NODES}-node cap (sizes: ${oversized.join(', ')}) — a real/large network must be a location pointer, not an inline graph`,
      );
      failed = true;
    }
    if (offenders.length > 0) {
      console.error(
        `✗ ungrounded node labels (not found in chapter text): ${[...new Set(offenders)].join(', ')}`,
      );
      failed = true;
    }
    if (failed) {
      process.exit(1);
      return;
    }
    console.log('✓ all diagram node labels are grounded in the chapter text');
```
with:
```ts
    const offenders: string[] = [];
    const oversized: number[] = [];
    const ungroundedEdges: string[] = [];
    for (const block of blocks) {
      const graph = parseMermaidGraph(block);
      if (exceedsNodeCap(graph)) oversized.push(graph.nodes.length);
      offenders.push(...lintNodesAgainstText(graph, text).unknown);
      ungroundedEdges.push(...lintEdgesAgainstText(graph, text).ungrounded);
    }
    let failed = false;
    if (oversized.length > 0) {
      console.error(
        `✗ ${oversized.length} diagram(s) exceed the ${MAX_GRAPH_NODES}-node cap (sizes: ${oversized.join(', ')}) — a real/large network must be a location pointer, not an inline graph`,
      );
      failed = true;
    }
    if (offenders.length > 0) {
      console.error(
        `✗ ungrounded node labels (not found in chapter text): ${[...new Set(offenders)].join(', ')}`,
      );
      failed = true;
    }
    if (ungroundedEdges.length > 0) {
      console.error(
        `✗ ungrounded edges (not stated in chapter prose): ${[...new Set(ungroundedEdges)].join(', ')}`,
      );
      failed = true;
    }
    if (failed) {
      process.exit(1);
      return;
    }
    console.log('✓ all diagram node labels and edges are grounded in the chapter text');
```

- [ ] **Step 4: Update the no-blocks success message for consistency**

In `src/cli.ts`, the no-blocks short-circuit currently prints:
```ts
    if (blocks.length === 0) {
      console.log('✓ all diagram node labels are grounded in the chapter text');
      return;
    }
```
Change that `console.log` string to match the new success message:
```ts
    if (blocks.length === 0) {
      console.log('✓ all diagram node labels and edges are grounded in the chapter text');
      return;
    }
```

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Manual verification (uses the parsed networks-book PDF at `/tmp/networks-book.pdf`, pp.37-60)**

A named edge whose endpoints both appear in the chapter but are not stated as connected must fail on the **edges** line only (node-labels pass, cap passes):
```bash
printf '```mermaid\ngraph LR\n  Arpanet --- gatekeeper\n```\n' > /tmp/eg-bad.md
pnpm exec tsx src/cli.ts diagrams lint /tmp/eg-bad.md /tmp/networks-book.pdf 37 60; echo "exit=$?"
```
Expected: `✗ ungrounded edges (not stated in chapter prose): Arpanet—gatekeeper` and `exit=1`, with NO "ungrounded node labels" line (both words occur in the chapter as whole words). If by chance the prose connects that exact pair, swap in another pair of clearly-unrelated in-chapter terms (e.g. `Internet --- histogram`).

A clean single-letter graph still passes (edges skipped, nodes exempt, ≤8 nodes):
```bash
printf '```mermaid\ngraph LR\n  A --- B\n  B --- C\n```\n' > /tmp/eg-ok.md
pnpm exec tsx src/cli.ts diagrams lint /tmp/eg-ok.md /tmp/networks-book.pdf 37 60; echo "exit=$?"
```
Expected: `✓ all diagram node labels and edges are grounded in the chapter text` and `exit=0`.

- [ ] **Step 7: Commit**

```bash
git add src/cli.ts
git commit -m "feat(cli): diagrams lint enforces prose-grounded edges"
```

---

## Task 5: Agent policy + skill wiring

**Files:**
- Modify: `.claude/agents/book-analyst.md`, `.claude/skills/tutor-prep/SKILL.md`

- [ ] **Step 1: Add the edge rule to `book-analyst` rule 1a**

In `.claude/agents/book-analyst.md`, replace this exact sentence (the last line of rule 1a):
```
   The location pointer (rule 1) is ALWAYS present, even when you inline a visual. If you are not certain the structure/values are in the text, do not draw — point to the page. A deterministic lint will reject any mermaid node label that is not present in the chapter text, **and will reject any graph with more than 8 nodes** — a graph that big is a real/large enumerated network whose edges are not in the prose, so point to the page instead of drawing it.
```
with:
```
   The location pointer (rule 1) is ALWAYS present, even when you inline a visual. If you are not certain the structure/values are in the text, do not draw — point to the page. **Draw only edges the chapter text actually asserts** (e.g. "X is connected/joined/linked/adjacent to Y") — never infer an edge from an image you could not read. A deterministic lint will reject any mermaid node label that is not present in the chapter text, **any named edge not stated in the prose**, **and any graph with more than 8 nodes** — a graph that big is a real/large enumerated network whose edges are not in the prose, so point to the page instead of drawing it. When the lint rejects a block, the whole diagram is dropped to a location pointer.
```

- [ ] **Step 2: Broaden the `/tutor-prep` re-dispatch wording**

In `.claude/skills/tutor-prep/SKILL.md`, replace this exact text:
```
If it exits non-zero (ungrounded node labels), the analyst invented a diagram. Re-dispatch the same chapter once telling the analyst to remove the offending ` ```mermaid ` block(s) and keep only the location pointer. If it still fails, leave the pointer and drop the block manually.
```
with:
```
If it exits non-zero (ungrounded node labels, ungrounded edges, or an over-cap graph), the analyst inlined a diagram it should not have. Re-dispatch the same chapter once telling the analyst to remove the offending ` ```mermaid ` block(s) and keep only the location pointer. If it still fails, leave the pointer and drop the block manually.
```

- [ ] **Step 3: Verify the edits landed**

Run: `grep -n "Draw only edges the chapter text actually asserts" .claude/agents/book-analyst.md && grep -n "ungrounded edges, or an over-cap graph" .claude/skills/tutor-prep/SKILL.md`
Expected: one match in each.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/book-analyst.md .claude/skills/tutor-prep/SKILL.md
git commit -m "feat(book-analyst,tutor-prep): edge-grounding policy + lint-fail wiring"
```

---

## Final verification (after all tasks)

- [ ] `pnpm typecheck` clean.
- [ ] `pnpm test` — all suites pass (was 63; +7 new = 70: node-lint word-boundary 1, splitSentences 2, edge-lint 4).
- [ ] Manual end-to-end: re-dispatch `book-analyst` on networks-book Ch.2 (pp.37-60, output to a temp path) with the updated policy; confirm any inlined small named graph's edges pass `diagrams lint`, and that an artificially-inserted unstated edge (`Arpanet --- gatekeeper`) is rejected on the edges line.

---

## Self-Review

**1. Spec coverage:**
- Deterministic named-edge check (same-sentence + cue) → Task 3 (`lintEdgesAgainstText` + `CONNECTION_CUE_RE`). ✓
- Named endpoints only; single-letter edges exempt → Task 3 (`isVerifiableLabel` guard, skip). ✓
- Both endpoints resolved id→label → Task 3 (`labelOf`). ✓
- Whole-graph → pointer on any ungrounded edge → Task 4 (block-level collection, exit 1) + Task 5 (re-dispatch wording). ✓
- Wired into `diagrams lint`, third `✗` line, reuse `/tutor-prep` flow → Task 4 + Task 5. ✓
- Word-boundary node-lint refinement (shared helper) → Task 1. ✓
- `splitSentences` whitespace-normalize then split → Task 2. ✓
- Exclude bare "between"; cue list → Task 3 (`CONNECTION_CUE_RE`). ✓
- Agent policy "draw only prose-stated edges" → Task 5. ✓
- No cap relaxation / no new dependency → nothing added; cap untouched. ✓
- Error handling (unparseable→no edges→pass; abstract→pass; pdftotext error) → inherent in Task 3 logic + existing CLI path. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; every command states expected output. ✓

**3. Type consistency:** `EdgeLintResult { ok; ungrounded }` defined in Task 3 and consumed in Task 4 via `.ungrounded`. `isVerifiableLabel`, `textHasTerm`, `escapeRegExp`, `splitSentences`, `CONNECTION_CUE_RE`, `lintEdgesAgainstText`, `lintNodesAgainstText`, `exceedsNodeCap`, `MAX_GRAPH_NODES` names are identical across tasks, tests, and CLI. The em-dash separator `—` matches between the edge-lint output (Task 3) and the test expectations (Task 3 Step 1). ✓
