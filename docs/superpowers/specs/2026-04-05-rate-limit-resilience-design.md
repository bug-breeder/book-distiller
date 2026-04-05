# Rate-Limit Resilience for Book Distiller Skills

**Date:** 2026-04-05  
**Status:** Approved

## Problem

`summarize-book` and `practice-book` dispatch all chapter agents simultaneously. For a 26-chapter book, that's 26 agents firing at once. In Claude Code v1.0.89+, a single HTTP 429 (rate limit) triggers a shared AbortController cascade that kills every in-flight agent. All 26 fail. The user must restart from chapter 1.

## Goal

If a rate limit hits at chapter 10, the user waits for quota to reset, re-runs the same command, and continues from chapter 10. No manual tracking. No restarts from scratch.

## Scope

Two files change:

| File | Change |
|---|---|
| `.claude/skills/summarize-book/SKILL.md` | Sequential execution + idempotency + progress tracking |
| `.claude/skills/practice-book/SKILL.md` | Same |

`book-analyst`, `parse-book`, `book-quiz`, `book-status` are untouched.

## Design

### Approach: Sequential + Idempotency

One `book-analyst` agent dispatched at a time. Before each chapter, check whether the output file already exists — skip if yes.

**Why sequential over batches:**
- The AbortController bug makes batches all-or-nothing anyway — 3 agents in a batch still all die if one gets a 429
- Sequential limits blast radius to exactly 1 chapter
- Sequential resume logic is trivially simple: the filesystem is the state store

**Why idempotency:**
- Re-running the same command automatically skips completed chapters
- No flags, no manual chapter tracking, no state files to manage

### Execution Flow

Both skills replace "Launch all agents simultaneously" with this loop:

```
1. Create one Task per chapter (all pending) — visible checklist in UI

2. For each chapter in order:
   a. Check if output file already exists
   b. If YES → mark task completed, print "[N/Total] 'Title' — skipped (already done)"
   c. If NO  → mark task in_progress
              → print "[N/Total] 'Title' — processing..."
              → dispatch ONE book-analyst agent, await completion
              → mark task completed
              → print "[N/Total] 'Title' — done"

3. Print summary: "X chapters processed, Y skipped."

4. Generate full-book file as before (unchanged)
```

### Output Files Checked

| Skill | Idempotency check |
|---|---|
| `summarize-book` | `book-output/<slug>/summaries/<chapter-slug>-summary.md` |
| `practice-book` | `book-output/<slug>/practice/<chapter-slug>-practice.md` |

### Progress Tracking

- **Within session:** TaskCreate per chapter → `pending` → `in_progress` → `completed`. Visible checklist in Claude Code UI.
- **Across sessions:** Filesystem only. Task list is ephemeral — it doesn't survive session restarts. The file-existence check in step 2a is what enables resume after a rate-limit reset.

### Resume Behavior

| Event | What happens |
|---|---|
| Rate limit at chapter 10 | Chapter 10 agent fails, session may end |
| User re-runs same command | Chapters 1–9 skipped (files exist), chapter 10 retried |
| Chapter partially written | Agent re-runs chapter 10, overwrites partial file |

### No Changes To

- `book-analyst` agent — already writes atomically; no changes needed
- Full-book generation step — runs after the chapter loop completes, unchanged
- `practice-book`'s optional single-chapter argument (`$1`) — still works; if provided, the loop runs for one chapter only (same idempotency check applies)

## Instruction Changes

### `summarize-book/SKILL.md`

Replace Step 4 ("Dispatch all chapter agents IN PARALLEL") with two steps:

**Step 4. Create progress tasks**  
Call TaskCreate for every chapter with subject `"[N/Total] Chapter Title"`.

**Step 5. Process chapters sequentially**  
For each chapter in order:
- Check if `book-output/$ARGUMENTS/summaries/<chapter-slug>-summary.md` exists
- If yes: mark task completed, print `[N/Total] "Chapter Title" — skipped`
- If no: mark task in_progress, dispatch one `book-analyst` agent, await it, mark task completed, print `[N/Total] "Chapter Title" — done`

After loop: print `"X processed, Y skipped. Re-run to resume if interrupted."`

Renumber subsequent steps (+1).

### `practice-book/SKILL.md`

Same change to Step 5, checking `<chapter-slug>-practice.md` instead of `<chapter-slug>-summary.md`.

Renumber subsequent steps (+1).
