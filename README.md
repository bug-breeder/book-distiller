# Study Mate

**Study Mate** turns any PDF or EPUB into a personal study partner. It teaches the book concept-by-concept, makes you explain it back (Feynman-style), quizzes you with spaced repetition until it sticks — and builds an **interactive web book** with hands-on simulations for every concept. Built for ADHD-friendly, bite-sized, low-friction learning.

Runs entirely inside [Claude Code](https://claude.ai/code) — **no Anthropic API key needed**. All AI work happens in your current session.

## How it works

1. **Parse** — a TypeScript CLI extracts chapters from your book into structured markdown files
2. **Prep** — `/tutor-prep` dispatches one AI agent per chapter to distill each into a *lesson note*: a teaching arc, concept explanations that genuinely teach (each with a concrete summary **and** a "Dig deeper" intuition + worked example), figure pointers, grounded inline diagrams/tables, declarative graph figures, and review Q&A pairs
3. **Visualize** *(optional)* — `/visualize` dispatches one AI agent per chapter to author a self-contained, interactive React simulation for each concept (D3 / Three / Matter / Recharts / KaTeX / …)
4. **Tutor** — `/tutor` runs a live session: spaced reviews first, then concept-by-concept teaching with figure references, then a Feynman handoff (a `curious-student` subagent probes your explanation), and finally a gap report + progress update
5. **Build the interactive book** *(optional)* — `study-mate interactive <slug>` turns the lesson notes + sims into a [Docusaurus](https://docusaurus.io/) site you can read in a browser
6. **Track** — a deterministic `progress` CLI manages `progress.json`: mastery status, spaced-repetition queue, session log

The CLI (parse / progress / figures / diagrams / interactive / lint) does **zero** AI work — it's pure, fully-tested TypeScript. All intelligence lives in the Claude Code skills.

## Prerequisites

- [Claude Code](https://claude.ai/code)
- Node.js 18+
- pnpm (`npm install -g pnpm`), then `pnpm install`
- **Optional:** [poppler](https://poppler.freedesktop.org/) (`brew install poppler`) — needed for PDF figure/diagram grounding during `/tutor-prep`. EPUBs and progress tracking work without it.
- **Optional:** Python 3 + [PyMuPDF](https://pymupdf.readthedocs.io/) (`pip install pymupdf`) — only needed to crop real figure images from a PDF for the interactive book (`extract-figures`).

## Quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Parse a book (inside Claude Code)
/parse-book ~/Books/deep-work.epub

# 3. Distill chapters into tutor lesson notes
/tutor-prep deep-work

# 4a. Learn it live with the AI tutor
/tutor deep-work

# 4b. …or author interactive sims, then build the browser book
/visualize deep-work
study-mate extract-figures deep-work      # if any figures are tagged for extraction
study-mate interactive deep-work
cd interactive-book && pnpm install && pnpm start

# 5. Check status of all books
/book-status
```

> `study-mate <cmd>` is shorthand for `pnpm exec tsx src/cli.ts <cmd>`.

Or use the CLI directly (no AI):

```bash
pnpm exec tsx src/cli.ts parse ~/Books/deep-work.epub
pnpm exec tsx src/cli.ts progress show deep-work
pnpm exec tsx src/cli.ts progress due deep-work
pnpm exec tsx src/cli.ts progress record deep-work --id c1-q1 --result pass
pnpm exec tsx src/cli.ts progress advance deep-work --chapter 1 --status mastered --gaps "concept X was fuzzy"
pnpm exec tsx src/cli.ts lint-lessons deep-work     # clarity check on lesson notes
pnpm exec tsx src/cli.ts interactive deep-work       # generate the Docusaurus book
```

## Skills

| Skill | Arguments | Purpose |
|---|---|---|
| `/parse-book` | `<path/to/book.epub\|pdf>` | Parse a book into raw chapters |
| `/tutor-prep` | `<book-slug> [chapter-N]` | Distill chapters into tutor lesson notes (all or one) |
| `/visualize` | `<book-slug> [chapter-N]` | Author an interactive React sim per concept (after `/tutor-prep`) |
| `/tutor` | `<book-slug>` | Live AI tutoring session: teach + Feynman + progress |
| `/book-status` | — | Show all books and their tutoring progress |

## Output structure

```
book-output/                       # git-ignored — generated content stays local
└── deep-work/
    ├── metadata.json              # Title, author, chapter index
    ├── raw-chapters/
    │   ├── chapter-01.md
    │   └── chapter-N.md
    ├── lessons/
    │   ├── chapter-01-lesson.md   # Teaching arc, concepts (+ Dig deeper), figures, visualizations, review Q&A
    │   └── chapter-N-lesson.md
    ├── figures/                   # PNGs cropped from the source PDF (when figures are tagged)
    └── progress.json              # Mastery status, spaced-repetition queue, session log
```

## Lesson notes — built to teach, not to summarize

Each chapter lesson note (written by the `book-analyst` agent following `lesson-note-template.md`) is the single source the tutor *and* the interactive book read from. It contains:

- **Teaching arc** — the ordered list of concepts to cover, each with a one-line learning objective
- **Concepts** — for each concept:
  - **Explanation** — the concrete, visible summary a learner reads first. It must carry a real anchor (a named quantity, a one-line concrete example, or the core intuition stated plainly) — never a bare textbook definition.
  - **Dig deeper** *(required)* — a collapsible block with the **intuition** (why the mechanism/formula works, not a restatement) and a **worked example** (every number and term shown). In the browser book this renders as a `<DigDeeper>` disclosure, collapsed by default.
  - **Why it matters**, a **Check** question + ideal answer, the most common **Misconception**, and (only when genuine) a real-life **Application**.
- **Figures / Tables / Equations** — every visual or key equation referenced by location (PDF page or EPUB anchor). A figure the lesson can't faithfully redraw (a large real network, a chart, a map, a photo) can be tagged `| concept: <name>` so `extract-figures` crops the real image and the book embeds it inline.
- **Visualizations** — compact, declarative graph specs (nodes/edges) the lesson *renders itself* as `<GraphFigure>` diagrams next to the concept they illustrate, rather than citing a page.
- **Review items** — active-recall Q&A pairs in the spaced-repetition format the `progress` CLI parses.

### Quality gates (deterministic, no AI)

Inline content is guarded so nothing is hallucinated and nothing is vague:

- **`lint-lessons`** — clarity check: a concept with **no `#### Dig deeper`** block is an error (re-dispatched once during `/tutor-prep`); a too-short Dig deeper or banned vague filler ("plays a key role", "is important", "various", …) is a warning. Source: `src/lessons/clarity.ts`.
- **`diagrams lint`** — every node label and named edge of an inlined `mermaid` graph must appear in the chapter text; ungrounded or oversized graphs drop back to a plain location pointer.
- **`figures-fix`** — figure/table page citations are rewritten to match the authoritative `pdftotext` extraction, so cited pages are exact by construction.
- **`lint-sims`** — generated sim components may only import from the viz allowlist and may not use banned APIs.

The first three run automatically inside `/tutor-prep` (PDF mode); `lint-sims` runs inside `/visualize` and `interactive`.

## The interactive book

`study-mate interactive <slug>` turns lesson notes into a Docusaurus site under `interactive-book/`:

- Each concept's **Explanation** renders as visible prose, its **Dig deeper** as a collapsible `<DigDeeper>`.
- **Visualizations** become inline `<GraphFigure>` diagrams; tagged source figures become inline `<BookFigure>` images.
- Concepts that have a sim (authored by `/visualize`) get a live, interactive component mounted through `<SimHost>` (responsive, themed, seeded).

Sims are inline React components using any **allowlisted** library — D3, Three, Matter, Anime, Math.js, Recharts, KaTeX, … — gated by `lint-sims` (tsc + lint per sim) with `pnpm build` as the final render gate. Use `study-mate add-viz-lib <pkg>` to install a new library and add it to `interactive-book/viz-allowlist.json`.

```bash
study-mate interactive deep-work
cd interactive-book && pnpm install && pnpm start   # or: pnpm build
```

Generated `interactive-book/docs/` and `static/figures/` are git-ignored; the site infrastructure and the tracked sims (`interactive-book/src/sims/`) are committed.

## Progress tracking

The `progress` CLI manages `progress.json` with no AI involvement:

- `due <slug>` — list review items due today (JSON)
- `record <slug> --id <id> --result pass|fail` — reschedule an item after review
- `advance <slug> --chapter N --status mastered|in_progress --gaps "..."` — record chapter outcome, enqueue review items, bump current chapter
- `show <slug>` — human-readable summary: mastered/total, current chapter, reviews due

## Architecture

```
src/
├── parser/
│   ├── index.ts            # Format detection — routes .epub / .pdf
│   ├── epub-parser.ts      # epub2 + TOC-based chapter splitting
│   ├── pdf-parser.ts       # pdfjs-dist + heading/page-based splitting
│   ├── chapter-splitter.ts # Regex detection for chapter headings
│   └── types.ts            # Shared TypeScript types
├── progress/
│   ├── types.ts            # Progress, ReviewItem, ChapterProgress types
│   ├── schedule.ts         # Spaced-repetition scheduler (pure functions)
│   ├── lessonNotes.ts      # Review-item parser for lesson note files
│   ├── store.ts            # Load/save progress.json
│   └── commands.ts         # due / record / advance / show command logic
├── lessons/
│   └── clarity.ts          # lint-lessons: concrete-explanation + required Dig deeper checks
├── figures/
│   ├── extract.ts          # pdftotext → authoritative figure/table → page map
│   ├── fix.ts              # deterministically rewrite drifted page citations
│   └── images.ts           # crop real figure images from the PDF (PyMuPDF helper)
├── diagrams/
│   ├── extract.ts          # pull ```mermaid``` blocks from a lesson note
│   ├── parse.ts            # parse a mermaid graph into nodes + edges
│   ├── render.ts           # adjacency view for the live terminal
│   └── lint.ts             # ground node labels + edges against chapter text
├── interactive/
│   ├── types.ts            # Lesson / Concept (incl. digDeeper) model
│   ├── parse.ts            # structure a lesson note into the model
│   └── generate.ts         # emit MDX + _meta.json (DigDeeper, GraphFigure, SimHost, BookFigure)
├── viz/
│   ├── allowlist.ts        # the sim-library allowlist + add-viz-lib logic
│   └── lint.ts             # lint-sims: off-allowlist imports / banned APIs
├── pdf/
│   └── text.ts             # shared `pdftotext -layout` page-range helper
└── cli.ts                  # parse / progress / figures / diagrams / interactive / lint-* (Commander.js, no AI)

.claude/
├── agents/
│   ├── book-analyst.md     # Per-chapter lesson-note subagent (sonnet, effort: high)
│   ├── sim-author.md       # Per-chapter interactive-sim subagent
│   └── curious-student.md  # Feynman probe subagent — asks one question at a time
└── skills/
    ├── parse-book/
    ├── tutor-prep/         # + lesson-note-template.md
    ├── visualize/          # + sim-contract.md
    ├── tutor/
    └── book-status/

interactive-book/           # Docusaurus app — see interactive-book/README.md
├── src/widgets/            # GraphFigure, SimHost, VizControls, VizFrame
├── src/components/         # BookFigure, DigDeeper, Callout, Check, Flashcards (learning UI)
├── src/sims/<slug>/        # AI-authored sims (.tsx + manifest.json) — committed
├── viz-allowlist.json      # which libraries sims may import
└── docs/<slug>/            # generated MDX — git-ignored
```

All intelligence lives in the Claude Code skills: `/tutor-prep` dispatches `book-analyst` sequentially per chapter (skippable/resumable); `/visualize` dispatches `sim-author` per chapter; `/tutor` runs the live session and dispatches `curious-student` for Feynman handoffs. The `figures`, `diagrams`, `lint-lessons`, `lint-sims`, and `interactive` commands are deterministic guards/generators the skills call.

## Supported formats

| Format | Chapter detection |
|---|---|
| EPUB | TOC/spine from the EPUB manifest — exact, reliable |
| PDF (with headings) | Regex: "Chapter N", "Part I", "Section 1", roman numerals, English words |
| PDF (no headings) | Page-count heuristic: splits every 20 pages |

## Development

```bash
pnpm test          # Run all tests (Vitest)
pnpm typecheck     # TypeScript strict check
```

Tests use a Project Gutenberg EPUB fixture (`tests/fixtures/metamorphosis.epub`) and a mocked `pdfjs-dist` — no internet required to run the test suite. The Docusaurus app has its own typecheck: `cd interactive-book && pnpm exec tsc --noEmit`.
