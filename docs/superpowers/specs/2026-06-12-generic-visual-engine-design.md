# Generic Visual Engine — Design

- **Date:** 2026-06-12
- **Status:** Approved design, pre-implementation
- **Author:** Study Mate
- **Scope:** One implementation plan (full engine + migrate `networks-book` ch1–5)

## Goal

Make Study Mate's interactive-book visual layer **generic**: any concept in any
book can get any kind of visual (chart, physics sim, geometry, animation, 3D,
timeline, map, causal-loop diagram, …), authored by AI per concept — the way
[dmccreary's MicroSims](https://github.com/dmccreary/microsims) cover a huge
range *because each sim is authored independently*. We keep MicroSims'
conventions (responsive canvas, standard parameter controls, per-sim metadata)
but render **inline React + a chosen toolkit**, not p5/iframes, inside the
existing Docusaurus app.

### Non-goals

- Not a runtime sandbox (react-live/Sandpack) and not iframes — sims are
  build-time `.tsx` compiled into the site.
- Not auto-installing arbitrary npm packages per build — new libraries pass
  through a deliberate allowlist gate.
- Not changing the terminal tutor (`/tutor`) or the parse/distill pipeline.

## Background — what's network-bound today

Two pieces hardcode the Networks book:

1. `src/interactive/registry.ts` — maps `networks-book` chapter N → specific
   widgets (`NetworkGraph`, `Schelling`, `StructuralBalance`).
2. `interactive-book/src/widgets/{Schelling,StructuralBalance,NetworkGraph}.tsx`
   — networks-only components.

Generic already, and **kept**: `GraphFigure` (declarative node/edge specs →
deterministic static graph, free to render), `BookFigure` (real images cropped
from the source PDF), and learning UI (`Callout`, `Check`, `Flashcards`).

## Decisions (locked with the user, 2026-06-12)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Generation model | **AI-authored inline sims** — agent writes a real component per concept |
| 2 | Delivery | **Build-time `.tsx` files**, imported like any widget, type-checked |
| 3 | Library model | **Broad pre-installed palette + allowlist gate** (`study-mate add-viz-lib`) |
| 4 | Workflow | **New `/visualize` skill**, runs after `/tutor-prep`; deterministic `interactive` CLI wires sims in |
| 5 | Tracking | **Sims are tracked git source** (validated-once, stable) |
| 6 | Existing widgets | **Remove** book-specific widgets + `registry.ts`; **regenerate** as sims |
| 7 | Spec size | **Full engine in one spec**, including migrating `networks-book` ch1–5 |

## Architecture & data flow

```
/tutor-prep <slug>   →  book-output/<slug>/lessons/*.md                       (lesson notes, gitignored)
/visualize <slug>    →  interactive-book/src/sims/<slug>/ch<N>/<concept>.tsx   (TRACKED source)
                     →  interactive-book/src/sims/<slug>/manifest.json         (TRACKED)
study-mate interactive <slug>  →  interactive-book/docs/<slug>/*.mdx           (gitignored; imports the sims)
```

- `/visualize` (AI skill) reads prepared lesson notes and authors + validates
  one sim component per concept that merits one.
- Sims are **tracked source** under `interactive-book/src/sims/<slug>/` — same
  status as a hand-written widget. Reproducible builds, reviewable diffs,
  survive a clean checkout, no AI needed to rebuild the site.
- `study-mate interactive` stays **no-AI**: it reads the per-book sim manifest
  and emits MDX that `import`s each sim and wraps it in `<VizFrame>`.
- `interactive-book/docs/` and `static/figures/` remain gitignored derived
  output. Only sims (tracked) join the existing tracked site infra.

## Unit boundaries

| Unit | Responsibility | Depends on |
|------|----------------|-----------|
| Sim contract (`SimProps`, types) | The shape every generated sim satisfies | — |
| `VizFrame` | Responsive container: measures width, supplies `width`/`isDark`/`seed`, renders caption + SSR placeholder | sim contract |
| `VizControls` + control primitives | Shared slider/toggle/select/button + reset row | — |
| `useRng(seed)` | Deterministic seeded RNG (mulberry32) for stable initial state | — |
| Sim components | One per concept; the only AI-authored code | toolkit, contract, VizFrame, VizControls, useRng |
| `viz-allowlist.json` + `add-viz-lib` CLI | The set of importable libraries; the gate to grow it | — |
| Import/safety lint | Rejects off-allowlist imports + banned APIs | allowlist |
| `/visualize` skill | Authors sims, runs the per-sim fix-loop, writes manifest | all of the above |
| manifest (`sims/<slug>/manifest.json`) | concept → sim file mapping the CLI reads | — |
| generator (`generate.ts`) | Emits MDX importing sims, anchored by concept | manifest, parsed lesson |

## The Sim component contract

A fixed contract is what makes "AI writes anything" reliable.

```ts
// interactive-book/src/sims/types.ts
export interface SimProps {
  /** Pixel width of the container, supplied by VizFrame (responsive). */
  width: number;
  /** Deterministic RNG seed so initial state is identical every build. */
  seed: number;
  /** True when Docusaurus dark theme is active; sims read CSS vars too. */
  isDark: boolean;
}
```

Rules every generated sim must satisfy:

1. **Default export** `function Sim(props: SimProps)`.
2. **SSR-safe.** All DOM/canvas/D3/Three/Matter work runs inside `useEffect`.
   Server render returns a sized placeholder (Docusaurus builds statically).
3. **Responsive.** Lays out to `props.width`; height adapts (no fixed-pixel
   layouts). `VizFrame` owns measurement via `ResizeObserver`.
4. **Deterministic initial state.** Uses `useRng(props.seed)` for any
   randomness; animation/interaction is fine, the *starting frame* is stable.
5. **Standard controls.** Interactive parameters use the shared `<VizControls>`
   primitives (MicroSims-style sliders/toggles) — consistent theming + dark mode
   via CSS variables, no bespoke control styling.
6. **Metadata header.** A leading export documents the sim:
   ```ts
   export const meta = {
     title: "Schelling segregation on a grid",
     concept: "Schelling's Segregation Model",
     caption: "Drag the tolerance slider to see segregation emerge.",
     libs: ["d3"],            // must all be on the allowlist
   } as const;
   ```

`VizFrame` is the single responsive/theming wrapper. It takes the sim's `meta`
plus the sim as a child: `<VizFrame meta={metaN}><SimN/></VizFrame>`. It measures
width (`ResizeObserver`), reads the theme, **derives a stable `seed` by hashing
`meta.title`** (deterministic across builds, no per-sim seed bookkeeping), and
passes `width`/`seed`/`isDark` to the sim. It renders `meta.title`/`meta.caption`
and the SSR placeholder. Sims never measure the window, read theme, or invent a
seed directly.

## Palette + allowlist

Pre-install a generous set so the agent rarely needs more:

- **Core toolkit:** `d3` (have it), `three`, `matter-js`, `animejs`, `mathjs`.
- **Charts/diagrams/math/maps:** a charting lib (`@visx/*` or `recharts`),
  `katex` (equations), `d3-geo` + `topojson-client` (maps). Final list fixed in
  the plan; all added to `interactive-book/package.json`.

`interactive-book/viz-allowlist.json` (tracked) is the authoritative list of
importable specifiers. The import lint **rejects any import not on the
allowlist**. To grow it:

```
study-mate add-viz-lib <pkg>[@version]
```

— a deliberate step that runs `pnpm add` in `interactive-book/`, appends to
`viz-allowlist.json`, and updates the lockfile. No silent supply-chain growth;
builds stay reproducible from the committed lockfile.

## The `/visualize` skill

- **Input:** `<slug>` (and optional chapter). Reads
  `book-output/<slug>/{metadata.json,lessons/*.md}`.
- **Per concept:** decide whether a meaningful visual exists (a model, process,
  structure, or quantitative relationship — skip purely definitional concepts);
  if so pick the visual type + the smallest library that fits, then write the
  sim `.tsx`.
- **Fix-loop:** run the validation pipeline (below) and repair until the sim
  passes; only then add it to the manifest.
- **Resumable:** skip concepts already present in the manifest (so a re-run
  fills gaps / regenerates only what's missing). A `--force` regenerates.
- **Coexists with `GraphFigure`:** simple before/after graphs stay as
  declarative `## Visualizations` specs (deterministic, free). `/visualize`
  adds richer/interactive sims only where a static graph isn't enough.
- **Output:** validated sim files + an updated `manifest.json` + a short report
  (per concept: visualized / skipped-with-reason).

### Manifest schema

```json
{
  "slug": "networks-book",
  "sims": [
    {
      "chapter": 4,
      "concept": "Schelling's Segregation Model",
      "title": "Schelling segregation on a grid",
      "caption": "Drag the tolerance slider to see segregation emerge.",
      "file": "ch4/schellings-segregation-model.tsx",
      "libs": ["d3"]
    }
  ]
}
```

`concept` must exactly match a `### Cn — <name>` concept name (same discipline
as `GraphFigure`/`BookFigure` anchoring). Unmatched concepts fall into the
generated `## Explore` section.

## Validation pipeline (safety net for generated code)

Run inside `/visualize` before a sim is accepted into the manifest:

1. **`tsc`** — compiles against `SimProps` + toolkit types.
2. **Import/safety lint** — every import is on `viz-allowlist.json`; bans
   `eval`, `new Function`, `dangerouslySetInnerHTML`, and raw network calls
   (`fetch`/`XMLHttpRequest`/`WebSocket`). `meta.libs` must equal the actual
   imports.
3. **SSR render smoke** — `renderToString` the sim (vitest + jsdom); assert it
   mounts without throwing. Catches import-time and render-path errors.

> **Runtime limitation, stated honestly:** jsdom has no canvas/WebGL, so
> `useEffect` drawing (Three/Matter/canvas) can't be fully exercised in the unit
> smoke test. The **final integration gate is `pnpm build`** (SSR of every page)
> plus an optional headless-browser smoke (Playwright/chromium-cli) that loads a
> few sim pages and asserts no console errors. The plan will include that build
> gate; the per-sim loop relies on tsc + lint + SSR render.

## Generator + CLI rewiring

- **Remove** `src/interactive/registry.ts` and its `placementsFor` usage in
  `generate.ts`.
- `generate.ts` loads `interactive-book/src/sims/<slug>/manifest.json`. In
  `renderConcept`, after the explanation + `GraphFigure`s + `BookFigure`s, it
  emits any manifest sim whose `concept` matches exactly: an `import` at the top
  of the MDX (`import SimN, { meta as metaN } from
  '@site/src/sims/<slug>/ch<N>/<file>'`) and
  `<VizFrame meta={metaN}><SimN/></VizFrame>` inline. (Title/caption/seed all
  flow from `meta`, so the generator never duplicates them.)
- Unanchored sims (concept not found) render in the chapter's `## Explore`
  section, like leftover figures today.
- `figureCount`/Explore logic extends to count sims.

## Migration — `networks-book`

- Delete `Schelling.tsx`, `StructuralBalance.tsx`, `NetworkGraph.tsx`,
  `registry.ts`, and remove their `MDXComponents.tsx` registrations.
- Regenerate ch1–5 visuals via `/visualize networks-book` (Schelling grid,
  structural-balance signs, the ch1–3 network views) as AI-authored sims — this
  dogfoods the engine and is the acceptance demo.
- `GraphFigure`, `BookFigure`, `VizFrame`, `Callout`, `Check`, `Flashcards`
  stay registered globally.

## File / directory layout (new + changed)

```
interactive-book/
  viz-allowlist.json                       NEW (tracked)
  src/
    sims/
      types.ts                             NEW — SimProps, meta type
      <slug>/
        manifest.json                      NEW (tracked, per book)
        ch<N>/<concept>.tsx                NEW (tracked, AI-authored sims)
    widgets/
      VizFrame.tsx                         CHANGED — responsive + theme + props
      VizControls.tsx                      NEW — shared control primitives
      GraphFigure.tsx                      kept
      NetworkGraph.tsx, Schelling.tsx,
        StructuralBalance.tsx              DELETED
    lib/useRng.ts                          NEW — seeded RNG
    theme/MDXComponents.tsx                CHANGED — drop deleted widgets
src/
  interactive/
    registry.ts                            DELETED
    generate.ts                            CHANGED — manifest-driven sim anchoring
    types.ts                               CHANGED — manifest types
  cli.ts                                   CHANGED — add `add-viz-lib`
.claude/skills/visualize/                  NEW — the /visualize skill
scripts/ (lint helper if needed)           maybe NEW
```

## Testing strategy

- **Unit (vitest, root):** manifest parse/typing; generator emits the right
  `import` + `<VizFrame>` for an anchored concept and routes unanchored sims to
  Explore; import-lint accepts allowlisted / rejects off-list + banned APIs.
- **Sim smoke (vitest + jsdom):** the SSR render check reused by `/visualize`.
- **Integration:** `pnpm typecheck`, root `pnpm test`, then
  `study-mate interactive networks-book` + `interactive-book` `pnpm build`
  succeeds with regenerated sims present in the static HTML.

## Risks & mitigations

- **Generated-code quality varies** → fixed contract + fix-loop + build gate;
  `VizFrame`/`VizControls`/`useRng` remove the boilerplate the agent gets wrong.
- **WebGL/canvas not unit-testable** → build + headless-browser gate (above).
- **Bundle size from a broad palette** → palette curated; Docusaurus code-splits
  per page; only imported sims ship per chapter.
- **Allowlist friction** → palette is generous up front so `add-viz-lib` is
  rare.

## Out of scope (YAGNI)

- Preview images/thumbnails per sim (MicroSims have them; defer).
- A sim gallery/index page.
- Runtime sandbox or iframe delivery.
- Per-sim declared-deps auto-install.
