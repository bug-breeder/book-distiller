# Sim authoring contract

You are writing ONE self-contained interactive visualization component (a "sim")
for a single concept, to be compiled into a Docusaurus site. Follow this contract
exactly — a deterministic lint + `tsc` + site build will reject violations.

## File

Write the sim to the EXACT path given in the delegation (e.g.
`interactive-book/src/sims/<slug>/ch<N>/<concept-slug>.tsx`).

## Required shape

```tsx
import React, {useEffect, useRef} from 'react';
// import only allowlisted libraries (see "Allowed libraries" below)
import type {SimProps, SimMeta} from '../../types';   // adjust ../ depth to reach src/sims/types

export const meta: SimMeta = {
  title: '<short title>',
  concept: '<EXACT concept name — must match the ### Cn — <name> heading>',
  caption: '<one line: what to do / what to look for>',
  libs: [/* every third-party package you import, e.g. 'd3' */],
};

export default function Sim({width, seed, isDark}: SimProps) {
  // ...
}
```

## Rules (non-negotiable)

1. **Default export** is the component; also export `meta`. `meta.libs` MUST list
   exactly the third-party packages you import (no more, no fewer).
2. **SSR-safe.** Do ALL canvas/DOM/D3/Three/Matter work inside `useEffect`. The
   server render must not touch `window`, `document`, or a canvas context.
3. **Responsive.** Lay out to `props.width`. Choose a sensible height (e.g. a ratio
   of width, capped ~520px). Never hard-code a fixed pixel width.
4. **Deterministic initial state.** Any randomness MUST come from the seeded RNG:
   `import {useRng} from '@site/src/lib/useRng';` then `const rand = useRng(seed);`.
   Do NOT call `Math.random()`.
5. **Dark mode.** Read colors from CSS variables (e.g. `var(--ifm-color-primary)`,
   `var(--ifm-font-color-base)`) or branch on `isDark`. Do not assume a white page.
6. **Controls.** For adjustable parameters use the shared primitives:
   `import {ControlRow, Slider, Toggle, Button} from '@site/src/widgets/VizControls';`
   Render them ABOVE or BELOW the canvas inside your component.
7. **No banned APIs:** no `eval`, `new Function`, `dangerouslySetInnerHTML`,
   `fetch`, `XMLHttpRequest`, or `WebSocket`. No network access. No data files.
8. **Allowed libraries:** only packages in `interactive-book/viz-allowlist.json`
   (plus `react` and `@site/...` first-party imports). If a concept truly needs a
   library that is not listed, STOP and report it — the human runs
   `study-mate add-viz-lib <pkg>` to add it. Do not import it speculatively.

## Pick the right visual

Choose the visual that teaches the concept, not the flashiest one: a process you
can step/animate, a model with a parameter to drag (segregation threshold, payoff,
rate), a chart of a relationship the text states, a geometric construction, a
small graph that grows. Keep it faithful to the chapter — never invent data the
text doesn't support; for a small declarative graph prefer leaving it to the
lesson's `## Visualizations` `<GraphFigure>` instead of a bespoke sim.
