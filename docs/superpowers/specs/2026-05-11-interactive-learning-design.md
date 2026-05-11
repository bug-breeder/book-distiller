# Interactive Learning Surface for Book Distiller — Design Spec

**Date:** 2026-05-11
**Status:** Draft (awaiting user review)

---

## 1. Overview

### Problem

Today the `book-distiller` skills produce two artifacts per chapter:

- `summaries/chapter-NN-summary.md` — a deep textual summary (~100 lines, dense)
- `practice/chapter-NN-practice.md` — a list of practice prompts

These are walls of text. The user reads them, but reports they are hard to learn from — passive reading does not exercise the concepts. The user asked for an **interactive learning surface** that lets a reader manipulate the ideas in a chapter rather than just read about them.

### Solution at a glance

Add a new skill `/learn-book <slug>` that generates one **marimo WASM notebook per chapter**, deployed as a small bundle of static files runnable in any modern browser without a server install. Each notebook contains 6–12 interactive widgets drawn from a defined taxonomy (K1–K6) that map content types (prose, theorems, data, figures) to interaction shapes.

A top-level HTML shell links the chapter notebooks into a single browsable book with a sidebar TOC.

### Out of scope for v1

- Spaced repetition / SRS engine (could come in v2)
- Anki `.apkg` export (deferred)
- Right-margin Tufte sidenotes (marimo does not support natively)
- Cross-session user progress tracking (no backend)
- Per-chapter difficulty grading or adaptive sequencing
- Live PDF re-parsing — the skill consumes existing `book-output/<slug>/raw-chapters/`

---

## 2. Empirical findings from three working prototypes

| Chapter | Lines | Widgets | Source domain | Bundle size | Pyodide errors found |
|---|---|---|---|---|---|
| Networks Ch.2 (Graphs) | 1092 | 11 | Math/CS, graph theory | 27 MB | 3 (fixed) |
| Networks Ch.3 (Strong/Weak ties) | 1093 | 11 | Math/CS, proofs + sociology data | 27 MB | 2 (fixed) |
| Influence Ch.1 (Weapons of Influence) | 980 | 8 | Pure prose, anecdote-driven | 29 MB | 0 |

All three boot in headless Chrome, run for 90 seconds, and emit zero JavaScript exceptions, zero Python exceptions, and zero 404s under CDP verification.

The widget mix shifts radically by content type — see §3 below.

---

## 3. Widget taxonomy (K1–K6)

Six widget kinds, each defined by what the reader does and what they see in response.

### K1 — Live structure

Reader manipulates a graph, sequence, or data structure; downstream computation re-runs.
**Example** (Networks Ch.2): type comma-separated edges like `A-B, B-C, A-D`; the notebook draws the graph, computes degree, connected components, BFS distances.
**Fits:** chapters where the central object is a structure that can be drawn.

### K2 — Real-dataset explorer

Reader picks a subset, axis, or filter of a real dataset cited in the book; chart re-renders.
**Example** (Influence Ch.1): bar chart of Langer's three Xerox-machine compliance conditions (60% / 93% / 94%).
**Fits:** chapters that cite a specific empirical study with numbers.

### K3 — Phenomenon recreator

Reader runs the experiment from the book; the widget simulates the mechanism and shows the outcome.
**Example** (Influence Ch.1, three-buckets-of-water): pick left-hand and right-hand starting temperatures; the chart shows how the same lukewarm bucket feels different to each hand.
**Fits:** chapters that describe a named mechanism, principle, or experiment.

### K4 — Annotated figure

A figure from the book is shown with reader-toggleable overlays (highlights, callouts, decompositions).
**Example** (Networks Ch.3): Fig 3.7 (overlap vs. tie strength) with a hover-toggle that reveals the underlying clustering coefficient calculation.
**Fits:** chapters with rich visual figures the book itself uses to make a point.

### K5 — Scenario / quiz feedback

Reader picks an answer to a scenario; widget responds with green/red feedback and an explanation.
**Example** (Influence Ch.1): "A car salesman waits until you've agreed to a $25,000 sedan before mentioning the $1,200 leather seats — which weapon is in play?"
**Fits:** every chapter — the universal active-recall surface.

### K6 — Phrase / scenario builder (NEW, discovered via Influence Ch.1)

Reader assembles a request, communication, or scenario from a small set of parts; widget predicts an outcome based on rules from the chapter.
**Example** (Influence Ch.1): pick opener × reason structure × stake → predicted compliance %.
**Fits:** chapters about rules of human communication, persuasion, negotiation, or any domain where the principle is "constructing X gets you Y."

### Content-type → widget mix guidance

The skill chooses widget kinds based on the chapter's character:

| Chapter character | K1 | K2 | K3 | K4 | K5 | K6 |
|---|---|---|---|---|---|---|
| Math/CS, structures (Networks Ch.2) | 50% | 10% | 20% | 10% | 10% | 0% |
| Math/CS, proofs + data (Networks Ch.3) | 30% | 10% | 30% | 20% | 10% | 0% |
| Prose, anecdote-driven (Influence Ch.1) | 0% | 10% | 35% | 0% | 35% | 20% |
| Reference book (mixed) | 20% | 20% | 20% | 10% | 20% | 10% |

Target per chapter: **6–12 widgets total**. Less than 6 feels thin; more than 12 feels crowded.

---

## 4. Pyodide / marimo authoring rules

These are bugs that pass `marimo check` and only surface in the WASM browser runtime. The skill MUST encode them in the subagent's authoring constraints. Each rule was hit at least once across the three prototypes.

| # | Rule | What it prevents |
|---|---|---|
| R1 | **Library whitelist.** Allow only `marimo`, `numpy`, `matplotlib.pyplot`, `io`, `random`, `math`, `collections`, `networkx` (math chapters only, with §R6 caveat). Forbid `scipy`, `pandas`, `plotly`, `sklearn`, `seaborn`, `requests`, `bs4`. | ModuleNotFoundError at boot |
| R2 | **Cell variable uniqueness.** Every top-level name in a cell becomes a marimo "definition" and MUST be unique across the notebook OR prefixed with `_` to be cell-local. | "Multiple definitions of name" error |
| R3 | **`_`-prefixed names cannot cross cells.** If a value needs to be read in another cell, give it a unique non-underscored name. | NameError at use site |
| R4 | **Widget creation and `.value` access in separate cells.** A `mo.ui.dropdown(...)` and the read of its `.value` must be in different cells. | RuntimeError: cell hasn't finished |
| R5 | **No tuple-expression returns.** `return mo.md("..."), mo.vstack(...)` parses as a tuple; marimo renders only one element. Wrap in `mo.vstack([...])`. | Silent missing content |
| R6 | **No scipy-requiring networkx functions.** Specifically avoid `spring_layout`, `kamada_kawai_layout`, `to_scipy_sparse_array`. Use `circular_layout`, `random_layout`, or hand-built `{n: (rng.random(), rng.random())}`. | scipy ImportError mid-render |
| R7 | **No orphan nodes.** Every node referenced anywhere must be in the master node list. Same for edges, options, scenarios. | NetworkXError: no position |
| R8 | **`mo.ui.radio` compares label strings, not indices.** Conditionals must check `==` against the exact option string. | Always-wrong quiz feedback |
| R9 | **Post-export figure symlink.** After `marimo export html-wasm`, run `ln -sf public/figures dist/figures` if the notebook references `figures/...` — marimo's export puts assets at `dist/public/figures/` but the notebook's references are relative. | 404 on every figure |

---

## 5. Per-chapter pipeline

```
book-output/<slug>/raw-chapters/chapter-NN.md
            │
            ▼
   ┌──────────────────────────┐
   │ book-analyst subagent    │  ← prompted with K1–K6 taxonomy,
   │ (one per chapter)        │     R1–R9 rules, chapter source,
   └──────────────────────────┘     existing summary, target output path
            │
            ▼
   learn-output/<slug>/notebooks/chapter-NN.py     (~1000 lines marimo)
            │
            ▼
   ┌──────────────────────────┐
   │ static checks (4 greps)  │  ← R3, R4, R1+R6, R5 detection
   └──────────────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ marimo check             │  ← marimo's own static validation
   └──────────────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ marimo export html-wasm  │  ← --mode run --no-show-code
   └──────────────────────────┘
            │
            ▼
   learn-output/<slug>/dist/chapter-NN/   (~27-29 MB bundle)
            │
            ▼
   ┌──────────────────────────┐
   │ post-export: symlink     │  ← R9: ln -sf public/figures dist/figures
   │ figures if referenced    │
   └──────────────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ optional: CDP verify     │  ← headless Chrome, capture exceptions
   │ (when --strict flag set) │     for 90 sec — fail skill if any
   └──────────────────────────┘
```

Each chapter is independent. If chapter 12 fails verification, chapters 1–11 are still good. The skill is idempotent — re-running skips chapters whose notebook already exists (matching the `summarize-book` skill's resume-after-rate-limit behavior).

---

## 6. Multi-chapter shell

### The architectural question

A 32-chapter book × 27 MB Pyodide bundle each = ~864 MB if naïvely served. The Pyodide *core* is shared across chapters by the browser HTTP cache after the first load, so the cost on disk and on cold-load (after chapter 1) is much smaller in practice — but the shell architecture decides whether the user experiences a 30-second wait *per chapter* or *once per book*.

### Three options considered

| Option | Description | Pro | Con |
|---|---|---|---|
| A — Per-chapter marimo apps, separate origins | `dist/ch01/`, `dist/ch02/`, ... each is independent | Trivial parallelization | Each chapter is a fresh Pyodide boot — 30s every click |
| B — Single book-wide marimo app | One `.py` for all 32 chapters with internal chapter switching | One Pyodide boot for the whole book | One 32,000-line file the subagent can't author incrementally |
| **C — Per-chapter apps + iframe shell + shared service worker** | Each chapter is its own marimo app under one origin; a top-level `index.html` swaps an iframe; service worker pre-caches Pyodide core | Per-chapter generation, shared Pyodide cache, instant chapter switching after first load | Service worker setup adds ~50 lines of boilerplate |

### Recommendation: **Option C**

```
learn-output/<slug>/
├── index.html                  # Shell: sidebar TOC + iframe + chapter nav JS
├── shell.css                   # Distill-inspired typography for the shell
├── sw.js                       # Service worker that pre-caches Pyodide assets
├── chapters.json               # Generated manifest: [{n: 1, title: "...", path: "ch01/"}]
└── ch01/, ch02/, ...           # Per-chapter marimo WASM bundles
    └── index.html              # The marimo-generated chapter page
```

The shell's `index.html`:
- Renders a left sidebar with the chapter list (from `chapters.json`)
- Hosts a full-height `<iframe src="ch01/index.html">` that swaps when user clicks a chapter
- Registers `sw.js` which pre-caches the Pyodide WASM/core on first load — chapter 1 takes ~30s, every subsequent chapter is instant

This is the smallest design that solves the cold-load-per-chapter problem without requiring the subagent to author monster files.

---

## 7. The `/learn-book` skill

### Inputs
- `<slug>` — the book directory under `book-output/`
- `--strict` (optional) — run CDP verification per chapter; fail if any exceptions
- `--chapter <N>` (optional) — generate only that chapter, useful for iteration

### Behavior

1. Resolve `book-output/<slug>/raw-chapters/`. If missing, instruct the user to run `/parse-book` first and exit.
2. Read `book-output/<slug>/metadata.json` and any pre-existing `book-output/<slug>/summaries/` to provide the subagent with context.
3. For each chapter file:
   - If `learn-output/<slug>/notebooks/chapter-NN.py` already exists, skip.
   - Dispatch a `book-analyst` subagent with the **learn-chapter prompt template** (see §8).
   - Run the four static checks against the produced `.py`. Re-prompt the agent up to twice if a check fails.
   - Run `marimo check`. Re-prompt once if it fails.
   - Run `marimo export html-wasm` to `learn-output/<slug>/dist/chapter-NN/`.
   - Apply the figures symlink (R9) if the notebook references `figures/`.
   - If `--strict`, run CDP verification. Mark chapter as failed if any Pyodide exception is captured.
4. After all chapters, generate `learn-output/<slug>/index.html`, `chapters.json`, `shell.css`, `sw.js`.
5. Print serving instructions: `cd learn-output/<slug> && python3 -m http.server 8000` then open `http://localhost:8000`.

### Failure modes
- Subagent produces a notebook that fails static checks twice in a row → leave a stub `chapter-NN.py.failed` and skip; user can retry per-chapter.
- Marimo export fails → print stderr and skip.
- CDP verification fails in strict mode → leave the WASM bundle but write a `chapter-NN.failed.log` with the captured exception.

The skill is **resumable**: re-running picks up where it left off.

---

## 8. Subagent prompt template structure

The `book-analyst` invocation for `/learn-book` has a different structure than for `/summarize-book`. It is built from these sections, in this order:

1. **Output contract.** Exact file path to write. "Write ONE Python file. Do not write markdown, tests, or anything else."
2. **Reference template.** "Read `prototypes/option-f/networks_ch02.py` for visual chrome / cell structure / matplotlib pattern."
3. **Source material.** Inline paste of the chapter's `raw-chapters/chapter-NN.md` and `summaries/chapter-NN-summary.md`.
4. **Widget shopping list.** A fully specified list of 6-12 widgets to build, chosen by the skill based on the content-type → mix table from §3. The skill makes the design decisions; the subagent implements.
5. **Bug-class rules.** The R1–R9 rules from §4, verbatim, with examples of correct and incorrect patterns.
6. **Acceptance criteria.** Self-verification commands the agent must run before claiming completion.

This structure was validated empirically on Influence Ch.1: the subagent produced 980 lines passing all four static checks and `marimo check` on the first try, with zero Pyodide errors in CDP verification.

---

## 9. File layout

```
book-distiller/
├── .claude/skills/
│   ├── learn-book/
│   │   ├── SKILL.md                       # NEW
│   │   ├── chapter-prompt-template.md     # NEW — subagent prompt with placeholders
│   │   ├── widget-taxonomy.md             # NEW — K1–K6 reference, copied into agent prompt
│   │   ├── pyodide-rules.md               # NEW — R1–R9 reference, copied into agent prompt
│   │   ├── shell-template/                # NEW — index.html, shell.css, sw.js templates
│   │   └── static-checks.sh               # NEW — the 4 grep checks as a script
│   └── ... (existing skills unchanged)
├── prototypes/option-f/                   # ALREADY EXISTS — three prototypes
│   ├── networks_ch02.py
│   ├── networks_ch03.py
│   └── influence_ch01.py
└── learn-output/                          # NEW — git-ignored, generated by /learn-book
    └── <slug>/
        ├── notebooks/chapter-NN.py
        ├── dist/chapter-NN/
        ├── index.html
        ├── chapters.json
        ├── shell.css
        └── sw.js
```

---

## 10. Verification pipeline (defined separately so it can be reused)

The four static checks (run as grep patterns on the produced `.py`, expected to print no matches):

```bash
# R3: _-prefixed name returned across cells
grep -nE "return.*\(_[a-z][a-z_0-9]*[,)]"

# R4: same-cell .value chained off mo.ui.X(...)
grep -nE "mo\.ui\.[a-z]+\([^)]*\)\.value"

# R1+R6: forbidden libraries / scipy-requiring nx calls
grep -nE "\b(scipy|pandas|plotly|sklearn|seaborn|spring_layout|kamada_kawai|to_scipy_sparse_array)\b"

# R5: tuple-expression returns
grep -nE "return mo\.(md|vstack|hstack|callout|image)\([^)]*\),\s*mo\."
```

CDP verification (used in `--strict` mode and during skill development):
- Start headless Chrome with `--remote-debugging-port=9222 --disable-application-cache`
- Connect via Chrome DevTools Protocol
- Subscribe to `Runtime.exceptionThrown`, `Runtime.consoleAPICalled`, `Log.entryAdded`
- Navigate to the chapter URL, wait 90 seconds
- Pass if zero `[EXCEPTION]` entries captured

Both pipelines exist as working scripts in `prototypes/option-f/` and should be promoted into the skill.

---

## 11. Risks & open questions

**Generation cost.** Each chapter takes the subagent ~30–40 minutes and ~1000 lines. A 32-chapter book is ~16–20 hours of subagent compute. Worth it for a personal library but flagging.

**Subagent reliability.** Despite R1–R9 encoded as authoring constraints, ch.2 had 3 Pyodide bugs and ch.3 had 2 bugs that only CDP verification caught. The static checks catch most but not all. Recommendation: `--strict` mode that runs CDP verification per chapter, accepting the time cost.

**Cold load.** ~27–29 MB per book on first visit. With service worker pre-caching, subsequent chapters are instant. With cold load on a fresh device, the first chapter has a 20–30s "Loading marimo…" wait. The shell should show a clear loading state.

**Prose-only chapters.** If a chapter has no widget-worthy content (very rare in practice — even pure prose has K3/K5/K6 surface), the skill should still produce a marimo notebook with at least a chapter title, the summary, a knowls-style accordion, and one or two K5 quiz widgets. We have not yet hit a chapter with literally nothing to interact with.

**Books we haven't tested.** *Attention Is All You Need* (single-paper, very technical) and pure literary fiction (Metamorphosis) are edge cases. The skill should produce sensible output but the widget mix table doesn't cover them yet — likely "treat as math/CS heavy" and "treat as prose + K5-only" respectively.

**Marimo update churn.** Marimo is on 0.23.5 today and moves fast. The skill should pin a known-good version in its prompt and update intentionally.

---

## 12. Success criteria

The skill is considered complete when:

1. `/learn-book networks-book` produces a runnable bundle for ch.2 and ch.3 indistinguishable in widget count and behavior from the three prototypes.
2. `/learn-book influence` produces a runnable bundle for at least Ch.1 (Cialdini Ch.1) matching the prototype.
3. The shell at `learn-output/<slug>/index.html` serves chapters with instant switching after first load.
4. `--strict` mode catches at least one real bug on a fresh generation (proves the verification pipeline isn't decorative).
5. The four static checks are part of the skill's loop, not a manual step.
