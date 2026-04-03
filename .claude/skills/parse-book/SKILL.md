---
name: parse-book
description: Parse a PDF or EPUB book into raw chapters. Run before summarizing.
disable-model-invocation: true
argument-hint: <path/to/book.epub|pdf>
allowed-tools: Bash Read
---

Parse the book at: $ARGUMENTS

## Steps

1. **Check the file exists**
   If `$ARGUMENTS` is empty or the file doesn't exist, tell the user:
   "Usage: /parse-book <path/to/book.epub|pdf>"

2. **Run the parser**
   ```bash
   npx tsx src/cli.ts parse "$ARGUMENTS"
   ```
   If it fails, report the error and suggest checking: file path, file extension (.epub or .pdf), and that `npm install` has been run.

3. **Read the generated metadata**
   The slug is derived from the book title (lowercase, hyphens). Read:
   `book-output/<slug>/metadata.json`

4. **Report a clean summary**
   Show:
   - Title and author
   - Number of chapters with a numbered list of their titles
   - Output location (`book-output/<slug>/`)
   - Next step: `/summarize-book <slug>`
