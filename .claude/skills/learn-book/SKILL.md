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

Confirm `book-output/$0/summaries/` exists and contains chapter summaries. If missing: tell the user to run `/summarize-book $0` first and stop. The skill embeds each chapter's summary into its subagent prompt — summaries are required, not optional.

### 2. Load reference assets

Read these files; you will embed parts of them into each subagent prompt:
- `${CLAUDE_SKILL_DIR}/chapter-prompt-template.md` — the prompt skeleton with 10 placeholders
- `${CLAUDE_SKILL_DIR}/widget-taxonomy.md` — K1–K6 reference (embedded inline)
- `${CLAUDE_SKILL_DIR}/pyodide-rules.md` — R1–R9 reference (embedded inline)

The reference prototype for visual chrome is `prototypes/option-f/networks_ch02.py` (for math/CS structures), `networks_ch03.py` (for math/CS proofs+data), or `influence_ch01.py` (for prose). You pass the absolute path to whichever matches the chapter's character — the agent reads it itself.

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

Take the contents of `chapter-prompt-template.md` and substitute its 10 placeholders. Do this in two passes — **scalar/path placeholders first, then `_INLINE` content placeholders last** — to avoid the unlikely case of an inlined file's content containing a `{TOKEN}` that would be re-substituted.

**Pass 1 — scalar/path substitutions:**
- `{OUTPUT_PY_PATH}` → absolute path to `learn-output/$0/notebooks/<chapter-slug>.py`
- `{REFERENCE_TEMPLATE_PATH}` → absolute path to the closest matching prototype: `networks_ch02.py` for math/CS structures, `networks_ch03.py` for math/CS proofs+data, `influence_ch01.py` for prose/reference
- `{CHAPTER_RAW_PATH}` → absolute path to `book-output/$0/raw-chapters/<chapter.file>`
- `{CHAPTER_SUMMARY_PATH}` → absolute path to `book-output/$0/summaries/<chapter-slug>-summary.md`
- `{CHAPTER_CHARACTER}` → the character label from step b
- `{WIDGET_COUNT}` → the count of widgets in the shopping list
- `{WIDGET_SHOPPING_LIST}` → the composed shopping list from step c, as a numbered markdown list
- `{REPO_ROOT}` → absolute path to the repo root

**Pass 2 — inline substitutions (do these AFTER pass 1):**
- `{PYODIDE_RULES_INLINE}` → the full contents of `pyodide-rules.md`
- `{WIDGET_TAXONOMY_INLINE}` → the full contents of `widget-taxonomy.md`

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
python3 -m marimo check learn-output/$0/notebooks/<chapter-slug>.py
```

**h. Export to WASM.**

```
python3 -m marimo export html-wasm \
  learn-output/$0/notebooks/<chapter-slug>.py \
  -o learn-output/$0/dist/<chapter-slug>/ \
  --mode run --no-show-code
```

If the export fails, write `learn-output/$0/dist/<chapter-slug>.failed.log` with the stderr and skip to next chapter.

**i. Apply figures symlink if needed (R9).**

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
