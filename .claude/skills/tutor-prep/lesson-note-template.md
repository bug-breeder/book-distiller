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

**Optional inline visual (faithful only).** Immediately under an artifact's line you MAY add a grounded rendering — but ONLY when its structure/values are stated in the chapter text. The location pointer above stays either way.
- A **small graph** the prose actually describes (≤ 8 nodes) → a fenced ` ```mermaid ` block (`A --- B` undirected, `A --> B` directed). Use the real node names when the text names them.
- A **table / payoff matrix** whose values are in the text → a markdown table.
- A **numbered equation** → render it inline from the text.
Do NOT inline charts/plots, real/large networks, or photographs — point to their page only.

## Review items
Active-recall Q/A pairs for the spaced-repetition deck. One per line, EXACTLY this pipe format so the CLI can parse it:
`- id: c<concept#>-q<n> | concept: <concept name> | Q: <question> | A: <answer>`
Each line MUST begin with `- ` (a hyphen and a space) — the progress CLI only reads lines under this heading that start with `-`.
The `concept` value MUST be the concept's NAME (the same wording as in the `### Cn — <name>` heading and the Teaching arc), NOT the `Cn` label — the tutor matches your reported gaps against this name to resurface weak spots sooner.
Provide 1–2 per concept. Every `id` must be unique within this file.
