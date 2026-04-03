---
name: book-quiz
description: Interactive quiz on a book's summaries using AskUserQuestion. Tracks score and gives feedback.
disable-model-invocation: true
argument-hint: <book-slug>
allowed-tools: Read
---

Run an interactive quiz for the book with slug: **$ARGUMENTS**

## Steps

### 1. Load summaries
Read `book-output/$ARGUMENTS/metadata.json`.
Read all `book-output/$ARGUMENTS/summaries/chapter-XX-summary.md` files.
If summaries don't exist: tell the user to run `/summarize-book $ARGUMENTS` first and stop.

### 2. Generate 10 quiz questions
From the summaries, generate exactly 10 conceptual questions. Rules:
- No trivia ("In which chapter does the author mention X?")
- Each question requires explanation, reasoning, or application
- Cover at least 6 different chapters
- Mix question types: "Explain...", "Why does...", "How would you apply...", "What's the difference between..."
- Prepare an ideal answer for each before starting

### 3. Run the quiz loop
For each question (1 through 10), use AskUserQuestion:

Prompt format:
```
**Question N/10** (Chapter [X]: [Chapter Title])

[Question text]

(Running score: [current]/[questions answered so far])
```

After receiving the answer:
- Score: **1 point** = correct or substantially correct | **0.5 points** = partially correct | **0 points** = incorrect/missing
- Give feedback in 2-4 sentences: what was right, what was missing, the complete correct answer
- Then immediately ask the next question

### 4. Final report
After all 10 questions:

```
**Quiz complete!**
Final score: [X]/10

**Strong chapters:** [list chapters where they scored well]
**Review these chapters:** [list chapters where they struggled]

Suggested next step: Re-read the summaries for [chapters] and run /book-quiz $ARGUMENTS again.
```
