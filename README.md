# Study Mate

**Study Mate** turns any PDF or EPUB into a personal study partner: it teaches the book concept-by-concept, makes you explain it back (Feynman-style), and quizzes you with spaced repetition until it sticks. Built for ADHD-friendly, bite-sized, low-friction learning.

Runs entirely inside [Claude Code](https://claude.ai/code) — **no Anthropic API key needed**. All AI work happens in your current session.

## How it works

1. **Parse** — a TypeScript CLI extracts chapters from your book into structured markdown files
2. **Prep** — `/tutor-prep` dispatches one AI agent per chapter to distill each into a lesson note: teaching arc, concept explanations, figure-location pointers, grounded inline diagrams/tables, and review Q&A pairs
3. **Tutor** — `/tutor` runs a live session: spaced reviews first, then concept-by-concept teaching with figure references, then a Feynman handoff (a `curious-student` subagent probes your explanation), and finally a gap report + progress update
4. **Track** — a deterministic `progress` CLI manages `progress.json`: mastery status, spaced-repetition queue, session log

## Prerequisites

- [Claude Code](https://claude.ai/code)
- Node.js 18+
- pnpm (`npm install -g pnpm`), then `pnpm install`
- **Optional:** [poppler](https://poppler.freedesktop.org/) (`brew install poppler`) — only needed for PDF figure/diagram grounding during `/tutor-prep`. EPUBs and progress tracking work without it.

## Quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Parse a book (inside Claude Code)
/parse-book ~/Books/deep-work.epub

# 3. Distill chapters into tutor lesson notes
/tutor-prep deep-work

# 4. Start a live tutoring session
/tutor deep-work

# 5. Check status of all books
/book-status
```

Or use the CLI directly for parsing and progress tracking (no AI):

```bash
pnpm exec tsx src/cli.ts parse ~/Books/deep-work.epub
pnpm exec tsx src/cli.ts progress show deep-work
pnpm exec tsx src/cli.ts progress due deep-work
pnpm exec tsx src/cli.ts progress record deep-work --id c1-q1 --result pass
pnpm exec tsx src/cli.ts progress advance deep-work --chapter 1 --status mastered --gaps "concept X was fuzzy"
```

## Skills

| Skill | Arguments | Purpose |
|---|---|---|
| `/parse-book` | `<path/to/book.epub\|pdf>` | Parse a book into raw chapters |
| `/tutor-prep` | `<book-slug> [chapter-N]` | Distill chapters into tutor lesson notes (all or one) |
| `/tutor` | `<book-slug>` | Live AI tutoring session: teach + Feynman + progress |
| `/book-status` | — | Show all books and their tutoring progress |

## Output structure

```
book-output/
└── deep-work/
    ├── metadata.json          # Title, author, chapter index
    ├── raw-chapters/
    │   ├── chapter-01.md
    │   └── chapter-N.md
    ├── lessons/
    │   ├── chapter-01-lesson.md   # Teaching arc, concepts, figures, review Q&A
    │   └── chapter-N-lesson.md
    └── progress.json              # Mastery status, spaced-repetition queue, session log
```

`book-output/` is git-ignored — generated content stays local.

## Lesson notes

Each chapter lesson note (written by `book-analyst` following the template) contains:

- **Teaching arc** — ordered list of concepts to cover, each with a one-line learning objective
- **Concepts** — for each concept: plain-English explanation, why it matters, a check question + ideal answer, the most common misconception, and (when genuine) a real-life application
- **Figures / Tables / Equations** — every visual or key equation referenced by location (PDF page number or EPUB section anchor) so the tutor can point you to the real artifact. When the chapter *text itself* states a small graph's edges or a table's values, the note also inlines a faithful `mermaid` diagram or markdown table
- **Review items** — active-recall Q&A pairs in the spaced-repetition format the `progress` CLI parses

### Grounding & faithfulness

Inline visuals are guarded by deterministic checks so nothing is hallucinated from a figure the model can't see:

- **`diagrams lint`** — every node label and every named edge of an inlined `mermaid` graph must be stated in the chapter text; ungrounded or oversized graphs are dropped back to a plain location pointer
- **`figures-fix`** — figure/table page citations are rewritten to match the authoritative `pdftotext` extraction, so cited pages are exact by construction

These run automatically inside `/tutor-prep` (PDF mode).

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
├── figures/
│   ├── extract.ts          # pdftotext → authoritative figure/table → page map
│   └── fix.ts              # deterministically rewrite drifted page citations
├── diagrams/
│   ├── extract.ts          # pull ```mermaid``` blocks from a lesson note
│   ├── parse.ts            # parse a mermaid graph into nodes + edges
│   ├── render.ts           # adjacency view for the live terminal
│   └── lint.ts             # ground node labels + edges against chapter text
├── pdf/
│   └── text.ts             # shared `pdftotext -layout` page-range helper
└── cli.ts                  # parse / progress / figures / diagrams (Commander.js, no AI)

.claude/
├── agents/
│   ├── book-analyst.md     # Per-chapter analysis subagent (sonnet, effort: high)
│   └── curious-student.md  # Feynman probe subagent — asks one question at a time
└── skills/
    ├── parse-book/
    ├── tutor-prep/         # + lesson-note-template.md
    ├── tutor/
    └── book-status/
```

The CLI does zero AI work — it's pure TypeScript, fully testable. All intelligence lives in the Claude Code skills: `/tutor-prep` dispatches `book-analyst` sequentially per chapter (skippable/resumable); `/tutor` runs the live session and dispatches `curious-student` for Feynman handoffs. The `figures` and `diagrams` commands are deterministic guards the prep skill calls to keep inline visuals honest.

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

Tests use a Project Gutenberg EPUB fixture (`tests/fixtures/metamorphosis.epub`) and a mocked `pdfjs-dist` — no internet required to run the test suite.
