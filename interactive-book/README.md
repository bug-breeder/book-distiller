# Interactive book (Docusaurus)

The browser learning view for Study Mate, built with [Docusaurus](https://docusaurus.io/).

**You normally don't edit `docs/` here by hand.** Pages under `docs/<slug>/` are *generated* from a book's lesson notes by `pnpm exec tsx src/cli.ts interactive <slug>` (run from the repo root) and are git-ignored. What lives in version control is the site infrastructure (`docusaurus.config.ts`, `src/widgets/`, `src/components/`, `src/theme/`) and the AI-authored sims under `src/sims/<slug>/`.

## Develop

From the repo root, generate a book first:

```bash
pnpm exec tsx src/cli.ts interactive <slug>
```

Then run the site:

```bash
cd interactive-book
pnpm install
pnpm start        # dev server with live reload
pnpm build        # static build — also the SSR render gate for every page/sim
```

## Layout

- `src/widgets/` — shared rendering primitives: `GraphFigure` (declarative static diagrams), `SimHost` (mounts AI-authored sims responsively, supplies width/seed/`isDark`), `VizControls` (sliders/toggles), `VizFrame` (chrome).
- `src/components/` — learning UI: `BookFigure` (extracted PDF images), `DigDeeper` (the collapsible intuition + worked-example disclosure), `Callout`, `Check`, `Flashcards`. Registered globally for MDX via `src/theme/MDXComponents.tsx`.
- `src/sims/<slug>/` — AI-authored interactive sim components (`.tsx` + `manifest.json`), written by the `/visualize` skill from the allowlisted palette in `../viz-allowlist.json`.
- `static/figures/<slug>/` — real figure images cropped from source PDFs (git-ignored, derived/copyrighted).
- `docs/<slug>/` — generated MDX (git-ignored).

See the repo root `README.md` and `CLAUDE.md` for the full pipeline.
