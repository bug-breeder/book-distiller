# Book Distiller

A Claude Code–native system that turns PDF and EPUB books into deep, retention-focused summaries, practice exercises, and interactive quizzes — all powered by Claude Code skills running in parallel.

## How it works

1. **Parse** — a TypeScript CLI extracts chapters from your book into structured markdown files
2. **Summarize** — a Claude Code skill dispatches one AI agent per chapter in parallel, each producing a deep summary
3. **Practice** — another skill generates comprehension questions, real-world scenarios, and reflection prompts per chapter
4. **Quiz** — an interactive skill tests your retention with AskUserQuestion feedback loops

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

# 3. Generate deep summaries
/summarize-book deep-work

# 4. Generate practice exercises
/practice-book deep-work

# 5. Test your retention
/book-quiz deep-work

# 6. Check status of all books
/book-status
```

Or use the CLI directly:

```bash
pnpm exec tsx src/cli.ts parse ~/Books/deep-work.epub
```

## Skills

| Skill | Arguments | Purpose |
|---|---|---|
| `/parse-book` | `<path/to/book.epub\|pdf>` | Parse a book into raw chapters |
| `/summarize-book` | `<book-slug>` | Generate deep chapter summaries + full-book summary |
| `/practice-book` | `<book-slug> [chapter-N]` | Generate practice exercises (all chapters or one) |
| `/book-quiz` | `<book-slug>` | Interactive 10-question quiz with scoring |
| `/book-status` | — | Show all books and their completion status |

## Output structure

```
book-output/
└── deep-work/
    ├── metadata.json          # Title, author, chapter index
    ├── raw-chapters/
    │   ├── chapter-01.md
    │   └── chapter-N.md
    ├── summaries/
    │   ├── chapter-01-summary.md
    │   ├── chapter-N-summary.md
    │   └── full-book-summary.md
    └── practice/
        ├── chapter-01-practice.md
        ├── chapter-N-practice.md
        └── full-book-practice.md
```

`book-output/` is git-ignored — generated content stays local.

## Summary depth

Each chapter summary follows a structured template:

- **Core Thesis** — the single most important idea, stated precisely
- **Detailed Breakdown** — every major concept with what/why/how/example/connection
- **Key Takeaways** — 5–10 actionable, memorable points
- **Mental Model** — a framework or analogy that captures the chapter's logic
- **"Aha!" Moments** — counterintuitive insights
- **Connections to Other Chapters** — how ideas build
- **ELI5** — the whole chapter explained to a 12-year-old

The full-book summary adds: thesis, argument arc, 10 most important ideas, who should read it, and blind spots.

## Practice exercises

Each chapter gets:

- **Comprehension Check** — 5 conceptual questions (not trivia) with detailed answers
- **Apply It** — 3 real-world scenarios with model responses
- **Reflection Prompts** — connect material to your own life/work
- **Teach It Back** — Feynman technique prompt with model explanation
- **Synthesis Challenge** — cross-chapter exercise
- **Action Items** — 3 concrete things to do this week

## Architecture

```
src/
├── parser/
│   ├── index.ts           # Format detection — routes .epub / .pdf
│   ├── epub-parser.ts     # epub2 + TOC-based chapter splitting
│   ├── pdf-parser.ts      # pdf-parse + heading/page-based splitting
│   ├── chapter-splitter.ts # Regex detection for chapter headings
│   └── types.ts           # Shared TypeScript types
└── cli.ts                 # parse command (Commander.js)

.claude/
├── agents/
│   └── book-analyst.md    # Per-chapter analysis subagent (sonnet, effort: high)
└── skills/
    ├── parse-book/
    ├── summarize-book/    # + chapter-summary-template.md
    ├── practice-book/    # + chapter-practice-template.md
    ├── book-quiz/
    └── book-status/
```

The CLI does zero AI work — it's pure TypeScript, fully testable. All intelligence lives in the Claude Code skills, which dispatch the `book-analyst` subagent in parallel (one per chapter) to keep the main context clean and make large books fast.

## Supported formats

| Format | Chapter detection |
|---|---|
| EPUB | TOC/spine from the EPUB manifest — exact, reliable |
| PDF (with headings) | Regex: "Chapter N", "Part I", "Section 1", roman numerals, English words |
| PDF (no headings) | Page-count heuristic: splits every 20 pages |

## Development

```bash
pnpm test          # Run all tests (29 tests, Vitest)
pnpm typecheck     # TypeScript strict check
```

Tests use a Project Gutenberg EPUB fixture (`tests/fixtures/metamorphosis.epub`) and mocked `pdf-parse` — no internet required to run the test suite.
