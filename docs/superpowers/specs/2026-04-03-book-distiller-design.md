# Book Distiller — Design Spec
**Date:** 2026-04-03  
**Status:** Approved

---

## Overview

A Claude Code–native system that parses PDF/EPUB books into structured chapters, then uses Claude Code skills and a parallel subagent to produce deep summaries, practice exercises, and interactive quizzes. The TypeScript CLI handles only deterministic file parsing; all AI work runs inside Claude Code via skills and the `book-analyst` subagent.

---

## Architecture

```
book-distiller/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── src/
│   ├── parser/
│   │   ├── index.ts                      # Exports parseBook()
│   │   ├── pdf-parser.ts                 # pdf-parse integration
│   │   ├── epub-parser.ts                # epub2 + TOC-based chapter splitting
│   │   └── chapter-splitter.ts           # Regex/heuristic chapter detection for PDFs
│   └── cli.ts                            # Single `parse` command (Commander.js)
├── tests/
│   ├── pdf-parser.test.ts
│   ├── epub-parser.test.ts
│   ├── chapter-splitter.test.ts
│   └── fixtures/                         # Small public-domain EPUB from Project Gutenberg
├── .claude/
│   ├── skills/
│   │   ├── parse-book/SKILL.md
│   │   ├── summarize-book/
│   │   │   ├── SKILL.md
│   │   │   └── chapter-summary-template.md
│   │   ├── practice-book/
│   │   │   ├── SKILL.md
│   │   │   └── chapter-practice-template.md
│   │   ├── book-quiz/SKILL.md
│   │   └── book-status/SKILL.md
│   └── agents/
│       └── book-analyst.md
└── book-output/                          # Git-ignored; all generated content
    └── <slug>/
        ├── metadata.json
        ├── raw-chapters/
        │   └── chapter-01.md … chapter-N.md
        ├── summaries/
        │   ├── chapter-01-summary.md … chapter-N-summary.md
        │   └── full-book-summary.md
        └── practice/
            ├── chapter-01-practice.md … chapter-N-practice.md
            └── full-book-practice.md
```

---

## Phase 1: Parser & CLI (`src/`)

### Dependencies
| Package | Purpose |
|---|---|
| `pdf-parse` | Extract raw text + metadata from PDFs |
| `epub2` | EPUB parsing with TOC/spine access |
| `commander` | CLI interface |
| `fs-extra` | File operations |
| `slugify` | Generate URL-safe book slug from title |

### Chapter Splitting Strategy
| Source | Method |
|---|---|
| EPUB | `epub2` TOC/spine — exact, always reliable |
| PDF with headings | Regex: "Chapter N", "CHAPTER ONE", "Part I", "Section 1", roman numerals, etc. |
| PDF without headings | Page-count heuristic: split every 20 pages; title inferred from first non-blank line |

### CLI
Single command only — no AI, no API calls:
```bash
pnpm exec tsx src/cli.ts parse <file-path>
```

Outputs:
- `book-output/<slug>/raw-chapters/chapter-01.md` … `chapter-N.md`
- `book-output/<slug>/metadata.json`

### `metadata.json` Shape
```json
{
  "slug": "deep-work",
  "title": "Deep Work",
  "author": "Cal Newport",
  "language": "en",
  "sourceFile": "/path/to/deep-work.epub",
  "parsedAt": "2026-04-03T00:00:00.000Z",
  "chapterCount": 18,
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Deep Work Is Valuable",
      "wordCount": 4821,
      "file": "chapter-01.md"
    }
  ]
}
```

### Tests (Vitest)
- Chapter-splitting regexes against synthetic input strings
- EPUB TOC extraction against a Project Gutenberg fixture
- PDF page-heuristic fallback
- Metadata output shape validation

---

## Phase 2: Skills (`.claude/skills/`)

All skills have `disable-model-invocation: true` (manually invoked, all have side effects).

### `/parse-book <file-path>`
```yaml
name: parse-book
description: Parse a PDF or EPUB book into raw chapters. Run before summarizing.
disable-model-invocation: true
argument-hint: <path/to/book.epub|pdf>
allowed-tools: Bash Read
```
1. Runs `pnpm exec tsx src/cli.ts parse $ARGUMENTS`
2. Reads `metadata.json` and reports title, author, chapter count, output location

### `/summarize-book <slug>`
```yaml
name: summarize-book
description: Generate deep chapter summaries and full-book summary. Requires parsed book.
disable-model-invocation: true
effort: high
argument-hint: <book-slug>
allowed-tools: Read Write Agent
```
1. Reads `book-output/$ARGUMENTS/metadata.json` → chapter list
2. Dispatches **one `book-analyst` subagent per chapter in parallel** via Agent tool
3. Each subagent reads its chapter file and writes `chapter-XX-summary.md` directly to disk
4. After all subagents complete, main Claude writes `full-book-summary.md`

Template lives in `summarize-book/chapter-summary-template.md` and is embedded inline in each delegation message.

### `/practice-book <slug> [chapter-number]`
```yaml
name: practice-book
description: Generate practice exercises per chapter. Optional chapter number targets one chapter.
disable-model-invocation: true
effort: high
argument-hint: <book-slug> [chapter-number]
allowed-tools: Read Write Agent
```
Same parallel pattern as `summarize-book`. `$ARGUMENTS[1]` (if present) targets a single chapter. After all chapters, writes `full-book-practice.md`.

### `/book-quiz <slug>`
```yaml
name: book-quiz
description: Interactive quiz on a book's summaries. Uses AskUserQuestion for Q&A feedback loop.
disable-model-invocation: true
argument-hint: <book-slug>
allowed-tools: Read
```
1. Reads all `chapter-XX-summary.md` files
2. AskUserQuestion loop: one question at a time → evaluate answer → feedback → track score
3. Reports final score at end

### `/book-status`
```yaml
name: book-status
description: Show all parsed books and their summarization/practice completion status.
disable-model-invocation: true
allowed-tools: Bash Read Glob
```
Scans `book-output/` and prints:
```
Book          | Parsed | Summaries | Practice
deep-work     |   ✓    |    ✓      |    ✗
atomic-habits |   ✓    |    ✗      |    ✗
```

---

## Phase 3: `book-analyst` Subagent (`.claude/agents/book-analyst.md`)

```yaml
---
name: book-analyst
description: Analyzes a single book chapter and writes deep summaries or practice exercises to disk. Delegate here for per-chapter content generation.
tools: Read, Write, Bash
model: sonnet
effort: high
color: cyan
---
```

**System prompt:** Specialist in literary analysis, concept extraction, and educational content creation. Receives a delegation message containing:
- Source chapter file path
- Output file path
- Book title and author
- Task type (`summary` or `practice`)
- Full template to follow (embedded inline)

Reads the chapter, generates content that meets the template, writes it to the output path, then responds with a single confirmation: `✓ chapter-XX done (word count: NNNN)`.

**Why `Write` tools (not read-only):** Subagents write output directly to disk so that large generated content (potentially 2k+ tokens per chapter) does not flow back through the main conversation context. Only the small confirmation line returns — preserving context for the orchestrating session.

### Delegation Message Shape
```
Analyze: book-output/deep-work/raw-chapters/chapter-03.md
Write to: book-output/deep-work/summaries/chapter-03-summary.md
Book: "Deep Work" by Cal Newport
Chapter title: "Deep Work Is Rare"
Task: summary

Template:
[full contents of chapter-summary-template.md embedded here]
```

---

## Phase 4: Summary Template (chapter-summary-template.md)

```markdown
# Chapter [N]: [Title]

## 🧠 Core Thesis
The single most important idea of this chapter in 1-2 sentences.

## 📖 Detailed Breakdown
For each major concept/argument:
### [Concept Name]
- **What it is**: Plain language explanation
- **Why it matters**: Problem it solves / why the author included it
- **How it works**: Mechanism, process, or logic step by step
- **Key quote or example**: Most memorable illustration from the text
- **Connection**: How this links to other concepts in the book

## 🔑 Key Takeaways
5-10 distilled takeaways, each actionable or memorable.

## 🗺️ Mental Model / Framework
A conceptual framework, analogy, or mental model capturing the chapter's logic.

## 💡 "Aha!" Moments
2-3 surprising or counterintuitive insights.

## 🔗 Connections to Other Chapters
How this chapter builds on previous ones and sets up future ones.

## 📝 In My Own Words (ELI5)
The whole chapter explained as if to a smart 12-year-old.
```

---

## Phase 4b: Full-Book Summary Structure (`full-book-summary.md`)

Generated by main Claude after all chapter agents complete:

1. **Book thesis** — 3 sentences
2. **Chapter-by-chapter summaries** — one paragraph per chapter
3. **Core argument arc** — how ideas build across the book
4. **10 most important ideas** — across the entire book
5. **Who should read this and why**
6. **What the book does NOT cover** — blind spots and omissions

---

## Phase 4c: Full-Book Practice Structure (`full-book-practice.md`)

Generated by main Claude after all chapter practice files exist:

1. **Comprehensive quiz** — 10 questions spanning all chapters
2. **Capstone scenarios** — 3 complex problems requiring multi-chapter knowledge
3. **30-day implementation plan** — structured daily/weekly actions to apply the book's teachings

---

## Phase 5: Practice Template (chapter-practice-template.md)

```markdown
# Practice Exercises: Chapter [N] — [Title]

## 🧪 Comprehension Check
5 conceptual questions (not trivia).
Each followed by a detailed answer in a <details> tag.

## 🔄 Apply It
3 realistic scenarios requiring application of chapter knowledge.
- Scenario description
- What to consider
- Model response in <details>

## ✍️ Reflection Prompts
3 open-ended questions connecting material to the reader's own life/work.

## 🗣️ Teach It Back (Feynman Technique)
Prompt: explain [concept] in 3 sentences to someone with zero context.
Model ideal explanation in <details>.

## 🧩 Synthesis Challenge
1 exercise combining knowledge from this chapter with previous chapters.

## 📋 Action Items
3 concrete things to do this week to apply the chapter's lessons.
```

---

## Phase 6: Data Flow

```
/parse-book ~/Books/deep-work.epub
  └─ Bash: pnpm exec tsx src/cli.ts parse ...
       ├─ epub2 reads TOC → 18 chapters
       ├─ writes raw-chapters/chapter-01.md … chapter-18.md
       └─ writes metadata.json
  └─ Reports: "Deep Work" · Cal Newport · 18 chapters

/summarize-book deep-work
  └─ Reads metadata.json → 18 chapters
  └─ Dispatches 18 book-analyst agents IN PARALLEL
       ├─ agent-01: reads chapter-01.md → writes chapter-01-summary.md ✓
       ├─ agent-02: reads chapter-02.md → writes chapter-02-summary.md ✓
       ├─ …
       └─ agent-18: reads chapter-18.md → writes chapter-18-summary.md ✓
  └─ Main Claude reads all summaries → writes full-book-summary.md

/practice-book deep-work
  └─ Same parallel pattern → writes chapter-XX-practice.md + full-book-practice.md

/practice-book deep-work 3
  └─ Targets chapter 3 only → writes chapter-03-practice.md

/book-quiz deep-work
  └─ Reads all summaries
  └─ AskUserQuestion loop: Q → answer → feedback → score

/book-status
  └─ Scans book-output/ → status table
```

---

## Phase 7: Project Configuration

### CLAUDE.md (concise)
- Parse: `pnpm exec tsx src/cli.ts parse <file>`
- Skills: `/parse-book`, `/summarize-book`, `/practice-book`, `/book-quiz`, `/book-status`
- Test: `pnpm test`
- Code style: TypeScript strict, ES modules, async/await
- CLI is parse-only; all AI work is in Claude Code skills
- `book-output/` is git-ignored

### `.gitignore` additions
```
book-output/
node_modules/
dist/
```

### `tsconfig.json`
- `strict: true`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`

### `package.json` scripts
```json
{
  "scripts": {
    "parse": "tsx src/cli.ts parse",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Constraints & Non-Goals

- **No Anthropic API calls** — all AI work runs inside the current Claude Code session
- **No `summarize`/`practice` CLI commands** — these are skills-only
- **No frontend** — markdown output only
- **No cloud storage** — all output is local files
