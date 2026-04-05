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

Status lifecycle: `pending` (initial, set by TaskCreate) → `in_progress` (when dispatching) → `completed` (when done or skipped).

### 6. Process chapters sequentially
For each chapter to process, in order:

**a. Check for existing output**
Use Glob to check if `book-output/$0/practice/<chapter-slug>-practice.md` exists.
If Glob returns a match → file exists → skip. If Glob returns no matches → file does not exist → dispatch agent.

Where `<chapter-slug>` = chapter file name with the `.md` extension replaced by `-practice.md` (e.g. `chapter-03.md` → `chapter-03-practice.md`).

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
