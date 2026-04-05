# Rate-Limit Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace parallel agent dispatch in `summarize-book` and `practice-book` skills with sequential execution + idempotency so any run can be safely resumed after a rate-limit interruption.

**Architecture:** Each skill loops through chapters one at a time, checks whether the output file already exists before dispatching an agent (skipping if yes), and tracks progress via TaskCreate/TaskUpdate. The filesystem is the durable state — task lists are within-session only.

**Tech Stack:** Markdown skill files only. No TypeScript changes. No new dependencies.

---

## File Map

| File | Action | Change |
|---|---|---|
| `.claude/skills/summarize-book/SKILL.md` | Modify | Replace parallel Step 4 with sequential Steps 4+5; add Glob to allowed-tools; renumber tail steps |
| `.claude/skills/practice-book/SKILL.md` | Modify | Replace parallel Step 5 with sequential Steps 5+6; add Glob to allowed-tools; renumber tail steps |
| `CLAUDE.md` | Modify | Update Architecture note from "in parallel" to "sequentially" |

---

### Task 1: Update `summarize-book/SKILL.md`

**Files:**
- Modify: `.claude/skills/summarize-book/SKILL.md`

- [ ] **Step 1: Verify current content**

Read the file and confirm it currently says `allowed-tools: Read Write Agent` and Step 4 says `**Launch all agents simultaneously**`.

```bash
grep -n "allowed-tools\|simultaneously\|IN PARALLEL" .claude/skills/summarize-book/SKILL.md
```

Expected output:
```
7:allowed-tools: Read Write Agent
27:### 4. Dispatch all chapter agents IN PARALLEL
29:**Launch all agents simultaneously** — do not wait for one before starting the next.
```

- [ ] **Step 2: Write the updated file**

Replace the entire file with this content:

```markdown
---
name: summarize-book
description: Generate deep chapter summaries and full-book summary. Requires parsed book.
disable-model-invocation: true
effort: high
argument-hint: <book-slug>
allowed-tools: Read Write Agent Glob TaskCreate TaskUpdate
---

ultrathink

Generate deep summaries for the book with slug: **$ARGUMENTS**

## Steps

### 1. Validate input
Read `book-output/$ARGUMENTS/metadata.json`.
If it doesn't exist: tell the user to run `/parse-book` first and stop.

### 2. Load the summary template
Read `${CLAUDE_SKILL_DIR}/chapter-summary-template.md`.
You will embed its full contents in every delegation message.

### 3. Create output directory
Ensure `book-output/$ARGUMENTS/summaries/` exists.

### 4. Create progress tasks
For every chapter in metadata, call TaskCreate with:
- subject: `"[N/Total] Chapter Title"` — e.g. `"[3/26] The Law of Irrationality"`

All tasks start as pending. N is the chapter's 1-based position in the metadata list. Total is the total chapter count.

### 5. Process chapters sequentially
For each chapter in order:

**a. Check for existing output**
Use Glob to check if `book-output/$ARGUMENTS/summaries/<chapter-slug>-summary.md` exists.

Where `<chapter-slug>` = chapter file name with `-summary` appended (e.g. `chapter-03.md` → `chapter-03-summary.md`).

- If the file **exists**: mark the chapter's task completed, print `[N/Total] "Chapter Title" — skipped (already done)`. Move to the next chapter.
- If the file **does not exist**: continue to step b.

**b. Dispatch one agent**
Mark the chapter's task in_progress. Print `[N/Total] "Chapter Title" — processing...`

Dispatch ONE `book-analyst` subagent using the Agent tool. Wait for it to complete before moving to the next chapter.

Delegation message:
```
Analyze: book-output/$ARGUMENTS/raw-chapters/<chapter.file>
Write to: book-output/$ARGUMENTS/summaries/<chapter-slug>-summary.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: summary

Template:
<full contents of chapter-summary-template.md>
```

After the agent completes: mark the chapter's task completed. Print `[N/Total] "Chapter Title" — done`.

**After all chapters:** print a summary line:
`"X chapters processed, Y skipped. Re-run this command to resume if interrupted."`

### 6. Generate full-book summary
After ALL chapters are processed or skipped, read every `chapter-XX-summary.md` file and write `book-output/$ARGUMENTS/summaries/full-book-summary.md` with this structure:

```markdown
# [Book Title] — Full Book Summary
**Author:** [Author] | **Chapters:** [N]

## Book Thesis
[3 sentences that capture the book's central argument and why it matters]

## Chapter-by-Chapter Summaries
[One paragraph per chapter — synthesize the Core Thesis from each chapter summary]

## Core Argument Arc
[How the ideas build across the book — what changes from beginning to end, and why the order matters]

## 10 Most Important Ideas
[Numbered list of the 10 most valuable insights from the entire book]

## Who Should Read This and Why
[Specific audience + specific reason — not generic "anyone interested in X"]

## What the Book Does NOT Cover
[Honest assessment of blind spots, outdated ideas, or topics the author avoids]
```

### 7. Report completion
List all generated files and suggest: "Next step: `/practice-book $ARGUMENTS`"
```

- [ ] **Step 3: Verify the change**

```bash
grep -n "allowed-tools\|simultaneously\|IN PARALLEL\|sequentially\|Create progress\|Process chapters" .claude/skills/summarize-book/SKILL.md
```

Expected output — should contain `TaskCreate TaskUpdate` and `Glob`, no `simultaneously` or `IN PARALLEL`:
```
7:allowed-tools: Read Write Agent Glob TaskCreate TaskUpdate
27:### 4. Create progress tasks
34:### 5. Process chapters sequentially
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/summarize-book/SKILL.md
git commit -m "feat: make summarize-book sequential with idempotency and progress tracking"
```

---

### Task 2: Update `practice-book/SKILL.md`

**Files:**
- Modify: `.claude/skills/practice-book/SKILL.md`

- [ ] **Step 1: Verify current content**

```bash
grep -n "allowed-tools\|simultaneously\|IN PARALLEL" .claude/skills/practice-book/SKILL.md
```

Expected output:
```
7:allowed-tools: Read Write Agent
33:### 5. Dispatch chapter agents IN PARALLEL
35:**Launch all simultaneously.**
```

- [ ] **Step 2: Write the updated file**

Replace the entire file with this content:

```markdown
---
name: practice-book
description: Generate practice exercises per chapter. Optional chapter number targets one chapter.
disable-model-invocation: true
effort: high
argument-hint: <book-slug> [chapter-number]
allowed-tools: Read Write Agent Glob TaskCreate TaskUpdate
---

ultrathink

Generate practice exercises for: **$ARGUMENTS**

`$0` is the book slug. `$1` (optional) is a chapter number — if provided, process only that chapter.

## Steps

### 1. Validate input
Read `book-output/$0/metadata.json`.
If it doesn't exist: tell the user to run `/parse-book $0` first and stop.

### 2. Load the practice template
Read `${CLAUDE_SKILL_DIR}/chapter-practice-template.md`.
Embed its full contents in every delegation message.

### 3. Determine chapters to process
- If `$1` is provided: process only the chapter where `chapterNumber == $1`
- Otherwise: process ALL chapters

### 4. Create output directory
Ensure `book-output/$0/practice/` exists.

### 5. Create progress tasks
For every chapter to process, call TaskCreate with:
- subject: `"[N/Total] Chapter Title"` — e.g. `"[2/18] The Principle of Liking"`

N is the chapter's 1-based position in the list of chapters to process. Total is the count of chapters to process (1 if `$1` was provided, total chapter count otherwise).

### 6. Process chapters sequentially
For each chapter to process, in order:

**a. Check for existing output**
Use Glob to check if `book-output/$0/practice/<chapter-slug>-practice.md` exists.

Where `<chapter-slug>` = chapter file name with `-practice` appended (e.g. `chapter-03.md` → `chapter-03-practice.md`).

- If the file **exists**: mark the chapter's task completed, print `[N/Total] "Chapter Title" — skipped (already done)`. Move to the next chapter.
- If the file **does not exist**: continue to step b.

**b. Dispatch one agent**
Mark the chapter's task in_progress. Print `[N/Total] "Chapter Title" — processing...`

Dispatch ONE `book-analyst` subagent using the Agent tool. Wait for it to complete before moving to the next chapter.

Delegation message:
```
Analyze: book-output/$0/raw-chapters/<chapter.file>
Write to: book-output/$0/practice/<chapter-slug>-practice.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: practice

Template:
<full contents of chapter-practice-template.md>
```

After the agent completes: mark the chapter's task completed. Print `[N/Total] "Chapter Title" — done`.

**After all chapters:** print a summary line:
`"X chapters processed, Y skipped. Re-run this command to resume if interrupted."`

### 7. Generate full-book practice (ONLY if processing ALL chapters)
After all chapters are processed or skipped, write `book-output/$0/practice/full-book-practice.md`:

```markdown
# [Book Title] — Full Book Practice

## Comprehensive Quiz (10 Questions)
[10 questions drawn from across all chapters, each with an answer in <details>]

## Capstone Scenarios (3)
[3 complex real-world scenarios requiring synthesis of knowledge from multiple chapters]

## 30-Day Implementation Plan
**Week 1:** [Specific daily actions]
**Week 2:** [Specific daily actions]
**Week 3:** [Specific daily actions]
**Week 4:** [Specific daily actions]
```

### 8. Report completion
List all generated files. Suggest: `/book-quiz $0` for interactive review.
```

- [ ] **Step 3: Verify the change**

```bash
grep -n "allowed-tools\|simultaneously\|IN PARALLEL\|Create progress\|Process chapters" .claude/skills/practice-book/SKILL.md
```

Expected output — no `simultaneously` or `IN PARALLEL`:
```
7:allowed-tools: Read Write Agent Glob TaskCreate TaskUpdate
33:### 5. Create progress tasks
43:### 6. Process chapters sequentially
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/practice-book/SKILL.md
git commit -m "feat: make practice-book sequential with idempotency and progress tracking"
```

---

### Task 3: Update CLAUDE.md architecture note

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Verify current content**

```bash
grep -n "parallel" CLAUDE.md
```

Expected:
```
11:- **Skills:** All AI work. Skills dispatch `book-analyst` subagents in parallel per chapter.
```

- [ ] **Step 2: Update the line**

Change line 11 from:
```
- **Skills:** All AI work. Skills dispatch `book-analyst` subagents in parallel per chapter.
```

To:
```
- **Skills:** All AI work. Skills dispatch `book-analyst` subagents sequentially per chapter, skipping chapters with existing output files (resumable after rate-limit interruptions).
```

- [ ] **Step 3: Verify**

```bash
grep -n "sequentially\|parallel" CLAUDE.md
```

Expected — `parallel` gone, `sequentially` present:
```
11:- **Skills:** All AI work. Skills dispatch `book-analyst` subagents sequentially per chapter, skipping chapters with existing output files (resumable after rate-limit interruptions).
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update architecture note to reflect sequential chapter processing"
```

---

### Task 4: Manual smoke test

No automated tests exist for skill files. Verify behavior manually using the `influence` book, which already has all 18 summaries completed.

- [ ] **Step 1: Confirm influence summaries all exist**

```bash
ls book-output/influence/summaries/chapter-*-summary.md | wc -l
```

Expected: `18`

- [ ] **Step 2: Run the skill**

In a Claude Code session, run:
```
/summarize-book influence
```

- [ ] **Step 3: Verify skip behavior**

All 18 chapters should be skipped immediately (files exist). Expected output pattern in the conversation:
```
[1/18] "Pre-Suasion" — skipped (already done)
[2/18] "..." — skipped (already done)
...
[18/18] "..." — skipped (already done)
0 chapters processed, 18 skipped. Re-run this command to resume if interrupted.
```

Verify the summary line says `"0 chapters processed, 18 skipped."` and the full-book summary is still regenerated (Step 6 always runs).

- [ ] **Step 4: Spot-check a partial run (optional)**

To simulate a mid-run resume, delete one summary file and re-run:

```bash
rm book-output/influence/summaries/chapter-10-summary.md
```

Then run `/summarize-book influence` — chapters 1-9 and 11-18 should be skipped, chapter 10 should be processed (one agent dispatched).
