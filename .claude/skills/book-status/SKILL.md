---
name: book-status
description: Show all parsed books and their tutoring progress (chapters mastered, current chapter, reviews due).
disable-model-invocation: true
allowed-tools: Bash Read Glob
---

Show the status of all books in `book-output/`.

## Steps

### 1. Check if book-output/ exists
If `book-output/` doesn't exist or is empty:
> "No books have been parsed yet. Run `/parse-book <file>` to get started."
Stop.

### 2. Discover all books
List all subdirectories in `book-output/`. Each is a book slug.

### 3. For each book, collect status
- Read `book-output/<slug>/metadata.json` → title, author, chapterCount.
- Lesson notes: count `chapter-XX-lesson.md` files in `book-output/<slug>/lessons/`.
- Tutoring progress: run `pnpm exec tsx src/cli.ts progress show <slug>` and parse mastered/total, current chapter, reviews due. (If `progress.json` does not exist yet, this initializes it to chapter 1, 0 mastered.)

### 4. Print the status table

```
Book              | Author        | Ch | Lessons | Mastered | Cur | Due
────────────────────────────────────────────────────────────────────────
influence         | Cialdini      | 12 | 12/12   | 3/12     |  4  |  5
metamorphosis     | Kafka         |  3 |  1/3    | 1/3      |  2  |  0
```

### 5. Suggest next actions
For each book: if lessons are incomplete → suggest `/tutor-prep <slug>`; else → suggest `/tutor <slug>`.
