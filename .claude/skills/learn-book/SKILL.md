---
name: learn-book
description: Generate an interactive marimo-WASM learning bundle for a parsed book. Per-chapter widgets + multi-chapter shell.
disable-model-invocation: true
effort: high
argument-hint: <book-slug> [--strict] [--chapter N]
allowed-tools: Read Write Bash Agent Glob TaskCreate TaskUpdate
---

ultrathink

Build interactive learning bundle for: **$ARGUMENTS**

## Argument parsing

`$ARGUMENTS` is the full argument string. Parse it before doing anything else:

- **`$SLUG`** — the first non-flag token in `$ARGUMENTS` (the book slug)
- **`$STRICT`** — `true` if `$ARGUMENTS` contains `--strict`, otherwise `false`
- **`$CHAPTER_NUM`** — the integer token immediately following `--chapter` in `$ARGUMENTS`; empty if `--chapter` is absent

Examples:
- `/learn-book networks-book` → `$SLUG=networks-book`, `$STRICT=false`, `$CHAPTER_NUM=`
- `/learn-book networks-book --strict` → `$SLUG=networks-book`, `$STRICT=true`, `$CHAPTER_NUM=`
- `/learn-book networks-book --chapter 3` → `$SLUG=networks-book`, `$STRICT=false`, `$CHAPTER_NUM=3`
- `/learn-book influence --chapter 4 --strict` → `$SLUG=influence`, `$STRICT=true`, `$CHAPTER_NUM=4`

After parsing, every reference to `$SLUG` below means the parsed slug above. Strict-mode behavior is gated on `$STRICT == true`. Chapter filter (step 4) uses `$CHAPTER_NUM` when non-empty.

## Steps

### 1. Validate input

Read `book-output/$SLUG/metadata.json`. If it doesn't exist: tell the user to run `/parse-book` first and stop.

Confirm `book-output/$SLUG/summaries/` exists and contains chapter summaries. If missing: tell the user to run `/summarize-book $SLUG` first and stop. The skill embeds each chapter's summary into its subagent prompt — summaries are required, not optional.

### 2. Load reference assets

Read these files; you will embed parts of them into each subagent prompt:
- `${CLAUDE_SKILL_DIR}/chapter-prompt-template.md` — the prompt skeleton with 10 placeholders
- `${CLAUDE_SKILL_DIR}/widget-taxonomy.md` — K1–K6 reference (embedded inline)
- `${CLAUDE_SKILL_DIR}/pyodide-rules.md` — R1–R9 reference (embedded inline)

The reference prototype for visual chrome is `prototypes/option-f/networks_ch02.py` (for math/CS structures), `networks_ch03.py` (for math/CS proofs+data), or `influence_ch01.py` (for prose). You pass the absolute path to whichever matches the chapter's character — the agent reads it itself.

### 3. Create output directories

Ensure these exist:
- `learn-output/$SLUG/notebooks/`
- `learn-output/$SLUG/dist/`

Ensure `learn-output/` is in `.gitignore` (add if missing).

### 4. Determine which chapters to process

- If `$CHAPTER_NUM` is non-empty: process only the chapter where `chapterNumber == $CHAPTER_NUM`. If no chapter matches, print an error (`No chapter with chapterNumber=$CHAPTER_NUM in book`) and stop.
- Otherwise: process all chapters

### 5. Create progress tasks

For every chapter to process, call TaskCreate with subject `"[N/Total] Chapter Title"`.

Status lifecycle: `pending` → `in_progress` (when dispatching) → `completed` (when done or skipped).

### 6. Process chapters sequentially

For each chapter in order:

**a. Check for existing output.**

Use Glob to check if `learn-output/$SLUG/notebooks/<chapter-slug>.py` exists where `<chapter-slug>` is the chapter file name with `.md` replaced by `.py` (e.g. `chapter-03.md` → `chapter-03.py`).

If found: mark task completed, print `[N/Total] <Title> — skipped (already done)`. Continue to next chapter.

**b. Decide chapter character.**

Read the chapter's deep summary (you do NOT need to read the full raw text for classification — the summary is enough). Apply this decision tree IN ORDER, picking the FIRST match:

1. Does the chapter contain at least one **theorem with a written proof** AND at least one **empirical dataset or table**? → `math/CS proofs+data`
2. Else: does the chapter center on a **named data structure or algorithm** (graphs, trees, automata, sequences, etc.) — with the structure being the main object of study? → `math/CS structures`
3. Else: is the chapter **>60% narrative or anecdote-driven**, framed around principles, mechanisms, or human behavior? → `prose anecdote-driven`
4. Else: → `reference mixed`

Use the widget-taxonomy.md content-type → mix table to determine target widget counts (target total: 6–12 widgets).

**c. Compose the widget shopping list.**

Use this procedure to compose the shopping list:

1. **Inventory the chapter.** From the summary, list every (a) empirical study with numbers cited, (b) named experiment or mechanism, (c) named graph/tree/structure, (d) cited figure or diagram, (e) memorable rule or principle that takes form "if X, then Y."
2. **Map each inventoried item to a candidate widget kind:**
   - Empirical study with numbers → K2 (bar chart, dataset explorer)
   - Named experiment or mechanism → K3 (phenomenon recreator)
   - Named graph/tree/structure → K1 (live structure manipulator)
   - Cited figure or diagram → K4 (annotated figure)
   - Memorable rule of form "if X then Y" → K6 (phrase/scenario builder)
3. **Pick a target widget count between 6 and 12.** Default to 8 for chapters of average size.
4. **Adjust the candidate list to match the percentages in widget-taxonomy.md's mix table for this chapter's character.** Round percentages to integers; if the rounded total drifts outside 6–12, prefer adjusting the largest bucket. Add K5 (scenario/quiz feedback) widgets to fill any remaining slots — K5 fits any chapter.
5. **For each chosen widget, write a spec** with these fields:
   - Kind (K1–K6) and sub-label (e.g., "K3-A")
   - Title (e.g., "Widget 3 — K6-A: Build-a-Request phrase builder")
   - Inputs (which `mo.ui.*` controls and their option lists)
   - Computation (one paragraph describing the model the widget runs)
   - Display (what the user sees in response — chart, callout, table)

Refer to the three prototypes in `prototypes/option-f/` for worked examples at the right level of detail. The K6 phrase builder in `influence_ch01.py` and the K3 buckets-of-water widget are particularly representative.

**d. Fill in the prompt template.**

Take the contents of `chapter-prompt-template.md` and substitute its 10 placeholders. Do this in two passes — **scalar/path placeholders first, then `_INLINE` content placeholders last** — to avoid the unlikely case of an inlined file's content containing a `{TOKEN}` that would be re-substituted.

**Pass 1 — scalar/path substitutions:**
- `{OUTPUT_PY_PATH}` → absolute path to `learn-output/$SLUG/notebooks/<chapter-slug>.py`
- `{REFERENCE_TEMPLATE_PATH}` → absolute path to the closest matching prototype: `networks_ch02.py` for math/CS structures, `networks_ch03.py` for math/CS proofs+data, `influence_ch01.py` for prose/reference
- `{CHAPTER_RAW_PATH}` → absolute path to `book-output/$SLUG/raw-chapters/<chapter.file>`
- `{CHAPTER_SUMMARY_PATH}` → absolute path to `book-output/$SLUG/summaries/<chapter-slug>-summary.md`
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
bash .claude/skills/learn-book/static-checks.sh learn-output/$SLUG/notebooks/<chapter-slug>.py
```

If exit code != 0:
- If retries < 2: re-dispatch the same subagent with an appended message: "The static check failed with these violations: <paste output>. Fix the notebook and re-run the acceptance checks before responding." Increment retry counter.
- If retries == 2: mark chapter as failed, write `learn-output/$SLUG/notebooks/<chapter-slug>.py.failed` with the violation log, mark task completed (do not block other chapters), skip to next chapter.

**g. Run `marimo check`. Retry once on failure (same pattern as step f).**

```
python3 -m marimo check learn-output/$SLUG/notebooks/<chapter-slug>.py
```

**h. Export to WASM.**

```
python3 -m marimo export html-wasm \
  learn-output/$SLUG/notebooks/<chapter-slug>.py \
  -o learn-output/$SLUG/dist/<chapter-slug>/ \
  --mode run --no-show-code
```

If the export fails, write `learn-output/$SLUG/dist/<chapter-slug>.failed.log` with the stderr and skip to next chapter.

**i. Apply figures symlink if needed (R9).**

If the notebook references `figures/`:

```
ln -sf public/figures learn-output/$SLUG/dist/<chapter-slug>/figures
```

(Check by `grep -q "figures/" learn-output/$SLUG/notebooks/<chapter-slug>.py` — if grep exits 0, run the ln.)

**j. If `$STRICT == true`, run CDP verification.**

**Pick a free port:**

```bash
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("",0)); print(s.getsockname()[1]); s.close()')
```

**Start the server in the chapter's dist directory:**

```bash
cd learn-output/$SLUG/dist/<chapter-slug>/ && python3 -m http.server "$PORT" --bind 127.0.0.1 > /tmp/learn-book-srv-$PORT.log 2>&1 &
SRV_PID=$!
cd -
```

**Wait for the server to become ready** (poll, don't sleep):

```bash
for i in $(seq 1 20); do
  curl -sf http://127.0.0.1:$PORT/ > /dev/null && break
  sleep 0.2
done
```

**Run cdp-verify:**

```bash
python3 .claude/skills/learn-book/cdp-verify.py "http://127.0.0.1:$PORT/?cb=$(date +%s)" --wait 90
RC=$?
```

**Unconditionally stop the server:**

```bash
kill $SRV_PID 2>/dev/null
wait $SRV_PID 2>/dev/null
```

**Interpret the exit code:**
- `RC=0`: mark chapter as verified.
- `RC=1`: write `learn-output/$SLUG/dist/<chapter-slug>.cdp-failed.log` with the exception text and mark chapter as runtime-failed (do not block other chapters).
- `RC=2`: print a one-line warning telling the user how to start headless Chrome:
  `Chrome not on 9222 — start with: google-chrome --headless=new --remote-debugging-port=9222 &`
  Skip CDP verification but do not fail the chapter.

**k. Mark task completed.**

Print `[N/Total] <Title> — done (lines: N, widgets: M)`.

### 7. Generate the shell

After all chapters are processed:

**a. Write `learn-output/$SLUG/chapters.json`** with this structure:

```json
{
  "title": "<book title from metadata>",
  "slug": "$SLUG",
  "chapters": [
    {"number": 1, "title": "<chapter title>", "path": "<chapter-slug>/"},
    {"number": 2, "title": "<chapter title>", "path": "<chapter-slug>/"}
  ]
}
```

Only include chapters whose `dist/<chapter-slug>/index.html` exists (i.e., successful exports).

**b. Copy shell templates verbatim:**

```
cp .claude/skills/learn-book/shell-template/index.html learn-output/$SLUG/index.html
cp .claude/skills/learn-book/shell-template/shell.css  learn-output/$SLUG/shell.css
cp .claude/skills/learn-book/shell-template/sw.js      learn-output/$SLUG/sw.js
```

### 8. Report completion

Print a summary including:
- Chapters generated, skipped, failed
- Serving instructions: `cd learn-output/$SLUG && python3 -m http.server 8000`, then open `http://localhost:8000`

Suggest: `"Re-run this command to resume any failed chapters."`
