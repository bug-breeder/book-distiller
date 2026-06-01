---
name: tutor-prep
description: Distill a parsed book's chapters into tutor lesson notes. Run before /tutor (or let /tutor lazily prep on demand).
effort: high
argument-hint: <book-slug> [chapter-number]
allowed-tools: Read Write Agent Glob TaskCreate TaskUpdate
---

ultrathink

Generate lesson notes for: **$ARGUMENTS**

`$0` is the book slug. `$1` (optional) is a chapter number — if provided, process only that chapter.

## Steps

### 1. Validate input
Read `book-output/$0/metadata.json`. If it doesn't exist: tell the user to run `/parse-book` first and stop.

### 2. Load the lesson-note template
Read `${CLAUDE_SKILL_DIR}/lesson-note-template.md`. Embed its full contents in every delegation message.

### 3. Determine chapters to process
- If `$1` is provided: only the chapter where `chapterNumber == $1`.
- Otherwise: all chapters.

### 4. Create output directory
Ensure `book-output/$0/lessons/` exists.

### 5. Create progress tasks
For every chapter to process, call TaskCreate with subject `"[N/Total] Chapter Title"`.
N is the chapter's 1-based position in the list of chapters being processed; Total is the count of chapters being processed (1 if `$1` was provided, the full chapter count otherwise).
Status lifecycle: `pending` → `in_progress` (when dispatching) → `completed` (when done or skipped).

### 6. Process chapters sequentially
For each chapter to process, in order:

**a. Check for existing output.**
Use Glob to check if `book-output/$0/lessons/<chapter-slug>-lesson.md` exists, where `<chapter-slug>` is the chapter file name with `.md` removed (e.g. `chapter-03.md` → `chapter-03`); the lesson note written is therefore `chapter-03-lesson.md`.
- If it exists: mark task completed, print `[N/Total] "Title" — skipped (already done)`. Next chapter.
- Else: continue to b.

**b. Dispatch one agent.**
Mark the task in_progress. Print `[N/Total] "Title" — processing...`
Dispatch ONE `book-analyst` subagent with the Agent tool. Wait for completion.

**Determine delegation mode:**
- If `metadata.sourceFile` ends with `.pdf` AND `chapter.pageRange` exists → **PDF mode**
- Otherwise → **EPUB mode**

**EPUB mode delegation message:**
```
Analyze: book-output/$0/raw-chapters/<chapter.file>
Write to: book-output/$0/lessons/<chapter-slug>-lesson.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: lesson

Template:
<full contents of lesson-note-template.md>
```

**PDF mode** — first compute authoritative figure locations deterministically (the analyst must not guess page numbers). Run:
```bash
pnpm exec tsx src/cli.ts figures "<metadata.sourceFile>" <chapter.pageRange.start> <chapter.pageRange.end>
```
Capture its stdout (lines of `Figure/Table N.M | p.PAGE | caption`, or `(none)`) and paste it verbatim into the delegation's **Authoritative figure locations** block.

**PDF mode delegation message:**
```
Analyze (PDF): <metadata.sourceFile>
Chapter pages: <chapter.pageRange.start>-<chapter.pageRange.end>
Write to: book-output/$0/lessons/<chapter-slug>-lesson.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: lesson

Authoritative figure locations:
<verbatim stdout of the `figures` command>

Template:
<full contents of lesson-note-template.md>
```

After the agent completes: mark the task completed. Print `[N/Total] "Title" — done`.

**c. Lint inline diagrams (PDF mode only).** After the note is written, run:
```bash
pnpm exec tsx src/cli.ts diagrams lint "book-output/$0/lessons/<chapter-slug>-lesson.md" "<metadata.sourceFile>" <chapter.pageRange.start> <chapter.pageRange.end>
```
If it exits non-zero (ungrounded node labels, ungrounded edges, or an over-cap graph), the analyst inlined a diagram it should not have. Re-dispatch the same chapter once telling the analyst to remove the offending ` ```mermaid ` block(s) and keep only the location pointer. If it still fails, leave the pointer and drop the block manually.

**d. Auto-correct figure page citations (PDF mode only).** After the note is written, run:
```bash
pnpm exec tsx src/cli.ts figures-fix "book-output/$0/lessons/<chapter-slug>-lesson.md" "<metadata.sourceFile>" <chapter.pageRange.start> <chapter.pageRange.end>
```
This deterministically rewrites any drifted figure/table page citation to the authoritative page (no re-dispatch — we know the exact page). Report what it corrected.

**After all chapters:** print `"X chapters processed, Y skipped. Re-run to resume if interrupted."`

### 7. Report completion
List generated lesson notes. Suggest: "Next step: `/tutor $0`".
