---
name: author-course
description: Author a full interactive course from a topic (no source book) — course spec, concept DAG, outline, and per-module lesson notes — ready for /visualize, interactive, and /tutor.
effort: high
argument-hint: <topic or course brief>
allowed-tools: Read Write Bash Agent Glob WebSearch TaskCreate TaskUpdate
---

ultrathink

Author a course for: **$ARGUMENTS**

## Steps

### 1. Clarify scope (only if essential)
If the brief lacks audience, level, course type (skill vs knowledge), or duration, ask the user — these are not guessable. Otherwise proceed.

### 2. Write the course spec
Read `${CLAUDE_SKILL_DIR}/course-spec-template.md`. Derive a kebab-case `slug`. Write a complete `course-spec.md` to `book-output/<slug>/course-spec.md`, including the `type: skill|knowledge` flag (explicit — never heuristic) and Bloom-tagged objectives.

### 3. Write the concept DAG
Read `${CLAUDE_SKILL_DIR}/concepts-format.md`. Enumerate the course's concepts and their dependencies + taxonomy + Bloom level. Write `book-output/<slug>/concepts.csv`. Then validate:
```bash
pnpm exec tsx src/cli.ts validate-concepts <slug>
```
If it exits non-zero, fix `concepts.csv` and re-run until it passes.

### 4. Write the outline
Group the concepts into modules (sessions). Write `book-output/<slug>/outline.md` using the module-line format from `concepts-format.md`.

### 5. Scaffold metadata
```bash
pnpm exec tsx src/cli.ts author-scaffold <slug>
```
This writes `book-output/<slug>/metadata.json` (one chapter per module).

### 6. Load the lesson-note template
Read `.claude/skills/tutor-prep/lesson-note-template.md`. Embed its full contents in every delegation message.

### 7. Create progress tasks
Read `metadata.json`. For each module, `TaskCreate` with subject `"[N/Total] <Module title>"`.

### 8. Author modules sequentially (resumable)
For each module in `metadata.chapters`, in order:
- **a. Skip if done.** With Glob, check `book-output/<slug>/lessons/module-NN-lesson.md` (where `module-NN.md` is `chapter.file`). If present: mark task completed, print `[N/Total] "<title>" — skipped`. Else continue.
- **b. Dispatch one `course-author` agent** (mark task in_progress). The delegation message:
  ```
  Write to: book-output/<slug>/lessons/module-NN-lesson.md
  Course: <metadata.title>
  Course type: <skill|knowledge from course-spec>
  Module title: <chapter.chapterTitle>
  Module number: <chapter.chapterNumber>
  Concepts: <for each ConceptID in this module's outline line: "ConceptLabel (Bloom: <level>)">

  Template:
  <full contents of lesson-note-template.md>
  ```
  Wait for completion. Mark task completed. Print `[N/Total] "<title>" — done`.
- **c. Clarity lint.** Run:
  ```bash
  pnpm exec tsx src/cli.ts lint-lessons <slug>
  ```
  If it exits non-zero for a concept in the just-written module (missing `#### Dig deeper`), re-dispatch that module once instructing the agent to add the missing block. Warnings are advisory.

### 9. Author practice assets (skill-type courses only)

If `course-spec` `type` is `skill`, author the practice→feedback assets that drive
the browser scorer. Read `${CLAUDE_SKILL_DIR}/practice-assets-format.md`, then
dispatch one `course-author` agent with this delegation message:

```
Author the practice assets for a skill-type course.
Write three files:
  - book-output/<slug>/rubric.md
  - book-output/<slug>/feedback-spec.md
  - book-output/<slug>/prompts.md
Course: <metadata.title>
Ground rubric.md in the official public IELTS band descriptors via WebSearch and
cite them. Follow this format exactly:
<full contents of practice-assets-format.md>
```

Wait for completion. Verify all three files exist before finishing.

### 10. Report completion
List the generated lesson notes. Suggest next steps: `/visualize <slug>`, then `pnpm exec tsx src/cli.ts interactive <slug>`, then `/tutor <slug>`.
