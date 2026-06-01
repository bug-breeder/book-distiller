# Edge-Grounding — Design

**Date:** 2026-06-01
**Status:** Approved (brainstorming) — pending implementation plan
**Extends:** the grounded-visualizations feature (`2026-06-01-grounded-visualizations-design.md`). Builds on `src/diagrams/{parse,lint}.ts`, the `diagrams lint` CLI, the node-label lint, and the ≤8-node cap.

## Context & motivation

The grounded-visualizations feature can inline a small `mermaid` graph into a lesson note, and it deterministically guards two things: every *named* node label must appear in the chapter text (`lintNodesAgainstText`), and the graph must have ≤ 8 nodes (`exceedsNodeCap`). But it guards **nothing about the edges** — a figure's edges live in the image, which the sandbox cannot read, so every inlined edge rests entirely on the agent's transcription.

E2E testing made this concrete and urgent. The `book-analyst` already carried a faithfulness policy in its skill ("inline only grounded structure; real/large networks → pointer only"), yet it still inlined the 13-node Arpanet **and invented its edges** (a duplicated `LINC—MIT`, a topology it could not have read). The policy did not stop it; the deterministic node-cap did. This is the project's recurring lesson: **an LLM will quietly ignore a policy that fights its priors — generation guidance is necessary but never sufficient, and needs a deterministic backstop it cannot talk past.** Edges are currently the one inlined element with no such backstop.

Edge-grounding closes that gap: a deterministic check that a drawn edge is actually *asserted by the chapter prose*, plus an agent-policy line telling the analyst to draw only prose-stated edges.

## What this is (and is not) for

This is **trust hardening**, not coverage expansion. Its deterministic teeth bite only on **named** edges (both endpoints multi-character), mirroring the node-lint's "honest limit": to verify edge `X—Y` we look for both endpoint labels near a connection cue in the prose, and single-letter abstract endpoints (`A`, `B`) are too noisy to verify ("the distance from A to B is two" is not an edge). So:

- **Named small graphs** (`MIT—BBN`, `Reciprocity—Liking`): their edges are now *verified*, not taken on faith.
- **Any inlined graph**: an invented named edge is caught and the graph drops to a page pointer.
- **Fully abstract single-letter graphs**: edges remain unverifiable — guaranteed only by policy + the size cap, exactly as today.
- **Real image-only networks** (Arpanet, high-school graph): their edges are not in the prose, so edge-grounding (correctly) keeps rejecting them. Edge-grounding does **not** make them renderable — that would require reading the figure image, which the sandbox cannot do.

## Goals

- A **deterministic** check that each *named* edge of an inlined `mermaid` graph is supported by the chapter prose.
- Wire it into `diagrams lint` so an ungrounded named edge fails the gate — reusing the existing lint-fail → re-dispatch → pointer flow in `/tutor-prep`.
- A `book-analyst` policy line: draw only edges the text actually asserts.
- A small, well-bounded improvement to the existing node-lint: **word-boundary matching** (fixes the `MIT` ⊂ `admitted` substring false-positive), shared with edge-lint.

## Non-goals

- **No cap relaxation / coverage expansion.** A fully-grounded named graph with > 8 nodes still fails the cap. Letting grounded graphs exceed the cap is a clean future follow-up, deliberately out of scope.
- **No image/vision edge extraction.** We never read the figure image; image-only networks stay pointers.
- **No verification of single-letter / abstract edges.** Unverifiable by design; they rely on policy + cap.
- **No LLM verifier pass.** A deterministic check was chosen over a second AI judgment for the guard role (reproducible, unit-testable, cannot be over-confident).
- **No new dependency.** Pure functions only.

## The match rule (the heart of this design)

A graph edge `X—Y` is **checked** iff *both* endpoint labels are *verifiable* (multi-character, not a bare single letter/number). A checked edge is **grounded** iff there exists a sentence of the chapter text that contains **both** endpoint labels (case-insensitive, on `\b` word boundaries) **and** a connection-cue word.

- **Connection cues:** `connect*`, `join*`, `edge`, `link*`, `adjacent`, `neighbo(u)r*`, `tie*`, `attached`.
  Deliberately **excludes bare `between`** — "the *distance between* A and B" must not count, while "an *edge* between A and B" already fires via `edge`.
- **Examples:**
  - ✅ `"MIT is connected to BBN and UTAH."` → grounds `MIT—BBN`, `MIT—UTAH`.
  - ❌ `"The distance from MIT to STAN is two."` (no cue) → `MIT—STAN` ungrounded.
  - Word boundary: `"admitted"` does not ground a `MIT` edge.
  - `A—B` (single-letter) is **skipped** even against unrelated text.
- **On any ungrounded checked edge:** the whole `mermaid` block fails the lint and is dropped to a location pointer (consistent with the node-label lint; a partly-wrong graph is untrustworthy as a whole).

## Architecture

```
pdftotext (existing)  ──►  chapter text
diagrams lint <note> <pdf> <start> <end>   (existing command, extended)
  per mermaid block:
    • node labels ∈ text?      (lintNodesAgainstText — existing)
    • ≤ 8 nodes?               (exceedsNodeCap        — existing)
    • named edges prose-stated? (lintEdgesAgainstText — NEW)
  any failure → exit 1 → /tutor-prep re-dispatches once → else keep pointer
book-analyst skill: "draw only edges the text asserts"  (generation half)
```

### New / changed in `src/diagrams/lint.ts` (pure, unit-tested)

- `isVerifiableLabel(label: string): boolean` — extracted shared predicate: a label is verifiable when it is **not** a bare single letter/number (the current `/^[A-Za-z0-9]$/` exemption). Reused by node-lint and edge-lint.
- `lintNodesAgainstText` — refactored to use `isVerifiableLabel` and **word-boundary** matching (`\b<label>\b`, case-insensitive, with the label **regex-escaped**) instead of raw substring. Behavior on existing tests is unchanged; the only difference is it no longer false-positives on substrings (`MIT` inside `admitted`).
- `splitSentences(text: string): string[]` — deterministic: normalize all whitespace (newlines, form-feeds, runs of spaces from `pdftotext` line-wrapping) to single spaces, then split on sentence-ending punctuation (`.?!` followed by space/end). Keeps wrapped sentences intact.
- `CONNECTION_CUE_RE` — the cue alternation above.
- `interface EdgeLintResult { ok: boolean; ungrounded: string[] }` — `ungrounded` lists offending edges as `"<fromLabel>—<toLabel>"`.
- `lintEdgesAgainstText(g: Graph, chapterText: string): EdgeLintResult` — an edge stores its endpoints as node **ids**; resolve each id to its node's **label** first. For each edge whose *both* resolved labels are verifiable, require a sentence (from `splitSentences`) containing both labels (word-boundary, regex-escaped) and a cue; otherwise push `"<fromLabel>—<toLabel>"` to `ungrounded`. Edges touching a single-letter (non-verifiable) node are skipped. Dedups `ungrounded`.

### Changed in `src/cli.ts` — `diagrams lint`

The action already collects node-label offenders and oversized blocks per `mermaid` block; it gains a third collector for ungrounded edges. After the loop, it prints up to three independent `✗` lines and exits 1 if any fired:
- `✗ ungrounded node labels (not found in chapter text): …`
- `✗ N diagram(s) exceed the 8-node cap …`
- `✗ ungrounded edges (not stated in chapter prose): MIT—UTAH, …`

Command description updated to mention edges. The PDF text is fetched once (after the no-blocks short-circuit) and reused for both node-lint and edge-lint.

### Changed in `.claude/agents/book-analyst.md`

One line added to the inline-visual policy (rule 1a): *draw only edges the chapter text actually asserts ("X is connected to Y"); never infer edges from an image you could not read. A deterministic lint rejects any named edge not stated in the prose, dropping the whole diagram to a pointer.*

### Skill wiring

Unchanged from grounded-visualizations: `/tutor-prep` already runs `diagrams lint` after a PDF-mode note and, on non-zero exit, re-dispatches the analyst once to drop the offending block and keep the pointer. Edge-lint failures flow through this existing path. The re-dispatch instruction's wording is broadened from "ungrounded node labels" to "ungrounded node labels or edges."

## Data flow

PDF → `pdftotext` → per `mermaid` block: parse → (node-label lint ∧ node-cap ∧ edge-grounding) → any failure drops the block to a pointer via the existing re-dispatch flow; markdown viewers render the surviving `mermaid`, `/tutor` renders the adjacency view.

## Error handling

- **Unparseable block** → `parseMermaidGraph` yields no edges → edge-lint trivially passes (nothing asserted), consistent with today.
- **Fully abstract graph (no named edges)** → edge-lint trivially passes; the graph still rests on policy + cap.
- **`pdftotext` unavailable** → the same clear "install poppler" error the other lint checks already surface; the gate is skipped but pointers are kept.
- **Over-rejection (heuristic false negative)** → safe: the graph drops to a page pointer. Under-rejection (false positive) is the only unsafe direction and is minimized by requiring a cue *and* both endpoints in one sentence, plus the agent policy reducing invented edges upstream.

## Testing

Pure, offline (no `pdftotext` or AI in unit tests; the edge-lint core is fed fixture text):
- `lintEdgesAgainstText`: grounds `"MIT is connected to BBN and UTAH"` → `MIT—BBN`, `MIT—UTAH`; rejects `"the distance from MIT to STAN is two"` → `MIT—STAN` ungrounded; `"admitted"` does not ground a `MIT` edge (word boundary); a single-letter edge `A—B` is skipped against unrelated text (`ok: true`).
- `lintNodesAgainstText` regression: existing 5 tests still pass under word-boundary matching; add one test that `MIT` is **not** grounded by `admitted` alone.
- `splitSentences`: a sentence wrapped across newlines stays one sentence; two sentences split on `. `.
- CLI: a fixture note with an ungrounded named edge fails `diagrams lint` (exit 1) and prints the edges line; a clean note passes.

The agent's authoring judgment is not unit-tested; edge-lint is the deterministic backstop.

## Honest limits

- **Heuristic, not a parser.** A genuinely odd phrasing may slip through or be over-rejected. Over-rejection is safe (pointer); under-rejection is rare given the cue + same-sentence requirement.
- **Single-letter / abstract edges remain unverifiable** — guaranteed only by policy + cap, exactly as the node-lint's named-label limit.
- **Sentence boundaries from `pdftotext` are approximate** (layout wrapping, captions). Normalizing whitespace before splitting mitigates the common case; residual mis-splits fall back safely.

## Future work

- **Coverage expansion:** let a fully edge-grounded graph exceed the ≤8-node cap (the cap exists only because edges were untrusted; once every edge is verified, size stops mattering). This is the natural next step the user deferred.
- **Edge-grounding for richer phrasings** (lists like "A connects to B, C, and D" are already handled by same-sentence + cue; could add explicit adjacency-list parsing if a book provides one).
