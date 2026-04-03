---
name: practice-book
description: Generate practice exercises per chapter. Optional chapter number targets one chapter.
disable-model-invocation: true
effort: high
argument-hint: <book-slug> [chapter-number]
allowed-tools: Read Write Agent
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

### 5. Dispatch chapter agents IN PARALLEL
For each chapter to process, dispatch a `book-analyst` subagent using the Agent tool.
**Launch all simultaneously.**

Each delegation message:
```
Analyze: book-output/$0/raw-chapters/<chapter.file>
Write to: book-output/$0/practice/<chapter-slug>-practice.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: practice

Template:
<full contents of chapter-practice-template.md>
```

### 6. Generate full-book practice (ONLY if processing ALL chapters)
After all agents complete, write `book-output/$0/practice/full-book-practice.md`:

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

### 7. Report completion
List all generated files. Suggest: `/book-quiz $0` for interactive review.
