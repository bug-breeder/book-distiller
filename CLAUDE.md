# Book Distiller

Parse PDF/EPUB books and generate deep summaries using Claude Code skills.

## Commands

- **Parse a book:** `pnpm exec tsx src/cli.ts parse <file.epub|pdf>`
- **Run tests:** `pnpm test`
- **Typecheck:** `pnpm typecheck`

## Skills

| Skill | Purpose |
|---|---|
| `/parse-book <file>` | Parse a book file into raw chapters |
| `/summarize-book <slug>` | Generate deep chapter summaries (requires parsed book) |
| `/practice-book <slug> [N]` | Generate practice exercises per chapter |
| `/book-quiz <slug>` | Interactive quiz on a book's summaries |
| `/book-status` | Show all books and their completion status |

## Architecture

- **CLI (`src/cli.ts`):** Parse command only — no AI. Outputs to `book-output/<slug>/`.
- **Skills:** All AI work. Skills dispatch `book-analyst` subagents sequentially per chapter, skipping chapters with existing output files (resumable after rate-limit interruptions).
- **`book-output/`:** Contains parsed chapters, summaries, practice files.

## Code Style

- TypeScript strict mode, ES modules, async/await
- Imports use `.js` extension (NodeNext resolution)
- No `any` — use explicit types or `unknown`
