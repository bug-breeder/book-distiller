# Grounded Inline Visualizations — Design

**Date:** 2026-06-01
**Status:** Approved (brainstorming) — pending implementation plan
**Extends:** the AI-tutor lesson-note flow (`2026-05-31-ai-tutor-design.md`). Builds on the deterministic `figures` command and the R6 "reference by location" rule.

## Context & motivation

The tutor points to figures/tables by their exact PDF page (R6). E2E testing surfaced *why* that rule exists: when the agent tried to produce visual detail it could not actually read, it confidently hallucinated (figure pages were off by 1–3 until a deterministic extractor replaced the guess). The user wants the tutor to feel more *visual* — diagrams in the saved notes and something visual in the live terminal — **without** reintroducing that hallucination.

The core tension: a figure's **location** lives in the text (so it can be extracted deterministically), but a figure's **content** (a network's edges, a plot's data) generally does **not** — the figure itself carries it, and PDF image rendering is unavailable in this environment. Therefore we may only render artifacts whose structure or values are **stated in the chapter text**, and we must guard even those.

A pre-checked external option (`mermaid-ascii` on npm, v1.0.0) was rejected: verified empirically to render only *directed* flowcharts — undirected edges (`---`, `<-->`), which dominate this domain, are mis-parsed into nodes, and it logs debug output to stdout.

## Goals

- Add **faithful, inline visualizations** to lesson notes for the subset of artifacts that can be grounded in the chapter text.
- Notes render real diagrams in markdown viewers (GitHub/VS Code/Obsidian) via fenced `mermaid` blocks and markdown tables.
- The live terminal tutor shows a **deterministic textual render** (node/edge adjacency view) of those diagrams — no reliance on an external ASCII renderer.
- A **deterministic guard** (node-lint) catches invented graph nodes before a note is trusted.
- Everything not groundable stays a **location pointer** (unchanged R6 behavior).

## Non-goals

- Redrawing **charts/plots** (histograms, distributions) — their data is not in the text. Point to location + "what to look for."
- Redrawing **real/large networks** (Arpanet, high-school network) — edges are not enumerated in the text. Point to location.
- Reproducing **photographs/real-world images**. Point to location.
- **Graphical** rendering inside the terminal (ASCII-art layout engines / `mermaid-ascii`). The terminal gets a textual adjacency view; graphical rendering happens in markdown viewers.
- Reading figure **images** (no OCR/vision; PDF page rendering is unavailable in-sandbox).

## Faithfulness policy (the heart of this design)

Inline a visualization **only** when its structure/values are explicit in the extracted chapter text. The agent transcribes; it never infers from an image it cannot see. Concretely:

| Artifact | Render? | How |
|---|---|---|
| Table / payoff matrix (values in text) | ✅ | markdown table |
| Small graph whose edges the prose names (≤ 8 nodes) | ⚠️ gated | `mermaid` graph (`---` undirected / `-->` directed) |
| Numbered equation | ✅ | inline from extracted text |
| Chart / plot (histogram, distribution) | ❌ | location pointer + "what to look for" |
| Real/large network, photo | ❌ | location pointer |

**Guards for the gated graph case:**
1. **Grounding (primary):** draw only when the prose states the connections, and only for **abstract illustrative examples** (the policy already forbids real/named networks — those are a non-goal). Cite the source page.
2. **Size cap:** ≤ 8 nodes (illustrative examples only).
3. **Grounding-lint (deterministic backstop, partial):** every *meaningful* node label in the `mermaid` block must appear in the extracted chapter text. A label that doesn't → the diagram is dropped and the location pointer kept.

**Honest limit of the lint:** it has teeth only for *named* labels (e.g. `Reciprocity`, `MIT`). Single-letter abstract node IDs (`A`,`B`,`C`) occur all over the text, so the lint cannot verify them — for abstract example graphs the guarantee is the *policy* (prose-stated, ≤8 nodes, cited, never a real network), not the lint. Edges always rest on the agent's transcription (there is no deterministic ground truth for them). When in doubt, the agent points to the page instead of drawing. This is why the high-confidence win is **tables/matrices** (values are concrete and checkable), with small graphs a smaller, more-caveated addition.

## Architecture

```
pdftotext (existing)
   └─ book-analyst: writes lesson note; inlines mermaid/table ONLY when grounded
        └─ diagrams CLI (NEW, deterministic):
             • lint   <note> <pdf> <start> <end>   → node labels ∈ text? (gate)
             • render <note>                       → terminal adjacency view
        └─ /tutor-prep & /tutor: run lint after prep; render in the live session
```

### New module — `src/diagrams/`

Pure, unit-testable functions plus thin CLI wrappers:

- `parseMermaidGraph(block: string): { nodes: string[]; edges: {from,to,directed}[] }`
  Parses a `graph TD|LR` block: lines `A --- B` (undirected), `A --> B` (directed), node labels `A[Label]`/`B{Label}`. Ignores unknown lines.
- `renderAdjacency(graph): string`
  Deterministic terminal view, e.g.
  `Nodes: A B C D` / `Edges: B–A, B–C, B–D (undirected)`.
- `lintNodesAgainstText(graph, chapterText): { ok: boolean; unknown: string[] }`
  Each **meaningful** node label (length ≥ 2, not a bare single letter/number) must occur in `chapterText` (from `pdftotext`). Single-letter abstract IDs are exempt by design (unverifiable; see "Honest limit of the lint"). Best-effort: the same check is applied to markdown-table cell values that are alphabetic terms.

### New CLI subcommands (in `src/cli.ts`)

- `diagrams lint <lesson-note.md> <pdf> <start> <end>`
  Extracts each `mermaid` block from the note, lints node labels against the chapter's `pdftotext` output; exits non-zero and lists offending labels if any block has unknown nodes.
- `diagrams render <lesson-note.md>`
  Prints each `mermaid` block as an adjacency view (for the live terminal); markdown tables are passed through as-is.

### Lesson-note template change

In the **Figures / Tables / Equations** section, an artifact line may be *immediately followed* by an optional grounded block:
- a fenced ` ```mermaid ` graph (gated small graph), or
- a markdown table (matrix), or
- nothing (location pointer only — the default).

The location pointer line is **always** present, even when a diagram is inlined (the real figure remains authoritative).

### Agent change — `book-analyst.md`

Add the faithfulness policy + decision table to the lesson task: when to inline (table/small-stated-graph/equation) vs. point only (chart/photo/large net), the ≤8-node cap, undirected `---`/directed `-->`, and "cite the page; never infer from an unreadable image."

### Skill changes

- `/tutor-prep` (and `/tutor` lazy-prep): after the analyst writes a PDF-mode note, run `diagrams lint`. On failure, drop the offending `mermaid` block (keep the pointer) and note it.
- `/tutor` teach step: when a concept's figure has an inline diagram, run `diagrams render` and show the adjacency view in the terminal alongside the page pointer.

## Data flow

PDF → `pdftotext` → analyst writes note (grounded inline visuals + always a pointer) → `diagrams lint` gates graphs (node labels ∈ text) → markdown viewers render `mermaid`/tables graphically; `/tutor` renders the adjacency view in the terminal.

## Error handling

- **Lint fails (unknown node):** drop that `mermaid` block, keep the location pointer, print a warning. Never ship an ungrounded diagram.
- **No groundable structure:** no diagram; pointer only (default).
- **`parseMermaidGraph` can't parse a block:** terminal renderer falls back to printing the raw block; lint treats an unparseable block as "no nodes" (passes, since nothing is asserted).
- **`pdftotext` unavailable:** `diagrams lint` errors clearly (same as the `figures` command); prep proceeds without the gate but keeps pointers.

## Testing

- Unit: `parseMermaidGraph` (undirected/directed/labels/garbage lines), `renderAdjacency` (stable output), `lintNodesAgainstText` (all-present → ok; invented node → flagged).
- Unit: CLI `diagrams lint` exit codes on a fixture note (clean note passes; note with an invented node fails).
- Offline — no `pdftotext` or AI in the unit tests (lint's pure core is fed fixture text).
- The agent's authoring judgment is not unit-tested; the node-lint is the deterministic backstop.

## Future work

- A verified terminal ASCII-art renderer (e.g., the Go `mermaid-ascii`) as a pure enhancement, if undirected support is confirmed.
- Optional edge-grounding heuristics (parse "A connected to B, C" prose) to harden the one remaining trust point.
