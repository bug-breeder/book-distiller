# Study Mate

Parse PDF/EPUB books and learn them with a live AI tutor using Claude Code skills.

## Commands

- **Parse a book:** `pnpm exec tsx src/cli.ts parse <file.epub|pdf>`
- **Tutor progress (CLI, no AI):** `pnpm exec tsx src/cli.ts progress <due|record|advance|show> <slug>`
- **Run tests:** `pnpm test`
- **Typecheck:** `pnpm typecheck`

## Skills

| Skill | Purpose |
|---|---|
| `/parse-book <file>` | Parse a book file into raw chapters |
| `/tutor-prep <slug> [N]` | Distill chapters into tutor lesson notes |
| `/tutor <slug>` | Live AI tutoring session (teach + Feynman + progress) |
| `/book-status` | Show all books and their tutoring progress |

## Architecture

- **CLI (`src/cli.ts`):** Parse and progress commands — no AI. Outputs to `book-output/<slug>/`.
- **Skills:** All AI work. `/tutor-prep` dispatches `book-analyst` subagents sequentially per chapter to write lesson notes; `/tutor` runs the live session (teach → Feynman → progress tracking). Both are resumable after interruptions.
- **`book-output/`:** Contains parsed chapters, lesson notes (`lessons/`), and `progress.json`.

## Code Style

- TypeScript strict mode, ES modules, async/await
- Imports use `.js` extension (NodeNext resolution)
- No `any` — use explicit types or `unknown`
