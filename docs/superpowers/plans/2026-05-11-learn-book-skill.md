# /learn-book Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/learn-book <slug>` skill that turns a parsed book into a runnable multi-chapter marimo WASM site with interactive widgets, per the 2026-05-11 design spec.

**Architecture:** Markdown-orchestrated skill (no new TypeScript). The SKILL.md drives a per-chapter loop that dispatches `book-analyst` subagents, runs static + runtime checks, exports each chapter to a WASM bundle, and assembles a shell `index.html` with iframe-based chapter switching and a service worker that opportunistically caches Pyodide assets on first fetch.

**Tech Stack:**
- Skill: markdown + bash (matches existing `summarize-book`, `practice-book` pattern)
- Static checks: `grep -E` patterns in a bash script
- Runtime checks: Python script using Chrome DevTools Protocol over websockets (already prototyped at `/tmp/cdp_capture.py`)
- Chapter notebooks: Python (marimo 0.23.x, Pyodide-safe subset)
- Shell: plain HTML + CSS + vanilla JS + a 30-line service worker

**Spec reference:** `docs/superpowers/specs/2026-05-11-interactive-learning-design.md`

**Working prototypes (reference templates):**
- `prototypes/option-f/networks_ch02.py` (math, K1+K4 heavy)
- `prototypes/option-f/networks_ch03.py` (proofs, K3+K4 heavy)
- `prototypes/option-f/influence_ch01.py` (prose, K3+K5+K6 heavy)

---

## Task 1: Build the static-check script (with TDD)

The 4 grep patterns from spec §10. Each must catch a known-bad fixture and let a known-good fixture through. Then the three working prototypes must all pass.

**Files:**
- Create: `.claude/skills/learn-book/static-checks.sh`
- Create: `.claude/skills/learn-book/test-fixtures/good.py`
- Create: `.claude/skills/learn-book/test-fixtures/bad-r3-underscore-cross-cell.py`
- Create: `.claude/skills/learn-book/test-fixtures/bad-r4-samecell-value.py`
- Create: `.claude/skills/learn-book/test-fixtures/bad-r1-scipy.py`
- Create: `.claude/skills/learn-book/test-fixtures/bad-r5-tuple-return.py`
- Create: `.claude/skills/learn-book/tests/test-static-checks.sh`

---

- [ ] **Step 1: Write failing tests first**

Create `.claude/skills/learn-book/tests/test-static-checks.sh`:

```bash
#!/usr/bin/env bash
# Test the static-checks.sh against fixtures and the three working prototypes.
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
CHECK="$SKILL_DIR/static-checks.sh"
FIX="$SKILL_DIR/test-fixtures"

fail=0
assert_pass () {
  local label="$1" file="$2"
  if bash "$CHECK" "$file" >/dev/null 2>&1; then
    echo "PASS  $label"
  else
    echo "FAIL  $label (expected exit 0, got $?)"; fail=1
  fi
}
assert_fail () {
  local label="$1" file="$2"
  if bash "$CHECK" "$file" >/dev/null 2>&1; then
    echo "FAIL  $label (expected non-zero, got 0)"; fail=1
  else
    echo "PASS  $label"
  fi
}

assert_pass "good fixture"                     "$FIX/good.py"
assert_fail "R3 underscored cross-cell return" "$FIX/bad-r3-underscore-cross-cell.py"
assert_fail "R4 same-cell .value access"       "$FIX/bad-r4-samecell-value.py"
assert_fail "R1 forbidden scipy import"        "$FIX/bad-r1-scipy.py"
assert_fail "R5 tuple-expression return"       "$FIX/bad-r5-tuple-return.py"
assert_pass "prototype networks_ch02.py"       "$REPO_ROOT/prototypes/option-f/networks_ch02.py"
assert_pass "prototype networks_ch03.py"       "$REPO_ROOT/prototypes/option-f/networks_ch03.py"
assert_pass "prototype influence_ch01.py"      "$REPO_ROOT/prototypes/option-f/influence_ch01.py"

exit $fail
```

Make it executable:

```bash
chmod +x .claude/skills/learn-book/tests/test-static-checks.sh
```

- [ ] **Step 2: Create test fixtures**

Create `.claude/skills/learn-book/test-fixtures/good.py`:

```python
import marimo
app = marimo.App(width="medium")

@app.cell(hide_code=True)
def _imports():
    import marimo as mo
    import matplotlib.pyplot as plt
    import io
    return io, mo, plt

@app.cell(hide_code=True)
def _picker(mo):
    my_picker = mo.ui.dropdown(options=["a", "b"], value="a")
    return (my_picker,)

@app.cell(hide_code=True)
def _display(mo, my_picker):
    return mo.md(f"You picked: {my_picker.value}")

if __name__ == "__main__":
    app.run()
```

Create `.claude/skills/learn-book/test-fixtures/bad-r3-underscore-cross-cell.py`:

```python
import marimo
app = marimo.App()

@app.cell
def _one():
    _hidden = 42
    return (_hidden,)
```

Create `.claude/skills/learn-book/test-fixtures/bad-r4-samecell-value.py`:

```python
import marimo
app = marimo.App()

@app.cell
def _bad(mo):
    picked = mo.ui.dropdown(options=["x"]).value
    return picked
```

Create `.claude/skills/learn-book/test-fixtures/bad-r1-scipy.py`:

```python
import marimo
import scipy.sparse
import networkx as nx
app = marimo.App()

@app.cell
def _layout(nx):
    G = nx.cycle_graph(5)
    pos = nx.spring_layout(G)
    return pos
```

Create `.claude/skills/learn-book/test-fixtures/bad-r5-tuple-return.py`:

```python
import marimo
app = marimo.App()

@app.cell
def _bad(mo):
    return mo.md("hello"), mo.vstack([mo.md("world")])
```

- [ ] **Step 3: Run the test script to confirm it fails (no static-checks.sh yet)**

Run: `bash .claude/skills/learn-book/tests/test-static-checks.sh`
Expected: every line says `FAIL` because the script doesn't exist.

- [ ] **Step 4: Write the static-checks.sh**

Create `.claude/skills/learn-book/static-checks.sh`:

```bash
#!/usr/bin/env bash
# Static checks for marimo notebooks generated by /learn-book.
# Catches the four bug classes (R1, R3, R4, R5) that are invisible to `marimo check`
# but break the WASM runtime. Exit 0 if clean; exit 1 if any pattern matches.
set -u

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <notebook.py>" >&2
  exit 2
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "static-checks: file not found: $FILE" >&2
  exit 2
fi

violations=0

check () {
  local label="$1" pattern="$2"
  local hits
  hits="$(grep -nE "$pattern" "$FILE" || true)"
  if [ -n "$hits" ]; then
    echo "[FAIL] $label"
    echo "$hits" | sed 's/^/        /'
    violations=$((violations+1))
  fi
}

# R3: _-prefixed name returned across cells, e.g. `return (_foo,)` or `return _foo, _bar`
check "R3 (_-prefixed cross-cell return)" "return.*\(_[a-z][a-z_0-9]*[,)]"

# R4: chained .value off mo.ui.X(...) inside the same cell
check "R4 (same-cell .value access)" "mo\.ui\.[a-z]+\([^)]*\)\.value"

# R1+R6: forbidden libraries / scipy-requiring networkx calls
check "R1/R6 (forbidden lib or scipy-requiring nx call)" "\\b(scipy|pandas|plotly|sklearn|seaborn|spring_layout|kamada_kawai|to_scipy_sparse_array)\\b"

# R5: tuple-expression returns of marimo render objects
check "R5 (tuple-expression return)" "return mo\\.(md|vstack|hstack|callout|image)\\([^)]*\\),[[:space:]]*mo\\."

if [ "$violations" -eq 0 ]; then
  exit 0
fi
exit 1
```

Make it executable:

```bash
chmod +x .claude/skills/learn-book/static-checks.sh
```

- [ ] **Step 5: Run the test script and verify it passes**

Run: `bash .claude/skills/learn-book/tests/test-static-checks.sh`
Expected: every line says `PASS`. Exit code 0.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/learn-book/static-checks.sh \
        .claude/skills/learn-book/tests/test-static-checks.sh \
        .claude/skills/learn-book/test-fixtures/
git commit -m "feat: add static-check script for marimo chapter notebooks"
```

---

## Task 2: Widget taxonomy reference file (K1-K6)

This is the verbatim content embedded into every subagent prompt. It teaches the agent the six widget kinds and the content-type-to-mix table.

**Files:**
- Create: `.claude/skills/learn-book/widget-taxonomy.md`

---

- [ ] **Step 1: Write the widget taxonomy file**

Create `.claude/skills/learn-book/widget-taxonomy.md`. Copy the full §3 of the spec verbatim, formatted as a standalone reference. Below is the exact content to write:

```markdown
# Widget Taxonomy (K1–K6)

Six widget kinds. Each is defined by what the reader does and what they see in response.

## K1 — Live structure

Reader manipulates a graph, sequence, or data structure; downstream computation re-runs.
**Example** (Networks Ch.2): type comma-separated edges like `A-B, B-C, A-D`; the notebook draws the graph, computes degree, connected components, BFS distances.
**Fits:** chapters where the central object is a structure that can be drawn.

## K2 — Real-dataset explorer

Reader picks a subset, axis, or filter of a real dataset cited in the book; chart re-renders.
**Example** (Influence Ch.1): bar chart of Langer's three Xerox-machine compliance conditions (60% / 93% / 94%).
**Fits:** chapters that cite a specific empirical study with numbers.

## K3 — Phenomenon recreator

Reader runs the experiment from the book; the widget simulates the mechanism and shows the outcome.
**Example** (Influence Ch.1, three-buckets-of-water): pick left-hand and right-hand starting temperatures; the chart shows how the same lukewarm bucket feels different to each hand.
**Fits:** chapters that describe a named mechanism, principle, or experiment.

## K4 — Annotated figure

A figure from the book is shown with reader-toggleable overlays (highlights, callouts, decompositions).
**Example** (Networks Ch.3): Fig 3.7 (overlap vs. tie strength) with a hover-toggle that reveals the underlying clustering coefficient calculation.
**Fits:** chapters with rich visual figures the book itself uses to make a point.

## K5 — Scenario / quiz feedback

Reader picks an answer to a scenario; widget responds with green/red feedback and an explanation.
**Example** (Influence Ch.1): "A car salesman waits until you've agreed to a $25,000 sedan before mentioning the $1,200 leather seats — which weapon is in play?"
**Fits:** every chapter — the universal active-recall surface.

## K6 — Phrase / scenario builder

Reader assembles a request, communication, or scenario from a small set of parts; widget predicts an outcome based on rules from the chapter.
**Example** (Influence Ch.1): pick opener × reason structure × stake → predicted compliance %.
**Fits:** chapters about rules of communication, persuasion, negotiation, or any domain where the principle is "constructing X gets you Y."

## Content-type → widget mix

The skill picks widget kinds based on the chapter's character:

| Chapter character          | K1  | K2  | K3  | K4  | K5  | K6  |
|----------------------------|-----|-----|-----|-----|-----|-----|
| Math/CS, structures        | 50% | 10% | 20% | 10% | 10% | 0%  |
| Math/CS, proofs + data     | 30% | 10% | 30% | 20% | 10% | 0%  |
| Prose, anecdote-driven     | 0%  | 10% | 35% | 0%  | 35% | 20% |
| Reference book (mixed)     | 20% | 20% | 20% | 10% | 20% | 10% |

Target per chapter: **6–12 widgets total**. Less than 6 feels thin; more than 12 feels crowded.
```

- [ ] **Step 2: Visually inspect**

Run: `cat .claude/skills/learn-book/widget-taxonomy.md | wc -l`
Expected: around 55 lines. Open the file and confirm all six widget kinds and the table are present.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/learn-book/widget-taxonomy.md
git commit -m "feat: add K1-K6 widget taxonomy reference for /learn-book"
```

---

## Task 3: Pyodide / marimo authoring rules reference (R1-R9)

Same pattern as Task 2: a verbatim reference file embedded into every subagent prompt.

**Files:**
- Create: `.claude/skills/learn-book/pyodide-rules.md`

---

- [ ] **Step 1: Write the rules file**

Create `.claude/skills/learn-book/pyodide-rules.md`. Below is the exact content to write:

```markdown
# Pyodide / marimo Authoring Rules (R1–R9)

These nine bug classes pass `marimo check` but break the WASM browser runtime. Every chapter notebook MUST avoid all of them.

## R1 — Library whitelist

Allow only: `marimo`, `numpy`, `matplotlib.pyplot`, `io`, `random`, `math`, `collections`, `networkx` (math chapters only, with R6 caveat).
Forbid: `scipy`, `pandas`, `plotly`, `sklearn`, `seaborn`, `requests`, `bs4`.
**Why:** these aren't pre-installed in Pyodide; importing them throws ModuleNotFoundError at boot.

## R2 — Cell variable uniqueness

Every top-level name in a cell becomes a marimo "definition" and MUST be unique across the entire notebook OR prefixed with `_` to be cell-local.
**Why:** marimo errors with "Multiple definitions of name `foo`."

## R3 — `_`-prefixed names cannot cross cells

If a value needs to be read in another cell, give it a unique non-underscored name.
```python
# WRONG — _picker is cell-local
@app.cell
def _one(mo):
    _picker = mo.ui.dropdown(options=["a"])
    return (_picker,)

# RIGHT
@app.cell
def _one(mo):
    my_picker = mo.ui.dropdown(options=["a"])
    return (my_picker,)
```

## R4 — Widget creation and `.value` access in separate cells

A `mo.ui.X(...)` and the read of its `.value` must be in different cells.
```python
# WRONG — same-cell .value
@app.cell
def _bad(mo):
    chosen = mo.ui.dropdown(options=["a"]).value
    return chosen

# RIGHT — split picker + display
@app.cell
def _picker(mo):
    picker = mo.ui.dropdown(options=["a"])
    return (picker,)

@app.cell
def _display(mo, picker):
    return mo.md(f"You picked {picker.value}")
```

## R5 — No tuple-expression returns

`return mo.md("..."), mo.vstack(...)` parses as a tuple; marimo renders only one element.
```python
# WRONG
return mo.md("hi"), mo.vstack([item])

# RIGHT
return mo.vstack([mo.md("hi"), item])
```

## R6 — No scipy-requiring networkx functions

Avoid `nx.spring_layout`, `nx.kamada_kawai_layout`, `nx.to_scipy_sparse_array`.
Use `nx.circular_layout`, `nx.random_layout`, or a hand-built dict:
```python
rng = random.Random(42)
pos = {n: (rng.random(), rng.random()) for n in G.nodes()}
```

## R7 — No orphan nodes or unreferenced options

Every node referenced anywhere must be in the master node list. Same for edges, dropdown options, scenarios. Mismatch causes `NetworkXError: Node 'X' has no position` or silent KeyError.

## R8 — `mo.ui.radio` returns the label string, not the index

Conditionals must check `==` against the exact option string:
```python
if my_radio.value == "Contrast Principle":
    feedback = "Correct!"
```

## R9 — Post-export figures symlink (skill-level concern, not agent-level)

After `marimo export html-wasm`, if the notebook references `figures/...`, the skill must run `ln -sf public/figures dist/figures`. Marimo's export puts assets at `dist/public/figures/` but notebook references are relative.

## Matplotlib output pattern (use this exactly)

```python
@app.cell(hide_code=True)
def _plot(mo, plt, io):
    _fig, _ax = plt.subplots(figsize=(7, 4))
    # ... plotting ...
    _buf = io.BytesIO()
    _fig.savefig(_buf, format="png", dpi=140, bbox_inches="tight")
    plt.close(_fig)
    _buf.seek(0)
    return mo.image(_buf.read(), width="100%")
```
```

- [ ] **Step 2: Visually inspect**

Run: `cat .claude/skills/learn-book/pyodide-rules.md | wc -l`
Expected: around 90 lines. Open the file and confirm all 9 rules + the matplotlib pattern are present.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/learn-book/pyodide-rules.md
git commit -m "feat: add R1-R9 Pyodide authoring rules reference for /learn-book"
```

---

## Task 4: Chapter subagent prompt template

This is the message the SKILL.md sends to each `book-analyst` subagent. It uses `{PLACEHOLDER}` markers that the SKILL.md substitutes per chapter.

**Files:**
- Create: `.claude/skills/learn-book/chapter-prompt-template.md`

---

- [ ] **Step 1: Write the template**

Create `.claude/skills/learn-book/chapter-prompt-template.md`:

```markdown
# Build an interactive marimo notebook for one book chapter.

## Output contract

Write ONE Python file to this exact path: `{OUTPUT_PY_PATH}`

Do NOT write any other files. No markdown summaries, no tests, no extra .py files. Just the one chapter notebook.

## Reference template — read this first

Read `{REFERENCE_TEMPLATE_PATH}` end to end. Match its structure exactly:
- `import marimo` + `app = marimo.App(...)` at the top
- `@app.cell(hide_code=True)` on every cell
- An imports cell first (returning mo, plt, io, random, etc.)
- A CSS injection cell next (styling for chapter typography, callouts, knowls)
- Alternating markdown explainer cells and widget cells
- Closing `if __name__ == "__main__": app.run()`

Visual chrome to replicate: a streak/progress callout at the top, a sidebar TOC, `mo.accordion` "knowls" for asides, generous `mo.callout` use, KaTeX math via `$...$` only if the chapter has math.

## Source material — read both

- Chapter raw text: `{CHAPTER_RAW_PATH}`
- Chapter deep summary: `{CHAPTER_SUMMARY_PATH}`

Read both before writing anything. The summary tells you the structure of ideas; the raw text gives you the exact wording, examples, and data the user will recognize.

## Chapter character

`{CHAPTER_CHARACTER}` (one of: math/CS structures, math/CS proofs+data, prose anecdote-driven, reference mixed)

## Widget shopping list — build all of these, in this order, in this style

The skill has decided this chapter should have these {WIDGET_COUNT} widgets. Build them exactly as described. Do not substitute or skip.

{WIDGET_SHOPPING_LIST}

## Authoring rules (R1–R9)

You MUST follow every rule below. These bugs are invisible to `marimo check` and only surface at runtime in the browser. If you violate any of them, the page throws a Pyodide internal error.

{PYODIDE_RULES_INLINE}

## Widget taxonomy reference

{WIDGET_TAXONOMY_INLINE}

## Acceptance criteria

Before responding with completion, you MUST run these commands and they MUST all succeed:

1. `python3 -c "import ast; ast.parse(open('{OUTPUT_PY_PATH}').read())"` — syntactic correctness
2. `cd {REPO_ROOT} && bash .claude/skills/learn-book/static-checks.sh {OUTPUT_PY_PATH}` — bug-class scan
3. `cd {REPO_ROOT}/prototypes/option-f && /Users/alanguyen/Library/Python/3.12/bin/marimo check {OUTPUT_PY_PATH}` — marimo's own validation

If any check fails, fix the issue and re-run. Do not respond with completion until all three pass.

## Response format

When done, respond with ONLY this one line:

`✓ chapter-NN.py done (lines: NNN, widgets: N)`

Do not explain. Do not write anything else.
```

- [ ] **Step 2: Verify the placeholders exist**

Run:
```bash
grep -oE "\{[A-Z_]+\}" .claude/skills/learn-book/chapter-prompt-template.md | sort -u
```

Expected output (exactly these 8 placeholders):
```
{CHAPTER_CHARACTER}
{CHAPTER_RAW_PATH}
{CHAPTER_SUMMARY_PATH}
{OUTPUT_PY_PATH}
{PYODIDE_RULES_INLINE}
{REFERENCE_TEMPLATE_PATH}
{REPO_ROOT}
{WIDGET_COUNT}
{WIDGET_SHOPPING_LIST}
{WIDGET_TAXONOMY_INLINE}
```

If the count differs, edit the template to add or remove placeholders as needed.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/learn-book/chapter-prompt-template.md
git commit -m "feat: add chapter subagent prompt template for /learn-book"
```

---

## Task 5: CDP runtime verification script (`--strict` mode)

Promote the working `/tmp/cdp_capture.py` into the skill folder with a cleaner CLI. This script runs in `--strict` mode and per the spec's success criterion #4.

**Files:**
- Create: `.claude/skills/learn-book/cdp-verify.py`
- Create: `.claude/skills/learn-book/tests/test-cdp-verify.sh`

---

- [ ] **Step 1: Write the verification script**

Create `.claude/skills/learn-book/cdp-verify.py`:

```python
#!/usr/bin/env python3
"""
CDP runtime verifier for /learn-book chapters.

Connects to a headless Chrome at 127.0.0.1:9222, navigates to the given URL,
listens for Pyodide exceptions for WAIT seconds, then exits.

Exit codes:
  0 — clean run (no exceptions)
  1 — one or more exceptions captured
  2 — could not connect to Chrome (likely Chrome not running on 9222)

Usage:
  python3 cdp-verify.py <url> [--wait SECONDS]

Requires:
  pip install websockets
"""
import argparse
import asyncio
import json
import sys
import urllib.request
import urllib.error

try:
    import websockets
except ImportError:
    print("cdp-verify: need `pip install websockets`", file=sys.stderr)
    sys.exit(2)


def get_target_ws() -> str:
    data = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=2))
    page = next(t for t in data if t["type"] == "page")
    return page["webSocketDebuggerUrl"]


async def run(url: str, wait: int) -> int:
    try:
        ws_url = get_target_ws()
    except (urllib.error.URLError, OSError, StopIteration) as exc:
        print(f"cdp-verify: cannot reach Chrome on 9222: {exc}", file=sys.stderr)
        return 2

    print(f"[cdp] connecting {ws_url}", file=sys.stderr)
    async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as ws:
        next_id = [1]

        async def send(method, params=None):
            i = next_id[0]
            next_id[0] += 1
            await ws.send(json.dumps({"id": i, "method": method, "params": params or {}}))
            return i

        await send("Runtime.enable")
        await send("Log.enable")
        await send("Page.enable")
        await send("Page.navigate", {"url": url})

        loop = asyncio.get_event_loop()
        end = loop.time() + wait
        errors = []
        while loop.time() < end:
            remaining = max(0.1, min(5.0, end - loop.time()))
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=remaining)
            except asyncio.TimeoutError:
                continue
            data = json.loads(msg)
            method = data.get("method", "")
            params = data.get("params", {})
            if method == "Runtime.exceptionThrown":
                ed = params.get("exceptionDetails", {})
                text = ed.get("text", "")
                desc = ed.get("exception", {}).get("description", "")
                errors.append(f"[EXCEPTION] {text}\n  {desc[:1500]}")
                print(errors[-1])
            elif method == "Runtime.consoleAPICalled":
                if params.get("type") == "error":
                    args = params.get("args", [])
                    txt = " ".join(a.get("value", a.get("description", "")) or "" for a in args)
                    errors.append(f"[console.error] {txt[:1500]}")
                    print(errors[-1])

        print(f"[cdp] done; {len(errors)} exceptions captured", file=sys.stderr)
        return 1 if errors else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--wait", type=int, default=90, help="seconds to listen for errors")
    args = ap.parse_args()
    rc = asyncio.run(run(args.url, args.wait))
    sys.exit(rc)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Make it executable and test imports**

```bash
chmod +x .claude/skills/learn-book/cdp-verify.py
python3 -c "import ast; ast.parse(open('.claude/skills/learn-book/cdp-verify.py').read())"
```

Expected: silent success.

- [ ] **Step 3: Write a test that uses a known-good page**

Create `.claude/skills/learn-book/tests/test-cdp-verify.sh`:

```bash
#!/usr/bin/env bash
# Integration test for cdp-verify.py.
# Requires: headless Chrome running on 127.0.0.1:9222, and the influence_ch01
# WASM bundle already served on 127.0.0.1:8767 (per prototypes/option-f setup).
# If neither is up, this test self-skips.
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERIFY="$SCRIPT_DIR/../cdp-verify.py"

# Probe Chrome
if ! curl -sf http://127.0.0.1:9222/json/version >/dev/null; then
  echo "SKIP  Chrome not on 9222 (start with --remote-debugging-port=9222 to run this test)"
  exit 0
fi

# Probe the prototype server
if ! curl -sf http://127.0.0.1:8767/ >/dev/null; then
  echo "SKIP  prototype server not on 8767 (start with python3 -m http.server 8767 in dist-influence-ch01/)"
  exit 0
fi

# Known-good URL: the influence_ch01 prototype passed CDP cleanly during spec work
if python3 "$VERIFY" "http://127.0.0.1:8767/?cb=$(date +%s)" --wait 60 >/tmp/cdp-test.log 2>&1; then
  echo "PASS  influence_ch01 returns exit 0 (no exceptions)"
  exit 0
else
  rc=$?
  echo "FAIL  cdp-verify on known-good page returned $rc"
  tail -20 /tmp/cdp-test.log
  exit 1
fi
```

```bash
chmod +x .claude/skills/learn-book/tests/test-cdp-verify.sh
```

- [ ] **Step 4: Run the integration test if Chrome+server are up**

```bash
bash .claude/skills/learn-book/tests/test-cdp-verify.sh
```

Expected: `PASS  influence_ch01 returns exit 0` if both probes succeed, or `SKIP` lines otherwise.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/learn-book/cdp-verify.py \
        .claude/skills/learn-book/tests/test-cdp-verify.sh
git commit -m "feat: add CDP runtime verifier for /learn-book strict mode"
```

---

## Task 6: Multi-chapter shell templates

Three static files that get copied verbatim into every generated book bundle. The shell reads `chapters.json` at runtime — no build-time substitution needed.

**Files:**
- Create: `.claude/skills/learn-book/shell-template/index.html`
- Create: `.claude/skills/learn-book/shell-template/shell.css`
- Create: `.claude/skills/learn-book/shell-template/sw.js`

---

- [ ] **Step 1: Write index.html**

Create `.claude/skills/learn-book/shell-template/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Book Shell</title>
  <link rel="stylesheet" href="shell.css">
</head>
<body>
  <aside id="sidebar">
    <h1 id="book-title">Loading…</h1>
    <nav id="chapter-nav"></nav>
  </aside>
  <main id="content">
    <iframe id="chapter-frame" src="about:blank" title="Chapter content"></iframe>
  </main>

  <script>
    async function init() {
      const manifest = await fetch("chapters.json").then(r => r.json());
      document.getElementById("book-title").textContent = manifest.title || "Book";
      const nav = document.getElementById("chapter-nav");
      const frame = document.getElementById("chapter-frame");

      function selectChapter(path) {
        frame.src = path + "index.html";
        document.querySelectorAll("#chapter-nav a").forEach(a => {
          a.classList.toggle("active", a.dataset.path === path);
        });
        history.replaceState({}, "", "?ch=" + encodeURIComponent(path));
      }

      manifest.chapters.forEach((ch, i) => {
        const a = document.createElement("a");
        a.href = "#";
        a.dataset.path = ch.path;
        a.innerHTML = `<span class="ch-num">${ch.number}</span><span class="ch-title">${ch.title}</span>`;
        a.addEventListener("click", e => { e.preventDefault(); selectChapter(ch.path); });
        nav.appendChild(a);
      });

      // Restore from URL or start with chapter 1
      const requested = new URLSearchParams(location.search).get("ch");
      const initial = manifest.chapters.find(c => c.path === requested) || manifest.chapters[0];
      if (initial) selectChapter(initial.path);

      // Register the service worker (best-effort; secure-context-required)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(err => console.warn("sw register failed", err));
      }
    }

    init().catch(err => {
      document.body.innerHTML = "<pre>Shell init failed: " + (err && err.message) + "</pre>";
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Write shell.css**

Create `.claude/skills/learn-book/shell-template/shell.css`:

```css
:root {
  --bg: #fafaf7;
  --fg: #1a1a1a;
  --accent: #1f487e;
  --muted: #f0eee8;
  --border: #d8d5cd;
  --sidebar-w: 280px;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; background: var(--bg); color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { display: flex; }

#sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--muted);
  border-right: 1px solid var(--border);
  padding: 24px 18px;
  overflow-y: auto;
  height: 100vh;
}

#book-title {
  margin: 0 0 18px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--accent);
  text-transform: uppercase;
}

#chapter-nav { display: flex; flex-direction: column; gap: 4px; }
#chapter-nav a {
  text-decoration: none;
  color: var(--fg);
  padding: 8px 10px;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.4;
}
#chapter-nav a:hover { background: rgba(31, 72, 126, 0.08); }
#chapter-nav a.active { background: rgba(31, 72, 126, 0.14); color: var(--accent); font-weight: 600; }
.ch-num { font-variant-numeric: tabular-nums; opacity: 0.55; min-width: 22px; }
.ch-title { flex: 1; }

#content { flex: 1; height: 100vh; }
#chapter-frame { width: 100%; height: 100%; border: none; }
```

- [ ] **Step 3: Write sw.js**

Create `.claude/skills/learn-book/shell-template/sw.js`:

```javascript
// Opportunistic cache for Pyodide assets. On every fetch under /assets/, /public/,
// or for *.wasm, serve from cache if present, otherwise fetch from network and cache.
// First chapter pays the ~27MB Pyodide cost; subsequent chapters are served from cache.
const CACHE = "learn-book-v1";

const shouldCache = url => {
  const u = new URL(url);
  if (u.origin !== self.location.origin) return false;
  return u.pathname.includes("/assets/")
      || u.pathname.includes("/public/")
      || u.pathname.endsWith(".wasm")
      || u.pathname.endsWith(".whl");
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (!shouldCache(event.request.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(event.request);
    if (hit) return hit;
    const resp = await fetch(event.request);
    if (resp.ok) cache.put(event.request, resp.clone());
    return resp;
  })());
});
```

- [ ] **Step 4: Smoke test — verify the templates parse**

```bash
# HTML must have the iframe and the script init function
grep -q 'id="chapter-frame"' .claude/skills/learn-book/shell-template/index.html && echo "PASS html"
grep -q 'fetch("chapters.json")' .claude/skills/learn-book/shell-template/index.html && echo "PASS json fetch"

# CSS must define the sidebar width var
grep -q "sidebar-w" .claude/skills/learn-book/shell-template/shell.css && echo "PASS css"

# JS must have the fetch interceptor
grep -q "addEventListener.*fetch" .claude/skills/learn-book/shell-template/sw.js && echo "PASS sw"
```

Expected: four `PASS` lines.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/learn-book/shell-template/
git commit -m "feat: add multi-chapter shell templates for /learn-book"
```

---

## Task 7: Write the SKILL.md orchestration

The high-level loop. Follows the established pattern from `summarize-book/SKILL.md` and `practice-book/SKILL.md`.

**Files:**
- Create: `.claude/skills/learn-book/SKILL.md`

---

- [ ] **Step 1: Write SKILL.md**

Create `.claude/skills/learn-book/SKILL.md`:

````markdown
---
name: learn-book
description: Generate an interactive marimo-WASM learning bundle for a parsed book. Per-chapter widgets + multi-chapter shell.
disable-model-invocation: true
effort: high
argument-hint: <book-slug> [--strict] [--chapter N]
allowed-tools: Read Write Bash Agent Glob TaskCreate TaskUpdate
---

ultrathink

Build interactive learning bundle for the book with slug: **$ARGUMENTS**

`$0` is the book slug. Optional flags:
- `--strict` — run CDP runtime verification per chapter, fail the chapter if any Pyodide exception is captured
- `--chapter N` — process only chapter number N

## Steps

### 1. Validate input
Read `book-output/$0/metadata.json`. If it doesn't exist: tell the user to run `/parse-book` first and stop.

Also confirm `book-output/$0/summaries/` exists and is non-empty. If missing: tell the user to run `/summarize-book $0` first and stop. The skill embeds each chapter's summary into its subagent prompt — summaries are required, not optional.

### 2. Load reference assets
Read these four files; you will embed parts of them into each subagent prompt:
- `${CLAUDE_SKILL_DIR}/chapter-prompt-template.md` — the prompt skeleton
- `${CLAUDE_SKILL_DIR}/widget-taxonomy.md` — K1–K6 reference (embedded inline)
- `${CLAUDE_SKILL_DIR}/pyodide-rules.md` — R1–R9 reference (embedded inline)
- `prototypes/option-f/networks_ch02.py` — visual chrome reference (path passed by reference, not embedded — the agent reads it itself)

### 3. Create output directories
Ensure these exist:
- `learn-output/$0/notebooks/`
- `learn-output/$0/dist/`

Ensure `learn-output/` is in `.gitignore` (add if missing).

### 4. Determine which chapters to process
- If `--chapter N` was passed: process only the chapter where `chapterNumber == N`
- Otherwise: process all chapters

### 5. Create progress tasks
For every chapter to process, call TaskCreate with subject `"[N/Total] Chapter Title"`.

Status lifecycle: `pending` → `in_progress` (when dispatching) → `completed` (when done or skipped).

### 6. Process chapters sequentially

For each chapter in order:

**a. Check for existing output.**
Use Glob to check if `learn-output/$0/notebooks/<chapter-slug>.py` exists where `<chapter-slug>` is the chapter file name with `.md` replaced by nothing (e.g. `chapter-03.md` → `chapter-03.py`).

If found: mark task completed, print `[N/Total] <Title> — skipped (already done)`. Continue to next chapter.

**b. Decide chapter character.**

Read the chapter raw text and summary. Classify the chapter into ONE of:
- `math/CS structures` — chapter centers on graphs, trees, data structures, algorithms with named structures
- `math/CS proofs+data` — chapter has theorems with proofs and at least one empirical dataset
- `prose anecdote-driven` — chapter is mostly narrative with named principles or mechanisms
- `reference mixed` — chapter is reference-style with diverse content types

Use the widget-taxonomy.md content-type → mix table to determine target widget counts (target total: 6–12 widgets).

**c. Compose the widget shopping list.**

Pick 6–12 specific widgets for THIS chapter based on the character classification and the actual content. For each widget, specify:
- Kind (K1–K6)
- Title (e.g., "Widget 3 — K6-A: Build-a-Request phrase builder")
- Inputs (which `mo.ui.*` controls and their options)
- Computation (one paragraph describing what the widget computes)
- Display (what the user sees in response)

Refer to the three prototypes in `prototypes/option-f/` as worked examples — the widget specs there are exactly the level of detail to produce.

**d. Fill in the prompt template.**

Substitute these placeholders in `chapter-prompt-template.md`:
- `{OUTPUT_PY_PATH}` → absolute path to `learn-output/$0/notebooks/<chapter-slug>.py`
- `{REFERENCE_TEMPLATE_PATH}` → absolute path to the closest matching prototype: `networks_ch02.py` for math/CS structures, `networks_ch03.py` for math/CS proofs+data, `influence_ch01.py` for prose
- `{CHAPTER_RAW_PATH}` → absolute path to `book-output/$0/raw-chapters/<chapter.file>`
- `{CHAPTER_SUMMARY_PATH}` → absolute path to `book-output/$0/summaries/<chapter-slug>-summary.md`
- `{CHAPTER_CHARACTER}` → the character label from step b
- `{WIDGET_COUNT}` → the count of widgets in the shopping list
- `{WIDGET_SHOPPING_LIST}` → the composed shopping list from step c, as a numbered markdown list
- `{PYODIDE_RULES_INLINE}` → the full contents of `pyodide-rules.md`
- `{WIDGET_TAXONOMY_INLINE}` → the full contents of `widget-taxonomy.md`
- `{REPO_ROOT}` → absolute path to the repo root

**e. Dispatch one `book-analyst` subagent.**

Mark the chapter's task in_progress. Print `[N/Total] <Title> — generating notebook…`

Use the Agent tool to dispatch ONE `book-analyst` subagent with the filled-in template as the prompt. Wait for it to complete.

**f. Run static checks. Retry up to twice on failure.**

```
bash .claude/skills/learn-book/static-checks.sh learn-output/$0/notebooks/<chapter-slug>.py
```

If exit code != 0:
- If retries < 2: re-dispatch the same subagent with an appended message: "The static check failed with these violations: <paste output>. Fix the notebook and re-run the acceptance checks before responding." Increment retry counter.
- If retries == 2: mark chapter as failed, write `learn-output/$0/notebooks/<chapter-slug>.py.failed` with the violation log, mark task completed (do not block other chapters), skip to next chapter.

**g. Run `marimo check`. Retry once on failure (same pattern as step f).**

```
/Users/alanguyen/Library/Python/3.12/bin/marimo check learn-output/$0/notebooks/<chapter-slug>.py
```

**h. Export to WASM.**

```
/Users/alanguyen/Library/Python/3.12/bin/marimo export html-wasm \
  learn-output/$0/notebooks/<chapter-slug>.py \
  -o learn-output/$0/dist/<chapter-slug>/ \
  --mode run --no-show-code
```

If the export fails, write `learn-output/$0/dist/<chapter-slug>.failed.log` with the stderr and skip to next chapter.

**i. Apply figures symlink if needed.**

If the notebook references `figures/`:
```
ln -sf public/figures learn-output/$0/dist/<chapter-slug>/figures
```

(Check by `grep -q "figures/" learn-output/$0/notebooks/<chapter-slug>.py` — if grep exits 0, run the ln.)

**j. If `--strict`, run CDP verification.**

Start a temporary http server on an unused port (use Python: `python3 -m http.server PORT --bind 127.0.0.1` in the dist directory). Wait 1 second. Run:
```
python3 .claude/skills/learn-book/cdp-verify.py http://127.0.0.1:PORT/ --wait 90
```

If exit code 0: mark chapter as verified.
If exit code 1: write `learn-output/$0/dist/<chapter-slug>.cdp-failed.log` with the exception text and mark chapter as runtime-failed (do not block other chapters).
If exit code 2: print a one-line warning that Chrome isn't running on 9222; tell the user how to start it; skip CDP verification but do not fail the chapter.

Kill the temporary http server before continuing.

**k. Mark task completed.**

Print `[N/Total] <Title> — done (lines: N, widgets: M)`.

### 7. Generate the shell

After all chapters are processed:

**a. Write `learn-output/$0/chapters.json`** with this structure:
```json
{
  "title": "<book title from metadata>",
  "slug": "$0",
  "chapters": [
    {"number": 1, "title": "<chapter title>", "path": "<chapter-slug>/"},
    {"number": 2, "title": "<chapter title>", "path": "<chapter-slug>/"}
  ]
}
```

Only include chapters whose `dist/<chapter-slug>/index.html` exists (i.e., successful exports).

**b. Copy shell templates verbatim:**
```
cp .claude/skills/learn-book/shell-template/index.html learn-output/$0/index.html
cp .claude/skills/learn-book/shell-template/shell.css  learn-output/$0/shell.css
cp .claude/skills/learn-book/shell-template/sw.js      learn-output/$0/sw.js
```

### 8. Report completion

Print a summary including:
- Chapters generated, skipped, failed
- Serving instructions: `cd learn-output/$0 && python3 -m http.server 8000`, then open `http://localhost:8000`

Suggest: `"Re-run this command to resume any failed chapters."`
````

- [ ] **Step 2: Sanity-check the file**

```bash
wc -l .claude/skills/learn-book/SKILL.md
grep -c "^###" .claude/skills/learn-book/SKILL.md
```

Expected: ~190 lines, 8 top-level steps (Step 1 through Step 8).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/learn-book/SKILL.md
git commit -m "feat: add /learn-book skill orchestration"
```

---

## Task 8: End-to-end smoke test on Networks Ch.2

Validate that the skill, top to bottom, produces a working bundle for a chapter where we have a known-good prototype to compare against.

**Files:**
- Modify: `.gitignore` (add `learn-output/`)
- Test outcome: `learn-output/networks-book/dist/chapter-03/` boots cleanly in headless Chrome

Note: `chapter-03.md` is the Networks-book chapter that corresponds to "Chapter 2: Graphs" per `book-output/networks-book/metadata.json` (the book's front matter offsets the file numbering).

---

- [ ] **Step 1: Add `learn-output/` to `.gitignore`**

Append a line to `.gitignore`:

```bash
echo "learn-output/" >> .gitignore
```

Verify:

```bash
grep -c "^learn-output/$" .gitignore
```

Expected: `1`.

- [ ] **Step 2: Confirm Networks-book is parsed and summarized**

```bash
test -f book-output/networks-book/metadata.json && echo "PASS metadata"
test -f book-output/networks-book/raw-chapters/chapter-03.md && echo "PASS raw"
test -f book-output/networks-book/summaries/chapter-03-summary.md && echo "PASS summary"
```

Expected: three `PASS` lines. If any is missing, run `/parse-book` and `/summarize-book networks-book` first.

- [ ] **Step 3: Run the skill on one chapter**

In a Claude Code session:

```
/learn-book networks-book --chapter 3
```

(Chapter 3 in metadata is the raw-chapter that corresponds to "Chapter 2: Graphs" — the Networks Ch.2 we have a prototype for.)

Wait for the skill to complete. Expected: prints a `[1/1] Chapter 2 — done` line and serving instructions.

- [ ] **Step 4: Verify the output structure**

```bash
test -f learn-output/networks-book/notebooks/chapter-03.py && echo "PASS notebook"
test -d learn-output/networks-book/dist/chapter-03/ && echo "PASS dist"
test -f learn-output/networks-book/dist/chapter-03/index.html && echo "PASS chapter index"
test -f learn-output/networks-book/index.html && echo "PASS shell index"
test -f learn-output/networks-book/chapters.json && echo "PASS manifest"
test -f learn-output/networks-book/sw.js && echo "PASS sw"
```

Expected: six `PASS` lines.

- [ ] **Step 5: Verify the widget count is in the 6–12 target range**

```bash
grep -c "^### Widget\|^## Widget\|WIDGET [0-9]" learn-output/networks-book/notebooks/chapter-03.py
```

Expected: a number between 6 and 12. If outside the range, the SKILL.md's widget-shopping-list step needs tuning.

- [ ] **Step 6: Run CDP verification manually**

Start a headless Chrome and a temp server:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
rm -rf /tmp/cdp-profile-smoke
"$CHROME" --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/cdp-profile-smoke \
  --disable-application-cache --disk-cache-size=0 --disable-gpu --no-sandbox \
  > /tmp/chrome-smoke.log 2>&1 &
sleep 2
cd learn-output/networks-book/dist/chapter-03
python3 -m http.server 8770 --bind 127.0.0.1 > /tmp/smoke-server.log 2>&1 &
sleep 1
cd - >/dev/null
python3 .claude/skills/learn-book/cdp-verify.py "http://127.0.0.1:8770/?cb=$(date +%s)" --wait 90
echo "exit code: $?"
```

Expected: `[cdp] done; 0 exceptions captured` and exit code 0.

- [ ] **Step 7: Open the shell in a real browser and click through manually**

```bash
cd learn-output/networks-book && python3 -m http.server 8000
```

In a browser, open `http://localhost:8000`. Confirm:
- Sidebar shows "Chapter 2" (one chapter, since we only ran one)
- The iframe loads the chapter
- The chapter widgets respond to input

This is the qualitative gate — there's no automated assertion for "the page looks right."

- [ ] **Step 8: Commit the .gitignore change**

```bash
git add .gitignore
git commit -m "chore: gitignore learn-output/ from /learn-book skill"
```

- [ ] **Step 9: Stop the smoke-test processes**

```bash
pkill -f "python3 -m http.server 8770" || true
pkill -f "python3 -m http.server 8000" || true
pkill -f "remote-debugging-port=9222.*cdp-profile-smoke" || true
```

---

## Spec coverage self-review

| Spec section | Covered in task |
|---|---|
| §1 Overview / `/learn-book` skill | Task 7 (SKILL.md), Task 8 (smoke test) |
| §3 K1–K6 widget taxonomy | Task 2 (widget-taxonomy.md) |
| §3 Content-type → mix table | Task 2 (table in taxonomy file), Task 7 (Step 6b classification) |
| §4 R1–R9 Pyodide rules | Task 3 (pyodide-rules.md), Task 1 (R1+R3+R4+R5 static-check enforcement) |
| §5 Per-chapter pipeline | Task 7 (Steps 6a–6k) |
| §6 Multi-chapter shell (Option C) | Task 6 (shell templates), Task 7 (Step 7 shell-emission) |
| §7 `/learn-book` skill behavior | Task 7 |
| §7 `--strict` mode | Task 5 (cdp-verify.py), Task 7 (Step 6j) |
| §7 `--chapter N` flag | Task 7 (Step 4) |
| §7 Retry policy | Task 7 (Steps 6f, 6g) |
| §7 Resumable behavior | Task 7 (Step 6a skip-if-exists) |
| §8 Subagent prompt structure | Task 4 (chapter-prompt-template.md), Task 7 (Step 6d substitution) |
| §9 File layout | Task 1, 2, 3, 4, 5, 6, 7 all create files at the spec-defined paths |
| §10 Static checks | Task 1 |
| §10 CDP verification | Task 5 |
| §12 Success criterion #1 (networks-book) | Task 8 |
| §12 Success criterion #2 (influence) | Not in this plan — run `/learn-book influence --chapter 4` manually after smoke test passes |
| §12 Success criterion #3 (shell with instant switching) | Task 6 (sw.js), Task 8 (Step 7) |
| §12 Success criterion #4 (`--strict` catches real bug) | Not explicitly tested — confirmed indirectly by the same script catching the three Pyodide bugs during spec prototyping; can be force-tested by deliberately corrupting a chapter and re-running with `--strict` |
| §12 Success criterion #5 (static checks in skill loop) | Task 7 (Step 6f) |
