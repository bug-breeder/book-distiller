---
name: book-status
description: Show all parsed books and their summarization/practice completion status.
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
- Read `book-output/<slug>/metadata.json` → title, author, chapterCount
- Raw chapters: count `.md` files in `book-output/<slug>/raw-chapters/`
- Summaries: count `chapter-XX-summary.md` files in `book-output/<slug>/summaries/`; check if `full-book-summary.md` exists
- Practice: count `chapter-XX-practice.md` files in `book-output/<slug>/practice/`; check if `full-book-practice.md` exists

### 4. Print the status table

```
Book              | Author           | Ch | Parsed | Summaries        | Practice
──────────────────────────────────────────────────────────────────────────────────
deep-work         | Cal Newport      | 18 |   ✓    | 18/18 + full ✓   | 0/18
atomic-habits     | James Clear      | 20 |   ✓    | 20/20 + full ✓   | 20/20 + full ✓
the-lean-startup  | Eric Ries        |  9 |   ✓    | 0/9              | 0/9
```

### 5. Suggest next actions
For each incomplete book, suggest the next skill to run.
