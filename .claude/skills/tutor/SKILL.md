---
name: tutor
description: Live, ADHD-friendly AI tutor. Teaches one chapter per session concept-by-concept, reviews weak spots first, runs a Feynman handoff, and tracks progress.
disable-model-invocation: true
effort: high
argument-hint: <book-slug>
allowed-tools: Read Bash Agent Glob TaskCreate TaskUpdate
---

ultrathink

Run a tutoring session for: **$ARGUMENTS** (the book slug — call it `$SLUG`).

Keep every turn bite-sized: one concept or one question at a time. Never paste a wall of text. The user has ADHD — momentum and a clean stopping point matter.

## Steps

### 1. Validate input
Read `book-output/$SLUG/metadata.json`. If missing: tell the user to run `/parse-book` first and stop.

### 2. Recap (fast)
Run: `pnpm exec tsx src/cli.ts progress show $SLUG`
Read `book-output/$SLUG/progress.json`. Print a ≤3-line welcome:
- where they are (current chapter + title),
- last session's gaps (read from `progress.json` → `chapters` entry for the most recently completed chapter, using its `gaps` array), if any,
- a momentum bar, e.g. `▓▓▓░░ X/N mastered` where N = `chapterCount` from `metadata.json` (read in step 1) and X = count of chapters with status `mastered` in `progress.json`.
Let `$CH` = `currentChapter`.

### 3. Spaced review first
Run: `pnpm exec tsx src/cli.ts progress due $SLUG`
For each due item (one at a time): ask the `question`; grade the user's reply against `answer`; then run
`pnpm exec tsx src/cli.ts progress record $SLUG --id <id> --result pass|fail`.
Keep it brisk. If nothing is due, say "No reviews due — straight to new material."

### 4. Ensure the lesson note for chapter $CH
Use Glob for `book-output/$SLUG/lessons/chapter-<NN>-lesson.md` (NN = $CH zero-padded to 2).
If missing: print `Prepping chapter $CH…`

Read the template from the literal path `.claude/skills/tutor-prep/lesson-note-template.md`.

Determine the mode from `metadata.json`: if `metadata.sourceFile` ends in `.pdf` AND the chapter entry has a `pageRange`, use **PDF mode**; otherwise use **EPUB mode**.

Dispatch ONE `book-analyst` with this exact delegation message (substituting values):

**EPUB mode:**
```
Analyze: book-output/$SLUG/raw-chapters/<chapter.file>
Write to: book-output/$SLUG/lessons/<chapter-slug>-lesson.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: lesson

Template:
<full contents of .claude/skills/tutor-prep/lesson-note-template.md>
```

**PDF mode:**
```
Analyze (PDF): <metadata.sourceFile>
Chapter pages: <chapter.pageRange.start>-<chapter.pageRange.end>
Write to: book-output/$SLUG/lessons/<chapter-slug>-lesson.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: lesson

Template:
<full contents of .claude/skills/tutor-prep/lesson-note-template.md>
```

(`<chapter-slug>` = the chapter `file` field with `.md` removed, e.g. `chapter-03.md` → `chapter-03`.)

Wait for the agent to finish. Then read the lesson note.

### 5. Teach, concept-by-concept
Read the lesson note. (Do not call `progress advance` yet — it finalizes the chapter and bumps `currentChapter`; that happens only at wrap-up in step 8.)
For each concept in the **Teaching arc**, in order:
1. Give the **Explanation** in your own words — 2–4 sentences, conversational.
2. If a figure/table/equation in the note relates, point to it by location: "Open **<label>** (<location>) — notice <what to look for>." Do NOT redraw it.
3. Ask the concept's **Check** question. Wait for the user.
4. If correct → affirm briefly and advance. If not → re-explain a different way (analogy, smaller step), watch for the **Misconception**, then re-check. After at most two re-explanation attempts on the same concept, note it as a likely gap, move on to the next concept, and raise it during the Feynman handoff. Never loop a single concept indefinitely.
One concept per turn. Do not dump multiple concepts at once.

### 6. Apply
For each concept that has an **Application** line, make it concrete: pose a short real-world scenario and have the user apply the idea, or walk through the example. Skip concepts with no Application line — do not invent one.

### 7. Feynman handoff
Tell the user: "Now teach it to Sam, a curious student. Explain it as if Sam knows nothing."
Loop (at most 5 rounds):
- Collect the user's explanation turn.
- Dispatch `curious-student` with: the lesson key points (concept names, ideal answers, misconceptions), the running transcript, and `Mode: probe`.
- Relay Sam's single question to the user verbatim. Wait for their answer.
- Stop earlier if the user has answered at least one of Sam's questions per concept in the Teaching arc, or asks to finish. After 5 rounds, dispatch `Mode: conclude` regardless.
Then dispatch `curious-student` once more with `Mode: conclude` to get the `GAPS / NAILED / VERDICT` report. Parse it.

**Fallback:** if the `curious-student` dispatch errors, role-play Sam yourself with the same rules (one naive question at a time), and produce the same `GAPS / NAILED / VERDICT` report at the end.

### 8. Wrap-up
**Before printing anything**, do the following in order:

1. **Sanitize the GAPS string:** Remove any double-quote characters from the gap phrases (replace `"` with `'`) and ensure phrases are separated only by `;` — this keeps the shell command well-formed.

2. **Persist the chapter result** (run this BEFORE printing anything — it saves the chapter and bumps `currentChapter`, so the work is saved even if the session ends right after):
   `pnpm exec tsx src/cli.ts progress advance $SLUG --chapter $CH --status <VERDICT> --gaps "<semicolon-joined GAPS>"`
   VERDICT is `mastered` or `in_progress` from Sam's report; use `--gaps ""` if there are no gaps.

3. **Print the closing message:**
   - The win: "✓ Chapter $CH done — <NAILED>"
   - Updated momentum bar (X/N mastered, where N = `chapterCount` from `metadata.json` and X = count of `mastered` chapters in `progress.json`)
   - Next chapter line: read the new `currentChapter` value that `advance` just wrote to `progress.json` (it equals the chapter you just finished plus one), and print its number and title. If the chapter just finished was the last one (i.e. `$CH` = `chapterCount`), print "You've finished the book! 🎉" instead.

End the session cleanly. Do not start the next chapter.
