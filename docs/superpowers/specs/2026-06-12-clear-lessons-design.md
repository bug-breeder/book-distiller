# Clear, Not-Vague Lessons — Design

**Goal:** Upgrade Study Mate's content-generation **flow** so every concept it produces is concrete and self-explaining — a learner reading it cold actually understands the idea — instead of a terse, vague summary. The fix lives at the single source (the lesson note), so both the live `/tutor` and the static interactive book improve from one change.

**Status:** Approved (2026-06-12). Supersedes nothing; extends the existing tutor-prep → interactive pipeline.

---

## Problem

Today each concept in a lesson note (and therefore each concept page in the interactive book) is a *crib sheet*, not teaching:

- one definitional `**Explanation:**` paragraph (2–4 terse sentences, written as the live tutor's opening script), then
- `Why it matters` / `Check` / `Misconception` / `Application` callouts.

That shape exists because the note was designed as **prep for the live AI tutor**, which elaborates aloud in real time. But the **interactive book is static** — whatever is in the note *is* what the learner gets, with no elaboration. So the book reads as a summary, and because the concepts are disconnected bullet-blocks with no motivation or worked steps, it also reads as "written randomly."

The user's bar: *"when you create the lesson, ensure the lesson is not vague and easy for a learner to understand,"* and *"update the flow, not only the generated lesson."* So the primary deliverable is the **generation flow**, not a one-off edit of the 5 existing notes.

## Locked decisions

1. **Fix at the source (the lesson note).** One change improves the tutor *and* the book. No book-only teaching layer.
2. **Concrete visible summary.** The always-visible `**Explanation:**` must carry a concrete anchor (a named quantity, a one-line concrete example, or the core intuition). No bare definitions, no filler.
3. **Required `#### Dig deeper` block per concept**, collapsed by default in the book, containing **intuition (the "why") + a fully worked example** (every number/term shown) for any concept that has a formula or procedure. "Connection to other concepts" is **encouraged, not required**.
4. **Reinforcement layer unchanged.** `Why it matters` / `Check` / `Misconception` / `Application` stay exactly as today.
5. **Plain-text math only** in summaries and Dig-deeper (`2pq`, `4/9`, `5 < 8`) — the site renders prose as MDX with no KaTeX for body text, and `mdxText` escaping makes inequalities/braces safe.
6. **networks-book is fully regenerated through the upgraded flow** as the end-to-end proof (not surgically patched), with visuals re-anchored only where concept names drift.
7. **One spec, one plan.**

---

## Component 1 — Lesson-note template (`.claude/skills/tutor-prep/lesson-note-template.md`)

Redefine the per-concept block. The `## Concepts` section's `### Cn — <name>` entry becomes:

```
### C2 — Measuring Homophily
- **Explanation:** <ONE concrete paragraph. Must contain a concrete anchor:
  a named quantity, a one-line concrete example, or the core intuition stated
  plainly. State what the thing IS and how you'd recognize/compute it — never a
  bare textbook definition.>
- **Why it matters:** <1–2 sentences — unchanged>
- **Check:** <question> — **Ideal answer:** <answer>   (unchanged)
- **Misconception:** <one sentence — unchanged>
- **Application:** <one concrete real use — OMIT if none; unchanged>

#### Dig deeper
**Intuition:** <plain-English WHY the mechanism works / why the formula has the
shape it does — the mental model, not a restatement of the summary.>

**Worked example:** <a fully stepped example with every number and term shown.
Required whenever the concept has any formula or procedure. Use the chapter's
own example when it has one.>
```

Authoring rules added to the template:

- **The `#### Dig deeper` block is required for every concept.** Use the literal heading `#### Dig deeper`.
- Write Dig-deeper content **left-aligned** (no leading indentation) so MDX does not treat it as a code block. Use `**bold:**` mini-labels (`**Intuition:**`, `**Worked example:**`), not deeper headings.
- Plain-text math only (`2pq`, `4/9`, `5 < 8`). No `$…$`.
- **Banned vagueness** — do not use filler that asserts importance without substance: *"plays a key role", "plays an important role", "is important", "is crucial", "is essential", "various", "a number of", "in many ways", "as we will see", "it is interesting", "fundamental concept", "key concept"*. Replace with the specific fact.
- **Self-review checklist** (the analyst confirms before returning): every `Explanation` has a concrete anchor; every concept has a `#### Dig deeper`; every concept with a formula/procedure has a numeric worked example; no banned phrase appears.

## Component 2 — `book-analyst` agent (`.claude/agents/book-analyst.md`)

Add a "Clarity rules (lesson task)" subsection mirroring the template: concrete `Explanation`, required `#### Dig deeper` (intuition + worked example), plain-text math, banned-phrase list, and the self-review checklist run before the agent emits its `✓ … done` line. No change to PDF/EPUB extraction, figure-location, or `## Visualizations`/`## Figures`/`## Review items` rules.

## Component 3 — Parser (`src/interactive/parse.ts`, `src/interactive/types.ts`)

- `types.ts`: add `digDeeper?: string;` to `interface Concept`.
- `parse.ts` `parseConcepts`: while inside a concept, on a line matching `/^####\s+dig deeper/i`, enter capture mode and accumulate **raw** subsequent lines (preserving blank lines and markdown) until a terminator: the next `/^###\s/` (new concept), `/^##\s/` (next section), or another `/^####\s/`. On a terminator, flush the joined-and-trimmed text to `current.digDeeper`, then process the terminator normally (the existing `^##\s+` break still fires for `## Figures`). Defensive dedent: strip a uniform leading 4-space/tab indent from captured lines if present. Existing bullet matchers are skipped while capturing (Dig-deeper list items start with `- ` but never `- **Explanation:**` etc., so they would be ignored anyway; capture mode keeps them).

`#### Dig deeper` does not match `/^##\s+/` (the char after `##` is `#`, not whitespace), so it never trips the section-break — confirmed against the current loop.

## Component 4 — Generator (`src/interactive/generate.ts`)

- New `<DigDeeper>` emit in `renderConcept`, placed **after** the figure/sim block and **before** the `Why` callout:
  ```ts
  if (concept.digDeeper) {
    parts.push(`<DigDeeper>\n\n${mdxText(concept.digDeeper)}\n\n</DigDeeper>`);
  }
  ```
  The content is emitted as MDX children (so markdown — bold, lists, paragraphs — renders), with `mdxText` escaping `< > { } &` so worked-example inequalities/braces cannot break the build. Final render order per concept: heading → concrete summary → GraphFigure → BookFigure → Sim → **DigDeeper** → Why → Check → Misconception → Application.

## Component 5 — `DigDeeper` MDX component

- `interactive-book/src/components/DigDeeper.tsx`: a collapsed-by-default disclosure.
  ```tsx
  import React from 'react';
  export default function DigDeeper({
    title = 'Dig deeper',
    children,
  }: { title?: string; children: React.ReactNode }) {
    return (
      <details className="digDeeper">
        <summary className="digDeeper__summary">{title}</summary>
        <div className="digDeeper__body">{children}</div>
      </details>
    );
  }
  ```
- Register globally in `interactive-book/src/theme/MDXComponents.tsx` (alongside `Callout`, `Check`, …).
- Styling appended to `interactive-book/src/css/custom.css` (`.digDeeper` card border + padding, `.digDeeper__summary` cursor/weight, dark-mode via the existing `[data-theme='dark']` selectors). Must read well in both themes.

## Component 6 — `study-mate lint-lessons <slug>` (advisory clarity gate)

New CLI command in `src/cli.ts` backed by `src/interactive/parse.ts` + a small `src/lessons/clarity.ts` checker. Reads `book-output/<slug>/lessons/*.md`, parses concepts, and reports per concept:

- **error** — concept has no `#### Dig deeper` block (structural miss).
- **warning** — `digDeeper` shorter than 40 words; a banned filler phrase appears in `explanation` or `digDeeper`.

Exit code: non-zero if any **error**; zero (with a printed warning count) otherwise. Hard build gates remain `tsc` + `pnpm build`; this is the clarity-specific check, wired into the `/tutor-prep` flow as a final step (advisory) and runnable standalone.

## Component 7 — `/tutor-prep` skill (`.claude/skills/tutor-prep/SKILL.md`)

Add a final step after a chapter's note is written (all modes): run `pnpm exec tsx src/cli.ts lint-lessons <slug>` for the processed chapter(s); on an **error** (missing Dig deeper), re-dispatch that chapter once telling the analyst to add the missing block. No change to chapter selection, figure-location, or diagram-lint steps.

## Component 8 — `/tutor` skill

No required change — `/tutor` reads the same notes and improves for free. Add one sentence noting the `#### Dig deeper` block holds the worked example/intuition the tutor can lean on when a learner is stuck. (Optional, low-touch.)

---

## networks-book regeneration (end-to-end proof)

1. Delete `book-output/networks-book/lessons/*.md` and re-run `/tutor-prep networks-book` → fresh notes with concrete summaries + Dig deeper, produced by the upgraded flow.
2. **Reconcile concept names.** Diff the regenerated concept names against the existing `interactive-book/src/sims/networks-book/manifest.json` `concept` fields and the `| concept:` figure tags:
   - Names that **match** → existing sims/figures still anchor; keep them (preserves hand-polished sims).
   - Names that **drifted** → re-run `/visualize networks-book <N>` for the affected chapters (re-authors + re-anchors those sims) and verify the regenerated `| concept:` figure tags match.
3. Run `study-mate extract-figures networks-book`, then `study-mate interactive networks-book`, then `cd interactive-book && pnpm build`.
4. `study-mate lint-lessons networks-book` reports zero errors.

## Testing

- `tests/interactive/parse.test.ts` (or existing parse test): a concept with a multi-paragraph `#### Dig deeper` (including a `- ` list and a `5 < 8` inequality) parses into `concept.digDeeper` with content preserved and the terminator (`## Figures`) respected.
- `tests/lessons/clarity.test.ts`: missing Dig deeper → error; short Dig deeper → warning; banned phrase → warning; clean concept → no findings.
- Generator: a concept with `digDeeper` emits a `<DigDeeper>` block in the right position; a concept without it emits none (back-compat).
- Render gate: `pnpm build` succeeds for the regenerated networks-book.

## Out of scope (YAGNI)

- No KaTeX/math rendering for prose (plain-text math is sufficient and matches current notes).
- No automatic "concrete-anchor" detector in the lint (too noisy); the anchor rule is enforced by the analyst's self-review, not deterministically.
- No change to sim authoring, figure extraction, GraphFigure specs, or the progress/flashcard formats.
- No new book parsing or chapter-selection behavior.

## Acceptance criteria

- The template + agent require and document the concrete summary + `#### Dig deeper` (intuition + worked example) + banned-vagueness list + self-review.
- `parse.ts` populates `Concept.digDeeper`; `generate.ts` renders `<DigDeeper>` collapsed by default in the correct position; `pnpm build` passes.
- `study-mate lint-lessons networks-book` exits zero (no missing Dig deeper).
- networks-book ch1–5 regenerated through the upgraded flow; sims/figures re-anchored where names drifted; build green; the rendered pages show a concrete summary and a working "Dig deeper" disclosure per concept.
- All new/changed tests pass; root `pnpm typecheck` and app `tsc` clean.
