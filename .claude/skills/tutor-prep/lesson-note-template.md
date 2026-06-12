---
chapter: {N}
title: "{CHAPTER TITLE}"
source: { type: pdf, pages: "{START-END}" }   # EPUB instead: { type: epub, anchor: "{file-or-heading}" }
---

## Teaching arc
A numbered list of the concepts to teach, in teaching order. Each line:
`N. <concept name> — <one-line learning objective>`
Aim for 3–7 concepts. This is the lesson plan the tutor follows top to bottom.

## Concepts

### C1 — <concept name>
- **Explanation:** 2–4 sentences, plain English, concrete. This is the tutor's opening script — no jargon dumps.
- **Why it matters:** 1–2 sentences.
- **Check:** one question that proves understanding (not recall). — **Ideal answer:** <answer>
- **Misconception:** the single most common wrong mental model, in one sentence.
- **Application:** one concrete real-life use. OMIT THIS LINE ENTIRELY if the chapter offers no genuine application — never invent one.

(Repeat `### C2`, `### C3`, … for every concept in the teaching arc.)

## Figures / Tables / Equations
Every figure, table, diagram, or key equation the chapter uses to make a point. One per line:
`- **<label>** — <location> — "<what it shows / what to look for>"`
- PDF location: a page number, e.g. `p. 97`. Write `around p. 97` if you are not certain.
- EPUB location: a section/heading anchor, e.g. `§3.4` or the nearest heading text.
If the chapter has none, write `- (none)`.

**Embed the REAL figure (don't just cite it).** For a figure you can't faithfully recreate as a `## Visualizations` `<GraphFigure>` — a **large/real network** (the karate club, a co-authorship graph), a **chart/plot**, a **map**, a **photo**, or a **multi-panel** figure — but that is genuinely worth seeing, append a concept tag so the build extracts the real image from the PDF and embeds it inline next to that concept:
`- **Figure 3.13** — p. 85 — "<caption — reader-facing prose>" | concept: Graph Partitioning and Betweenness`
- The `concept:` value MUST exactly match a `### Cn — <name>` concept name (else the image lands in an "Explore" section).
- Tag only PDF figures (`Figure N.M`), and only ones that materially help — don't tag every figure. Write the caption as reader-facing prose ("what to look for"), not an instruction to yourself.
- Figures you DID recreate as a `<GraphFigure>` don't need a tag; the small triangles/bridges/etc. belong in `## Visualizations`. Tables you inline as markdown and equations stay untagged.
- Extraction runs via `study-mate extract-figures <slug>` (PyMuPDF). Untagged figure lines are still useful page pointers but are not embedded.

**Optional inline visual (faithful only).** Immediately under an artifact's line you MAY add a grounded rendering — but ONLY when its structure/values are stated in the chapter text. The location pointer above stays either way.
- A **small graph** the prose actually describes (≤ 8 nodes) → a fenced ` ```mermaid ` block (`A --- B` undirected, `A --> B` directed). Use the real node names when the text names them.
- A **table / payoff matrix** whose values are in the text → a markdown table.
- A **numbered equation** → render it inline from the text.
Do NOT inline charts/plots, real/large networks, or photographs — point to their page only.

## Visualizations
Faithful inline figures the lesson **renders itself** as interactive `<GraphFigure>` diagrams — NOT page citations. This is what turns a lesson from walls of text into something visual, so prefer creating a figure over describing a diagram in prose. Author one for every concept whose idea is fundamentally a small graph: triangles, triadic closure (before/after an edge forms), bridges, clusters/communities, signed (+/−) relationships, bipartite affiliations, short cycles, brokers spanning structural holes.

One fenced-free block per figure (the heading is pipe-delimited like the review items):

```
### <figure title> | concept: <exact concept name> | layout: <force|circle>
caption: <one line — what the reader should see and take away>
note: <optional grounding line shown under the figure>
nodes: <comma list of  id[@group][:Label]>
edges: <comma list of  src-tgt [kind] [(annotation)]>
```

- **concept:** MUST exactly match a `### Cn — <name>` concept name — the figure renders right after that concept. Omit it to drop the figure into an "Explore" section at the end.
- **layout:** `circle` pins nodes evenly on a ring (best for triangles, 4-node complete graphs, a single cycle, bipartite sets); `force` (default) spreads clusters apart (best for communities, bridges, structural holes).
- **nodes:** `A` (id only) · `A@1` (colour group 1 — use one index per community/type) · `A@1:Anna` (group + display label). Keep ids short (single letters or numbers); use labels for named people/foci.
- **edges:** `A-B` (plain) plus an optional kind — `strong`, `weak` (thin dashed), `bridge` (gold), `new` (dashed — the edge that just/should form), `dim` (faded/removed), `positive` (green, friend +), `negative` (red dashed, enemy −) — and an optional annotation in parens: `5-7 bridge (25)`, `A-B positive (+)`.
- Keep each figure ≤ ~12 nodes and **faithful**: draw only structure the chapter actually states. Skip charts/plots, photographs, and large real datasets — those stay as page pointers under `## Figures / Tables / Equations`.

## Review items
Active-recall Q/A pairs for the spaced-repetition deck. One per line, EXACTLY this pipe format so the CLI can parse it:
`- id: c<concept#>-q<n> | concept: <concept name> | Q: <question> | A: <answer>`
Each line MUST begin with `- ` (a hyphen and a space) — the progress CLI only reads lines under this heading that start with `-`.
The `concept` value MUST be the concept's NAME (the same wording as in the `### Cn — <name>` heading and the Teaching arc), NOT the `Cn` label — the tutor matches your reported gaps against this name to resurface weak spots sooner.
Provide 1–2 per concept. Every `id` must be unique within this file.
