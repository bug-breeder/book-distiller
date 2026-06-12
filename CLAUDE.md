# Study Mate

Parse PDF/EPUB books and learn them with a live AI tutor using Claude Code skills.

## Commands

- **Parse a book:** `pnpm exec tsx src/cli.ts parse <file.epub|pdf>`
- **Tutor progress (CLI, no AI):** `pnpm exec tsx src/cli.ts progress <due|record|advance|show> <slug>`
- **Extract real book figures:** `pnpm exec tsx src/cli.ts extract-figures <slug>` → crops PDF figures tagged `| concept:` in lesson notes into `book-output/<slug>/figures/` (needs Python + PyMuPDF; run before `interactive`)
- **Generate interactive book:** `pnpm exec tsx src/cli.ts interactive <slug>` → writes Docusaurus pages to `interactive-book/docs/<slug>/`
- **Sim libraries (deterministic helpers):** `pnpm exec tsx src/cli.ts lint-sims <slug>` (lint generated sims for off-allowlist imports / banned APIs) · `add-viz-lib <pkg>` (install a viz library into `interactive-book/` + add it to `viz-allowlist.json`)
- **Run the interactive book:** `cd interactive-book && pnpm install && pnpm start` (or `pnpm build`)
- **Run tests:** `pnpm test`
- **Typecheck:** `pnpm typecheck`

## Skills

| Skill | Purpose |
|---|---|
| `/parse-book <file>` | Parse a book file into raw chapters |
| `/tutor-prep <slug> [N]` | Distill chapters into tutor lesson notes |
| `/visualize <slug> [N]` | Author interactive sim components for each concept (after `/tutor-prep`) |
| `/tutor <slug>` | Live AI tutoring session (teach + Feynman + progress) |
| `/book-status` | Show all books and their tutoring progress |

## Architecture

- **CLI (`src/cli.ts`):** Parse, progress, and `interactive` commands — no AI. Outputs to `book-output/<slug>/`.
- **Skills:** All AI work. `/tutor-prep` dispatches `book-analyst` subagents sequentially per chapter to write lesson notes; `/visualize` dispatches `sim-author` subagents per chapter to write interactive sim components; `/tutor` runs the live session (teach → Feynman → progress tracking). All are resumable after interruptions.
- **`book-output/`:** Contains parsed chapters, lesson notes (`lessons/`), and `progress.json`.
- **Interactive book (`src/interactive/` → `interactive-book/`):** Deterministic generator turns lesson notes into a **Docusaurus** site (not MkDocs/HonKit). `parse.ts` structures a lesson note (including its `## Visualizations` figure specs); the **`/visualize` skill** authors a self-contained interactive sim component per concept into `interactive-book/src/sims/<slug>/` (tracked `.tsx` + `manifest.json`, via the `sim-author` agent, importing from the allowlisted palette in `viz-allowlist.json`); `generate.ts` reads that manifest and emits MDX + a `_meta.json` per book, importing each sim through `<SimHost>` (the responsive/seed/theme wrapper). `study-mate lint-sims`/`add-viz-lib` gate which libraries sims may import (tsc + lint per sim; `pnpm build` is the render gate). **Lessons CREATE their figures, they don't cite them:** each lesson note's `## Visualizations` section carries compact graph specs (nodes/edges with kinds strong/weak/bridge/new/dim/positive/negative) that render inline as `<GraphFigure>` diagrams next to the concept they illustrate — there is no "open the source at page N" citation list in the interactive output. **Figures the lesson CAN'T recreate (large/real networks like the karate club, charts, maps, photos, multi-panel) are EXTRACTED from the source PDF and embedded as real images, not cited:** tag the figure's `## Figures` line with `| concept: <exact concept name>`, run `study-mate extract-figures <slug>` (a `scripts/extract_figures.py` PyMuPDF helper crops each figure by unioning vector/raster rects above its caption — see `src/figures/images.ts`), then `interactive` copies the PNGs into `interactive-book/static/figures/<slug>/` (gitignored, derived/copyrighted) and renders a `<BookFigure>` inline next to the concept. The Docusaurus app lives in `interactive-book/` (config + `src/widgets/` — `GraphFigure` (declarative static diagrams, fit-to-box adaptive height), `SimHost` (mounts AI-authored sims responsively + supplies width/seed/`isDark`), `VizControls` (shared sliders/toggles), `VizFrame` chrome — `src/sims/<slug>/` AI-authored sims + `src/components/` learning UI, registered globally in `src/theme/MDXComponents.tsx`). Generated `interactive-book/docs/` is gitignored; the site infra AND the tracked `src/sims/` are committed. Sims are inline React components using any allowlisted library (D3, Three, Matter, Anime, Math.js, Recharts, KaTeX, …) — the "better than MicroSims" approach, not p5 iframes.

## Code Style

- TypeScript strict mode, ES modules, async/await
- Imports use `.js` extension (NodeNext resolution)
- No `any` — use explicit types or `unknown`
