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
