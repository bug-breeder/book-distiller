# Book Distiller

A Claude Code–native system that turns PDF and EPUB books into a live, ADHD-friendly AI tutoring experience — concept-by-concept teaching, Feynman-technique handoffs, and spaced-repetition progress tracking.

## How it works

1. **Parse** — a TypeScript CLI extracts chapters from your book into structured markdown files
2. **Prep** — `/tutor-prep` dispatches one AI agent per chapter to distill each into a lesson note: teaching arc, concept explanations, figure-location pointers, and review Q&A pairs
3. **Tutor** — `/tutor` runs a live session: spaced reviews first, then concept-by-concept teaching with figure references, then a Feynman handoff (a `curious-student` subagent probes your explanation), and finally a gap report + progress update
4. **Track** — a deterministic `progress` CLI manages `progress.json`: mastery status, spaced-repetition queue, session log

No Anthropic API key needed. All AI work runs inside your current Claude Code session.

## Prerequisites

- [Claude Code](https://claude.ai/code)
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- `pnpm install`

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

Or use the CLI directly for progress tracking (no AI):

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
- **Figures / Tables / Equations** — every visual or key equation referenced by location (PDF page number or EPUB section anchor) so the tutor can point you to the real artifact
- **Review items** — active-recall Q&A pairs in the spaced-repetition format the `progress` CLI parses

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
│   ├── index.ts           # Format detection — routes .epub / .pdf
│   ├── epub-parser.ts     # epub2 + TOC-based chapter splitting
│   ├── pdf-parser.ts      # pdf-parse + heading/page-based splitting
│   ├── chapter-splitter.ts # Regex detection for chapter headings
│   └── types.ts           # Shared TypeScript types
├── progress/
│   ├── types.ts           # Progress, ReviewItem, ChapterProgress types
│   ├── schedule.ts        # Spaced-repetition scheduler (pure functions)
│   ├── lessonNotes.ts     # Review-item parser for lesson note files
│   ├── store.ts           # Load/save progress.json
│   └── commands.ts        # due / record / advance / show command logic
└── cli.ts                 # parse + progress subcommands (Commander.js, no AI)

.claude/
├── agents/
│   ├── book-analyst.md    # Per-chapter analysis subagent (sonnet, effort: high)
│   └── curious-student.md # Feynman probe subagent — asks one question at a time
└── skills/
    ├── parse-book/
    ├── tutor-prep/        # + lesson-note-template.md
    ├── tutor/
    └── book-status/
```

The CLI does zero AI work — it's pure TypeScript, fully testable. All intelligence lives in the Claude Code skills: `/tutor-prep` dispatches `book-analyst` sequentially per chapter (skippable/resumable); `/tutor` runs the live session and dispatches `curious-student` for Feynman handoffs.

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

Tests use a Project Gutenberg EPUB fixture (`tests/fixtures/metamorphosis.epub`) and mocked `pdf-parse` — no internet required to run the test suite.
