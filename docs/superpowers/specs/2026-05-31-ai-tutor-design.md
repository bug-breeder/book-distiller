# AI Private Tutor — Design

**Date:** 2026-05-31
**Status:** Approved (brainstorming) — pending implementation plan
**Supersedes:** the teaching layer of `2026-04-03-book-distiller-design.md` (parser is retained)

## Context & motivation

Book Distiller currently parses books and generates **static** artifacts — chapter summaries, practice files, quizzes, and interactive marimo notebooks. Reading static output is still largely "reading a textbook." The goal of this redesign is to turn the project into an **AI private tutor**: it reads the book during a prep pass, then *teaches the user* in a live, conversational, time-efficient way — the way a good human tutor beats re-reading a chapter.

The user has **ADHD** and explicitly wants best-in-class, low-friction progress tracking. ADHD-friendliness is a first-class design constraint, not an afterthought: bite-sized single-focus turns, visible momentum, frictionless resume, and automatic resurfacing of weak spots (spaced repetition).

## Goals

- A **live conversational tutor** that teaches one chapter per session, concept-by-concept, in the terminal (the lesson *is* the chat).
- **Time-efficient:** a one-time **prep pass** distills each chapter into rich "lesson notes" so live sessions start instantly and stay grounded.
- **Real-life applications** woven in when the chapter offers them; **skipped** (never fabricated) when it does not.
- **Point to figures/tables/equations by location** in the source (PDF page number, EPUB section anchor) so the user opens the real artifact; the tutor explains *what to look for*, it does not re-draw visuals in prose.
- **Feynman handoff:** at session end the user teaches a separate **curious, probing student agent**; the user's stumbles reveal gaps.
- **Best-in-class progress tracking:** per-book state with mastery, gap reports, and a spaced-repetition review queue. Resume cleanly after interruptions.

## Non-goals

- No Anthropic API key / external services — all AI runs inside the Claude Code session (unchanged from today).
- No browser UI / interactive notebooks (the `/learn-book` paradigm is retired here).
- No adaptive concept-graph / prerequisite modeling in v1 (this is the "Approach C" direction; left as future work).
- The parser is **not** changed.

## Requirements (from brainstorming)

| # | Requirement |
|---|---|
| R1 | Live conversational tutor in the terminal. |
| R2 | Prep step first: chapters distilled into lesson notes; live sessions load them. |
| R3 | Tutor-led, one chapter per session, structured concept-by-concept. |
| R4 | Feynman handoff via a curious, probing student subagent. |
| R5 | Best-in-class, ADHD-friendly progress tracking + spaced repetition. |
| R6 | Reference figures/tables/equations by **location**; explain what to look for. |
| R7 | Real-life applications when present; skip silently otherwise. |
| R8 | Replace `summarize-book` / `practice-book` / `book-quiz` / `learn-book`, salvaging their value. Keep `parse-book`. |

## Architecture

Four phases on the existing pipeline spine:

```
parse (CLI, unchanged)
   └─> prep   (/tutor-prep skill + book-analyst)   → lessons/chapter-NN-lesson.md
          └─> tutor (/tutor skill, live session)    ←→ progress.json (state via `progress` CLI)
                 └─> curious-student (subagent, Feynman handoff)
```

**Directory layout (per book):**

```
book-output/<slug>/
├── metadata.json          # exists, unchanged
├── raw-chapters/          # exists (EPUB text / PDF page-range stubs)
├── lessons/               # NEW — prep output, one lesson note per chapter
│   └── chapter-NN-lesson.md
└── progress.json          # NEW — tutor state
```

### Components

| Component | Status | Purpose | Depends on |
|---|---|---|---|
| Parser CLI + `/parse-book` | keep | book → chapters + metadata | — |
| `progress` CLI subcommands | **NEW (TS, no AI)** | deterministic read/mutate of `progress.json` + spaced-repetition math | `progress.json` |
| `book-analyst` agent | extend | gains `lesson` task; records figure/table/equation **locations** | raw chapter / PDF |
| `/tutor-prep <slug> [N]` | NEW (repurposes `summarize-book`) | dispatch `book-analyst` per chapter → lesson notes; resumable (skip-if-exists) | metadata, book-analyst |
| `/tutor <slug>` | NEW | the live session orchestrator; lazily preps the current chapter if its note is missing | lessons, progress CLI, curious-student |
| `curious-student` agent | NEW subagent | Feynman partner — asks probing naive questions, reports gaps | lesson note key points + transcript |
| `/book-status` | update | show tutoring progress + due reviews | progress.json |

## Data formats

### Lesson note — `lessons/chapter-NN-lesson.md`

Written by `book-analyst` during prep. Absorbs the value of the retired skills: summary depth, practice scenarios (→ applications), and quiz questions (→ review items).

```markdown
---
chapter: 4
title: "The Principle of Liking"
source: { type: pdf, pages: "88-110" }     # or { type: epub, anchor: "ch4" }
---

## Teaching arc
Ordered list of concepts to teach, each one line — the lesson plan the tutor follows.

## Concepts
### C1 — <concept name>
- **Plain-English explanation** (the tutor's seed script — short, clear, not a wall of text)
- **Why it matters**
- **Check-for-understanding question** (+ ideal answer)
- **Common misconception**
- **Real-life application** — concrete; OMIT this line entirely if the chapter has none

## Figures / Tables / Equations
- **Figure 4.2** — p. 97 — "what it shows / what to look for"
- **Table 4.1** — p. 101 — "..."
- **Eq. 4.3** — p. 99 — "..."

## Review items
- id: c1-q1 | concept: C1 | Q: ... | A: ...
- id: c2-q1 | concept: C2 | Q: ... | A: ...
```

Location rules (R6): PDF → page number (book-analyst reads pages visually; says "around p. X" when uncertain). EPUB → section/heading anchor.

### Progress state — `progress.json`

```json
{
  "slug": "influence",
  "title": "Influence",
  "currentChapter": 4,
  "chapters": {
    "3": { "status": "mastered", "lastSession": "2026-05-30T18:00:00Z", "gaps": [] }
  },
  "reviewQueue": [
    {
      "id": "c3-q1", "chapter": 3, "concept": "reciprocity",
      "question": "...", "answer": "...",
      "dueDate": "2026-06-02", "interval": 2, "ease": 2.5, "lapses": 0
    }
  ],
  "sessionLog": [
    { "date": "2026-05-30T18:00:00Z", "chapter": 3, "outcome": "mastered", "gaps": [] }
  ]
}
```

`chapters[*].status` ∈ `not_started | in_progress | mastered`.

### Spaced repetition

Lightweight SM-2-style, implemented in the `progress` CLI:
- **pass:** `interval = max(1, round(interval * ease))`, `dueDate = today + interval` days. (Optionally nudge `ease` up slightly.)
- **fail:** `interval = 1`, `lapses += 1`, `dueDate = tomorrow`, `ease = max(1.3, ease - 0.2)`.
- New items seeded at `interval = 1`, `ease = 2.5`.

## `progress` CLI specification

Pure functions over `progress.json`; deterministic; unit-tested. Invoked by the `/tutor` skill via Bash.

| Command | Behavior |
|---|---|
| `progress due <slug>` | Print review items where `dueDate <= today` (JSON). Initializes `progress.json` if absent. |
| `progress record <slug> --id <id> --result pass\|fail` | Apply SM-2 update to that review item; persist. |
| `progress advance <slug> --chapter N --status <status> [--gaps "a;b"]` | Set chapter status, append `sessionLog`; parse the `## Review items` section of `lessons/chapter-NN-lesson.md` and enqueue each into `reviewQueue` (items whose `concept` matches a reported gap are due tomorrow, others seeded at `interval = 1, ease = 2.5`); set `currentChapter = N + 1`. |
| `progress show <slug>` | Print a human-readable status block (used by `/book-status`). |

All commands read/write `book-output/<slug>/progress.json` and exit non-zero with a clear message on bad input.

## Skill specifications

### `/tutor-prep <slug> [N]`

Repurposes the current `summarize-book` orchestration. Validates `metadata.json`; ensures `lessons/`; creates per-chapter progress tasks; for each chapter (or only chapter `N`): skip if `lessons/chapter-NN-lesson.md` exists, else dispatch one `book-analyst` (PDF mode or EPUB mode, per existing `pageRange` rule) with the **lesson** task and the lesson-note template. Resumable.

### `/tutor <slug>`

The live session. Steps:

1. **Recap.** Read `progress.json` (init if missing). Print ≤3 lines: resume point, last session's gaps, count of due reviews. Momentum bar `▓▓▓░░ X/Total mastered`.
2. **Spaced review.** `progress due <slug>`; quiz each due item one at a time; `progress record` each result.
3. **Ensure lesson note.** If `lessons/chapter-<currentChapter>-lesson.md` is missing, lazily dispatch `book-analyst` to prep just this chapter.
4. **Teach.** For each concept in the lesson's teaching arc: one short explanation turn → point to relevant figure/table/equation by location → one check-for-understanding question → wait. Re-explain differently if the user misses it; advance when they get it. One concept per turn.
5. **Apply.** For concepts with a real-life application, make it concrete and interactive. Skip silently if none.
6. **Feynman handoff.** Tell the user to teach "Sam." Dispatch `curious-student` with the lesson's key points + running transcript; relay one probing question at a time; loop a few rounds.
7. **Wrap-up.** Obtain a gap report; `progress advance` to write status + gaps + enqueue reviews + bump `currentChapter`. Print the win and "next time: Ch.(N+1)." Clean stop.

Spaced-review results persist immediately (step 2, `progress record`). The chapter is finalized at wrap-up (step 7/8, `progress advance`, run before the closing message). If a session is interrupted mid-chapter, no review state is lost and re-running `/tutor` simply re-teaches that chapter — it was never marked complete.

### `curious-student` agent

A subagent dispatched during the Feynman handoff. Receives the lesson's key points (so it can probe intelligently) and the conversation transcript. Returns **one** probing, naive-but-pointed question per round ("ok, but *why* does that work?", "how is that different from X?") and, when asked to conclude, a short gap assessment (what the learner explained well; where they were vague). It does **not** lecture or hand over answers — its job is to expose gaps.

**Fallback:** if the subagent errors or is unavailable, the `/tutor` skill role-plays the student with a hard persona switch so the session still completes.

### `/book-status` (update)

Replace summary/practice counts with tutoring progress: per book, show chapters mastered / total, current chapter, and number of reviews due (via `progress show`).

## Removed skills & salvage mapping

| Removed | Salvaged into |
|---|---|
| `/summarize-book` | becomes `/tutor-prep` (lesson notes carry summary-level depth) |
| `/practice-book` | real-life scenarios → lesson note **Real-life application** sections + the tutor's Apply step |
| `/book-quiz` | questions → lesson note **Review items** → spaced-repetition deck |
| `/learn-book` | retired (browser-widget paradigm out of scope; assets remain in git history) |

`parse-book` and the parser CLI are unchanged.

## Error handling & resilience

- **Missing lesson note** → tutor lazily preps that one chapter before teaching.
- **Interruption (rate limit) mid-session** → spaced-review results persist immediately; the chapter is finalized only at wrap-up (`progress advance`). Re-running `/tutor` simply re-teaches the interrupted chapter — it was never marked complete. Lesson notes are skip-if-exists.
- **`curious-student` failure** → tutor role-plays the student (fallback above).
- **No real-life application** → explicitly skipped; never fabricated.
- **Uncertain PDF figure page** → book-analyst writes "around p. X" rather than a false precise number.
- **Bad CLI input** → `progress` commands exit non-zero with a clear message.

## Testing

- Keep the existing parser Vitest suite.
- **New unit tests** for the `progress` module (pure TS): SM-2 interval math (pass / fail / lapse / new-item seeding), `due` filtering by date (with a fixed "today"), and `advance` mutations (status, sessionLog append, review enqueue, currentChapter bump). Fully offline.
- The skills (AI) are not unit-tested, but their critical state mutations are, because they route through the tested CLI.

## Future work (toward "Approach C")

- Structured concept graph with prerequisites for adaptive ordering.
- Mastery modeling beyond pass/fail (per-concept confidence).
- Cross-book review decks.
```
