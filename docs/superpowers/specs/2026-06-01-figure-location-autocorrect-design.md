# Figure-Location Auto-Correct — Design

**Date:** 2026-06-01
**Status:** Approved (brainstorming) — pending implementation plan
**Extends:** the AI-tutor lesson-note flow and the R6 "reference by location" rule. Builds on `src/figures/extract.ts` (`parseFigures`, `figuresFromPdf`, `FigureLoc`) and the deterministic-guard pattern established by `diagrams lint` / edge-grounding.

## Context & motivation

The tutor points learners to figures/tables by exact PDF page (R6). The `figures` CLI extracts the authoritative caption→page mapping deterministically, and `/tutor-prep` passes it to the `book-analyst` as an "Authoritative figure locations" block the analyst is told to use verbatim. Yet an end-to-end trial on the Networks Ch.2 note showed the analyst still **drifted on 2 of 14 figure pages** (Fig 2.2 cited p.38 vs authoritative p.39; Fig 2.3 cited p.39 vs p.40 — each off by one). Nothing caught it: node labels, edges, and the node cap are linted, but **figure-page citations have no deterministic backstop**.

This is the project's recurring lesson once more — the agent quietly ignores a contract that fights its priors, and only a deterministic check holds the line. Here the fix is the *strongest* of the family: unlike edges (where we can only say "ungrounded") or node labels (only "absent"), for a figure page **we know the exact correct answer** — it's the `figures` extraction. So instead of failing and re-dispatching an LLM to re-guess a number we already have, we **deterministically rewrite** the wrong page to the authoritative one.

## Goals

- Make a lesson note's figure/table page citations **exact by construction**: after the analyst writes a note, rewrite any drifted `p. X` to the authoritative page.
- Expose it as `figures-fix <note> <pdf> <start> <end>` — a deterministic auto-correct, no model in the loop.
- Wire it into `/tutor-prep` (PDF mode) so generated notes always cite correct pages.
- Keep the repair logic pure and unit-tested.

## Non-goals

- **No lint-and-re-dispatch.** We know the right page; an LLM retry could re-drift. (Auto-correct chosen deliberately over the `diagrams lint` re-dispatch pattern.)
- **No CI/check-only mode.** Just the fix command (a check mode is a clean future add if needed).
- **No EPUB mode.** EPUB notes cite section/heading anchors, not pages — out of scope, like the `figures` command.
- **No validation of caption text or figure content** — only the page number. *What* a figure shows is the analyst's prose; this guards only *where* it is.
- **No new dependency.**

## Behavior (the heart of this design)

`figures-fix` rewrites figure/table page citations to match the authoritative extraction. Concretely, for each citation line in the note matching `- **(Figure|Table) N.M** — p. X` (or the hedged `around p. X`):

| Case | Action |
|---|---|
| Label in extraction, cited page ≠ authoritative | **rewrite** to `p. <auth>` |
| Label in extraction, cited `around p. X` (even if X is correct) | **normalize** to exact `p. <auth>` — we know it now, the hedge is no longer warranted |
| Label in extraction, cited page == authoritative | leave unchanged |
| Label **not** in extraction (e.g. an equation cited by page) | leave unchanged; report as `unverified` |

The command is **idempotent** — a second run finds nothing to fix.

## Architecture

```
pdftotext (existing) → figuresFromPdf → FigureLoc[]   (authoritative caption→page)
figures-fix <note> <pdf> <start> <end>  (NEW, deterministic):
    correctFigurePages(noteText, figs) → { text, fixes, unverified }   (pure)
    → write note back if changed; print summary; exit 0
/tutor-prep (PDF mode): after the note is written and `diagrams lint` settles, run `figures-fix`
```

### New module — `src/figures/fix.ts` (pure, unit-tested)

```ts
import type { FigureLoc } from './extract.js';

export interface FigureFix { label: string; from: number; to: number }
export interface CorrectionResult {
  text: string;            // the note with corrected page citations
  fixes: FigureFix[];      // every citation that was rewritten
  unverified: string[];    // cited labels not present in the extraction
}

/**
 * Rewrite each `**Figure/Table N.M** — p. X` (or `around p. X`) citation whose
 * label appears in `figs` so its page equals the authoritative page. A correct
 * but hedged `around p. X` is normalized to exact `p. X`. Citations whose label
 * is not in `figs` are left untouched and reported in `unverified`. Pure.
 */
export function correctFigurePages(noteText: string, figs: FigureLoc[]): CorrectionResult;
```

Matching: a citation regex captures `(Figure|Table)`, the `N.M` number, and the page after `p.`/`around p.` on a note line. The authoritative lookup keys on the `"Figure N.M"` / `"Table N.M"` label (the same label `parseFigures` produces).

### New CLI command — `figures-fix <note> <pdf> <start> <end>` (in `src/cli.ts`)

Validates the page range (positive ints, start ≤ end) and that the note and PDF exist (same guards as `figures` / `diagrams lint`). Reads the note, runs `figuresFromPdf`, applies `correctFigurePages`, writes the note back **only if** `fixes.length > 0`, and prints a summary:

```
✓ fixed 2: Figure 2.2 p.38→p.39, Figure 2.3 p.39→p.40 (12 already correct, 0 unverified)
```
If nothing drifted: `✓ all figure/table page citations already correct (14 checked)`. Exits 0 (a repair, not a gate). A `pdftotext`-missing error surfaces the same clear "install poppler" message as the other commands.

**Why a distinct top-level command, not `figures fix`:** the existing `figures <pdf> <start> <end>` is a top-level command with positional args and is called by `/tutor-prep` and `book-analyst`. Converting `figures` into a subcommand group (`figures list` / `figures fix`) would break those callers and conflict with the positional `<pdf>`. So `figures-fix` is implemented as its own peer command; `figures` is untouched.

### Skill wiring — `/tutor-prep` (PDF mode)

After the note is written and `diagrams lint` has settled, run:
```bash
pnpm exec tsx src/cli.ts figures-fix "book-output/$0/lessons/<chapter-slug>-lesson.md" "<metadata.sourceFile>" <start> <end>
```
Deterministic; no re-dispatch. The `book-analyst` is *still* told to use the authoritative pages (generation guidance), but `figures-fix` is the backstop that makes it true.

## Data flow

PDF → `pdftotext` → `figuresFromPdf` → `FigureLoc[]`; note → `correctFigurePages(note, figs)` → corrected note written back; `/tutor-prep` invokes it after each PDF-mode note so cited pages are exact.

## Error handling

- **`pdftotext` unavailable** → clear "install poppler" error (shared with `figures`); the note is left unmodified.
- **No citations / none in extraction** → nothing rewritten; summary reports `unverified` count; exit 0.
- **Malformed citation lines** → not matched by the regex, left untouched (no crash).
- **Note unchanged** → file is not rewritten (avoids spurious diffs); idempotent.

## Testing

Unit (pure, offline — `correctFigurePages` fed fixture text + a `FigureLoc[]`):
- Corrects a wrong page (`p. 38` → `p. 39`) and records the fix.
- Leaves an already-correct citation unchanged.
- Normalizes a hedged `around p. 39` to exact `p. 39`.
- Leaves a label not in the extraction untouched and lists it in `unverified`.
- Idempotent: running on already-corrected text yields no fixes.

CLI: on a fixture note + the parsed networks-book PDF, `figures-fix` rewrites the drifted pages and prints the summary; a second run reports all-correct.

## Honest limits

- Only Figure/Table **caption** citations are verifiable (those the extraction carries). Equation or other page references are reported `unverified`, never silently "corrected."
- It guards the **page number only** — not whether the cited figure is the *right* figure for the point, nor the caption text.
- PDF-only; EPUB anchor citations are untouched.

## Future work

- A check/exit-code mode (`--check`) for CI/verification, reusing the same pure core.
- Auto-correct could also flag a cited Figure label absent from the extraction as a possible hallucinated figure (currently just `unverified`).
