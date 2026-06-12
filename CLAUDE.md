# Study Mate

Parse PDF/EPUB books and learn them with a live AI tutor using Claude Code skills.

## Commands

- **Parse a book:** `pnpm exec tsx src/cli.ts parse <file.epub|pdf>`
- **Tutor progress (CLI, no AI):** `pnpm exec tsx src/cli.ts progress <due|record|advance|show> <slug>`
- **Extract real book figures:** `pnpm exec tsx src/cli.ts extract-figures <slug>` → crops PDF figures tagged `| concept:` in lesson notes into `book-output/<slug>/figures/` (needs Python + PyMuPDF; run before `interactive`)
- **Generate interactive book:** `pnpm exec tsx src/cli.ts interactive <slug>` → writes Docusaurus pages to `interactive-book/docs/<slug>/`
- **Run the interactive book:** `cd interactive-book && pnpm install && pnpm start` (or `pnpm build`)
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

- **CLI (`src/cli.ts`):** Parse, progress, and `interactive` commands — no AI. Outputs to `book-output/<slug>/`.
- **Skills:** All AI work. `/tutor-prep` dispatches `book-analyst` subagents sequentially per chapter to write lesson notes; `/tutor` runs the live session (teach → Feynman → progress tracking). Both are resumable after interruptions.
- **`book-output/`:** Contains parsed chapters, lesson notes (`lessons/`), and `progress.json`.
- **Interactive book (`src/interactive/` → `interactive-book/`):** Deterministic generator turns lesson notes into a **Docusaurus** site (not MkDocs/HonKit). `parse.ts` structures a lesson note (including its `## Visualizations` figure specs); `registry.ts` maps concepts → interactive React/D3 widgets; `generate.ts` emits MDX + a `_meta.json` per book. **Lessons CREATE their figures, they don't cite them:** each lesson note's `## Visualizations` section carries compact graph specs (nodes/edges with kinds strong/weak/bridge/new/dim/positive/negative) that render inline as `<GraphFigure>` diagrams next to the concept they illustrate — there is no "open the source at page N" citation list in the interactive output. **Figures the lesson CAN'T recreate (large/real networks like the karate club, charts, maps, photos, multi-panel) are EXTRACTED from the source PDF and embedded as real images, not cited:** tag the figure's `## Figures` line with `| concept: <exact concept name>`, run `study-mate extract-figures <slug>` (a `scripts/extract_figures.py` PyMuPDF helper crops each figure by unioning vector/raster rects above its caption — see `src/figures/images.ts`), then `interactive` copies the PNGs into `interactive-book/static/figures/<slug>/` (gitignored, derived/copyrighted) and renders a `<BookFigure>` inline next to the concept. The Docusaurus app lives in `interactive-book/` (config + `src/widgets/` D3 components — `GraphFigure` (declarative static diagrams, fit-to-box adaptive height) plus `NetworkGraph`/`Schelling`/`StructuralBalance` (interactive) — + `src/components/` learning UI, registered globally in `src/theme/MDXComponents.tsx`). Generated `interactive-book/docs/` is gitignored; the site infra is tracked. Widgets are inline D3/canvas components (the "better than MicroSims" approach), not p5 iframes.

## Code Style

- TypeScript strict mode, ES modules, async/await
- Imports use `.js` extension (NodeNext resolution)
- No `any` — use explicit types or `unknown`
