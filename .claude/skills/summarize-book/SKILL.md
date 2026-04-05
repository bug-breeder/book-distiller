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
