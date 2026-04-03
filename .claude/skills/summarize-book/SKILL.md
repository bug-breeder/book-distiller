---
name: summarize-book
description: Generate deep chapter summaries and full-book summary. Requires parsed book.
disable-model-invocation: true
effort: high
argument-hint: <book-slug>
allowed-tools: Read Write Agent
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

### 4. Dispatch all chapter agents IN PARALLEL
For EVERY chapter in the metadata, dispatch a `book-analyst` subagent using the Agent tool.
**Launch all agents simultaneously** — do not wait for one before starting the next.

Each delegation message must be exactly:
```
Analyze: book-output/$ARGUMENTS/raw-chapters/<chapter.file>
Write to: book-output/$ARGUMENTS/summaries/<chapter-slug>-summary.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: summary

Template:
<full contents of chapter-summary-template.md>
```

Where `<chapter-slug>` = the chapter file name with `-summary` appended (e.g. `chapter-03.md` → `chapter-03-summary.md`).

### 5. Generate full-book summary
After ALL chapter agents confirm completion, read every `chapter-XX-summary.md` file and write `book-output/$ARGUMENTS/summaries/full-book-summary.md` with this structure:

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

### 6. Report completion
List all generated files and suggest: "Next step: `/practice-book $ARGUMENTS`"
