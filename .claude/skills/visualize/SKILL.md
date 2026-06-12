---
name: visualize
description: Author interactive visualization sims for a parsed+prepped book's concepts. Run after /tutor-prep; before study-mate interactive.
effort: high
argument-hint: <book-slug> [chapter-number]
allowed-tools: Read Write Bash Agent Glob TaskCreate TaskUpdate
---

ultrathink

Author interactive sims for: **$ARGUMENTS**

`$0` is the book slug. `$1` (optional) is a chapter number — if provided, only
that chapter.

## Steps

### 1. Validate input
Read `book-output/$0/metadata.json`. If missing: tell the user to run `/parse-book`
then `/tutor-prep` first, and stop. Read `interactive-book/viz-allowlist.json`
(its contents are passed to each agent).

### 2. Load the contract
Read `${CLAUDE_SKILL_DIR}/sim-contract.md`. Embed its full contents in every
delegation message.

### 3. Determine chapters
- If `$1` provided: only the chapter whose `chapterNumber == $1`.
- Else: every chapter that HAS a lesson note at
  `book-output/$0/lessons/<chapter-file-without-.md>-lesson.md`.

### 4. Create progress tasks
For each chapter to process, TaskCreate `"[N/Total] Chapter Title"`.

### 5. Process chapters sequentially
For each chapter to process, in order:

a. Mark the task in_progress. Ensure `interactive-book/src/sims/$0/ch<N>/` exists.

b. Dispatch ONE `sim-author` agent with the Agent tool. The message contains:
   - Slug, Chapter number + title.
   - Lesson note path.
   - Sims dir: `interactive-book/src/sims/$0/ch<N>/`.
   - Allowlist: the verbatim contents of `interactive-book/viz-allowlist.json`.
   - Contract: the full `sim-contract.md` contents.

c. Parse the agent's reply: collect each `SIM | ...` line into entries
   (chapter, concept, title, caption, file, libs[]). `NO SIMS` → none.

d. Mark the task completed. Print `[N/Total] "Title" — <k> sims`.

### 6. Write the manifest
Merge all collected entries into `interactive-book/src/sims/$0/manifest.json`
(`{ "slug": "$0", "sims": [ ... ] }`). When resuming, replace entries for the
chapters processed this run and keep the rest.

### 7. Validate the whole book
Run, and report results:
```bash
pnpm exec tsx src/cli.ts lint-sims $0
cd interactive-book && pnpm exec tsc --noEmit && cd ..
```
If `tsc` fails on a sim, re-dispatch that chapter's `sim-author` with the error
text and instruction to fix; re-run until clean.

### 8. Wire + build
```bash
pnpm exec tsx src/cli.ts interactive $0
cd interactive-book && pnpm build && cd ..
```
If the build fails on a sim page, re-dispatch that chapter to fix the offending
sim, then re-run from step 7.

### 9. Report
Summarize sims authored per chapter and confirm the build passed. Suggest:
"Next: `cd interactive-book && pnpm start` to view them."
