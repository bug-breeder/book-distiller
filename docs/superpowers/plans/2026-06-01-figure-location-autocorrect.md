# Figure-Location Auto-Correct Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deterministically rewrite a lesson note's figure/table page citations to match the authoritative `figures` extraction, so cited pages are correct by construction (no LLM in the repair loop).

**Architecture:** A new pure, unit-tested `correctFigurePages(noteText, figs)` in `src/figures/fix.ts` parses `**Figure/Table N.M** — p. X` citations and rewrites drifted pages (and normalizes correct-but-hedged `around p. X`) using the `FigureLoc[]` from `figuresFromPdf`. A new top-level `figures-fix <note> <pdf> <start> <end>` CLI command wraps it (read note → extract → correct → write back if changed). `/tutor-prep` runs it after `diagrams lint`.

**Tech Stack:** TypeScript (strict, ESM, NodeNext — imports use `.js`), commander, fs-extra, Vitest, poppler `pdftotext`.

**Spec:** `docs/superpowers/specs/2026-06-01-figure-location-autocorrect-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/figures/fix.ts` (new) | `correctFigurePages(noteText, figs)` → `{ text, fixes, normalized, unverified }`; types `FigureFix`/`CorrectionResult` |
| `tests/figures/fix.test.ts` (new) | unit tests for `correctFigurePages` |
| `src/cli.ts` (modify) | import `correctFigurePages`; register top-level `figures-fix <note> <pdf> <start> <end>` |
| `.claude/skills/tutor-prep/SKILL.md` (modify) | step d — run `figures-fix` after `diagrams lint` (PDF mode) |

---

## Task 1: `correctFigurePages` pure core

**Files:**
- Create: `src/figures/fix.ts`
- Test: `tests/figures/fix.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/figures/fix.test.ts`. NOTE: the separator before `p.` is an em dash `—` (U+2014), the same character the lesson-note template uses — copy it exactly (not a hyphen).
```ts
import { describe, it, expect } from 'vitest';
import { correctFigurePages } from '../../src/figures/fix.js';
import type { FigureLoc } from '../../src/figures/extract.js';

const figs: FigureLoc[] = [
  { label: 'Figure 2.1', page: 38, caption: 'two graphs' },
  { label: 'Figure 2.2', page: 39, caption: 'arpanet map' },
  { label: 'Table 3.1', page: 40, caption: 'payoff matrix' },
];

describe('correctFigurePages', () => {
  it('rewrites a drifted page to the authoritative page', () => {
    const note = '- **Figure 2.2** — p. 38 — "the arpanet"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe('- **Figure 2.2** — p. 39 — "the arpanet"');
    expect(r.fixes).toEqual([{ label: 'Figure 2.2', from: 38, to: 39 }]);
    expect(r.normalized).toEqual([]);
    expect(r.unverified).toEqual([]);
  });

  it('leaves an already-correct citation unchanged', () => {
    const note = '- **Figure 2.1** — p. 38 — "two graphs"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe(note);
    expect(r.fixes).toEqual([]);
    expect(r.normalized).toEqual([]);
  });

  it('normalizes a correct-but-hedged "around p. X" to exact', () => {
    const note = '- **Table 3.1** — around p. 40 — "payoff matrix"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe('- **Table 3.1** — p. 40 — "payoff matrix"');
    expect(r.fixes).toEqual([]);
    expect(r.normalized).toEqual(['Table 3.1']);
  });

  it('leaves a label not in the extraction untouched and reports it unverified', () => {
    const note = '- **Figure 9.9** — p. 99 — "nonexistent"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe(note);
    expect(r.fixes).toEqual([]);
    expect(r.unverified).toEqual(['Figure 9.9']);
  });

  it('is idempotent: a second pass makes no further changes', () => {
    const note = '- **Figure 2.2** — p. 38 — "x"\n- **Table 3.1** — around p. 40 — "y"';
    const once = correctFigurePages(note, figs);
    const twice = correctFigurePages(once.text, figs);
    expect(twice.text).toBe(once.text);
    expect(twice.fixes).toEqual([]);
    expect(twice.normalized).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/figures/fix.test.ts`
Expected: FAIL — cannot resolve `../../src/figures/fix.js`.

- [ ] **Step 3: Write the implementation**

Create `src/figures/fix.ts`. NOTE: the regexes and the replacement string contain an em dash `—` (U+2014) — copy it exactly.
```ts
// src/figures/fix.ts
import type { FigureLoc } from './extract.js';

export interface FigureFix {
  label: string;
  from: number;
  to: number;
}
export interface CorrectionResult {
  /** the note text with corrected page citations */
  text: string;
  /** citations whose page number was changed */
  fixes: FigureFix[];
  /** labels whose page was already correct but whose `around p.X` hedge was dropped */
  normalized: string[];
  /** cited labels not present in the extraction (left untouched) */
  unverified: string[];
}

// A figure/table page citation on a note line, e.g.
//   - **Figure 2.2** — p. 38 — "..."
//   - **Table 3.1** — around p. 97 — "..."
// Captures: 1 = label ("Figure 2.2"), 2 = cited page number. Tolerates "around ".
const CITATION_RE =
  /\*\*((?:Figure|Table)\s+\d+(?:\.\d+)?)\*\*\s*—\s*(?:around\s+)?p\.\s*(\d+)/g;
// The "— [around ]p. N" tail inside a single matched citation (for rewriting).
const TAIL_RE = /—\s*(?:around\s+)?p\.\s*\d+/;

/**
 * Rewrite each `**Figure/Table N.M** — p. X` (or `around p. X`) citation whose
 * label appears in `figs` so its page equals the authoritative page; a correct
 * but hedged `around p. X` is normalized to exact `p. X`. Citations whose label
 * is not in `figs` are left untouched and reported in `unverified`. Pure.
 */
export function correctFigurePages(noteText: string, figs: FigureLoc[]): CorrectionResult {
  const authByLabel = new Map<string, number>();
  for (const f of figs) authByLabel.set(f.label, f.page);

  const fixes: FigureFix[] = [];
  const normalized = new Set<string>();
  const unverified = new Set<string>();

  const text = noteText.replace(CITATION_RE, (match: string, label: string, pageStr: string) => {
    const auth = authByLabel.get(label);
    if (auth === undefined) {
      unverified.add(label);
      return match; // can't verify -> leave untouched
    }
    const cited = Number(pageStr);
    const hedged = /around\s+p\./i.test(match);
    if (cited === auth && !hedged) return match; // already exact, no hedge
    if (cited !== auth) fixes.push({ label, from: cited, to: auth });
    else normalized.add(label); // page already right, just drop the hedge
    return match.replace(TAIL_RE, `— p. ${auth}`);
  });

  return { text, fixes, normalized: [...normalized], unverified: [...unverified] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/figures/fix.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/figures/fix.ts tests/figures/fix.test.ts
git commit -m "feat(figures): correctFigurePages — deterministic page-citation repair"
```

---

## Task 2: `figures-fix` CLI command

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Add the import**

In `src/cli.ts`, after the existing line `import { figuresFromPdf } from './figures/extract.js';`, add:
```ts
import { correctFigurePages } from './figures/fix.js';
```

- [ ] **Step 2: Register the `figures-fix` command**

In `src/cli.ts`, the `figures` command's `.action(...)` ends with `});` (the line immediately before `const diagramsCmd = program`). Insert the following **between** the end of the `figures` command and the `const diagramsCmd = program` line:
```ts
program
  .command('figures-fix <note> <pdf> <start> <end>')
  .description("Rewrite a lesson note's figure/table page citations to match the authoritative extraction")
  .action(async (note: string, pdf: string, start: string, end: string) => {
    const s = Number(start);
    const e = Number(end);
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < s) {
      console.error('Error: <start> and <end> must be positive integers with start <= end');
      process.exit(1);
      return;
    }
    const noteAbs = path.resolve(note);
    const pdfAbs = path.resolve(pdf);
    if (!(await fs.pathExists(noteAbs))) {
      console.error(`Error: file not found: ${noteAbs}`);
      process.exit(1);
      return;
    }
    if (!(await fs.pathExists(pdfAbs))) {
      console.error(`Error: file not found: ${pdfAbs}`);
      process.exit(1);
      return;
    }
    const md = await fs.readFile(noteAbs, 'utf-8');
    const figs = await figuresFromPdf(pdfAbs, s, e);
    const { text, fixes, normalized, unverified } = correctFigurePages(md, figs);
    if (text !== md) await fs.writeFile(noteAbs, text);
    if (fixes.length === 0 && normalized.length === 0) {
      console.log(`✓ all figure/table page citations already correct (${figs.length} known)`);
      return;
    }
    const fixStr = fixes.map((f) => `${f.label} p.${f.from}→p.${f.to}`).join(', ');
    console.log(
      `✓ figures-fix: ${fixes.length} page(s) corrected` +
        (fixStr ? ` (${fixStr})` : '') +
        (normalized.length ? `; ${normalized.length} hedge(s) normalized` : '') +
        (unverified.length ? `; ${unverified.length} unverified (${unverified.join(', ')})` : ''),
    );
  });
```
(`fs` is `fs-extra`: `fs.readFile(path, 'utf-8')` returns a `string` and `fs.writeFile` is promisified. `correctFigurePages`, `figuresFromPdf`, `path`, `fs` are all already imported.)

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 4: Manual verification (uses the parsed networks-book PDF at `/tmp/networks-book.pdf`, pp.37-60; `Figure 2.2` is authoritatively p.39, `Figure 2.1` is p.38)**

Craft a note with one drifted page and one correct page (the `—` below is an em dash U+2014):
```bash
printf '%s\n%s\n' '- **Figure 2.2** — p. 99 — "drifted"' '- **Figure 2.1** — p. 38 — "ok"' > /tmp/ff-demo.md
pnpm exec tsx src/cli.ts figures-fix /tmp/ff-demo.md /tmp/networks-book.pdf 37 60
echo "--- note after fix ---"; cat /tmp/ff-demo.md
echo "--- second run (idempotent) ---"
pnpm exec tsx src/cli.ts figures-fix /tmp/ff-demo.md /tmp/networks-book.pdf 37 60
```
Expected:
- First run prints `✓ figures-fix: 1 page(s) corrected (Figure 2.2 p.99→p.39)`.
- The note now shows `- **Figure 2.2** — p. 39 — "drifted"` and `- **Figure 2.1** — p. 38 — "ok"` (unchanged).
- Second run prints `✓ all figure/table page citations already correct (14 known)`.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts
git commit -m "feat(cli): figures-fix command (deterministic figure-page repair)"
```

---

## Task 3: Wire `figures-fix` into `/tutor-prep`

**Files:**
- Modify: `.claude/skills/tutor-prep/SKILL.md`

- [ ] **Step 1: Add step d after the lint step**

In `.claude/skills/tutor-prep/SKILL.md`, the lint sub-step `c` ends with the sentence beginning `If it exits non-zero (ungrounded node labels, ungrounded edges, or an over-cap graph)…` and is followed by a blank line and then `**After all chapters:**`. Insert a new sub-step `d` between them.

Replace this exact text:
```
If it exits non-zero (ungrounded node labels, ungrounded edges, or an over-cap graph), the analyst inlined a diagram it should not have. Re-dispatch the same chapter once telling the analyst to remove the offending ` ```mermaid ` block(s) and keep only the location pointer. If it still fails, leave the pointer and drop the block manually.

**After all chapters:**
```
with this exact text:
```
If it exits non-zero (ungrounded node labels, ungrounded edges, or an over-cap graph), the analyst inlined a diagram it should not have. Re-dispatch the same chapter once telling the analyst to remove the offending ` ```mermaid ` block(s) and keep only the location pointer. If it still fails, leave the pointer and drop the block manually.

**d. Auto-correct figure page citations (PDF mode only).** After the note is written, run:
```bash
pnpm exec tsx src/cli.ts figures-fix "book-output/$0/lessons/<chapter-slug>-lesson.md" "<metadata.sourceFile>" <chapter.pageRange.start> <chapter.pageRange.end>
```
This deterministically rewrites any drifted figure/table page citation to the authoritative page (no re-dispatch — we know the exact page). Report what it corrected.

**After all chapters:**
```

- [ ] **Step 2: Verify the edit landed**

Run: `grep -n "Auto-correct figure page citations" .claude/skills/tutor-prep/SKILL.md`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/tutor-prep/SKILL.md
git commit -m "feat(tutor-prep): auto-correct figure page citations after lint"
```

---

## Final verification (after all tasks)

- [ ] `pnpm typecheck` clean.
- [ ] `pnpm test` — all suites pass (was 71; +5 new = 76).
- [ ] Manual end-to-end: take the regenerated `book-output/networks-book/lessons/chapter-03-lesson.md`, deliberately corrupt one figure page (e.g. set Figure 2.5 to `p. 99`), run `pnpm exec tsx src/cli.ts figures-fix book-output/networks-book/lessons/chapter-03-lesson.md /tmp/networks-book.pdf 37 60`, and confirm it reports the correction and rewrites the page back to the authoritative value.

---

## Self-Review

**1. Spec coverage:**
- Deterministic rewrite of drifted pages → Task 1 (`correctFigurePages` fixes) + Task 2 (CLI writes back). ✓
- `figures-fix <note> <pdf> <start> <end>` distinct top-level command → Task 2 (inserted as a `program.command`, `figures` untouched). ✓
- Hedge normalization (`around p. X` → exact) → Task 1 (`normalized`). ✓
- `unverified` (label not in extraction) reported, untouched → Task 1 + Task 2 summary. ✓
- Idempotent; write back only if changed → Task 1 (idempotent test) + Task 2 (`if (text !== md)`). ✓
- Pure core, unit-tested → Task 1 (5 tests, no I/O). ✓
- `/tutor-prep` wiring after `diagrams lint`, PDF mode → Task 3. ✓
- Arg/file/`pdftotext` error handling (shared with `figures`) → Task 2 guards + `figuresFromPdf` ENOENT message. ✓
- Exit 0 (repair, not gate) → Task 2 (no `process.exit(1)` on the repair path). ✓
- PDF-only, page-number-only, no new dependency → no EPUB path; only page digits touched; no imports added beyond `fix.js`. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full code; every command has expected output. ✓

**3. Type consistency:** `FigureFix { label, from, to }` and `CorrectionResult { text, fixes, normalized, unverified }` defined in Task 1 and destructured identically in Task 2. `correctFigurePages`, `figuresFromPdf`, `FigureLoc` names match across tasks, tests, and CLI. The em dash `—` (U+2014) is consistent between `CITATION_RE`, `TAIL_RE`, the replacement string, the tests, and the manual-verification `printf`. ✓
