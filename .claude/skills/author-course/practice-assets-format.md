# Practice assets format (skill-type courses)

Skill-type courses emit three files into `book-output/<slug>/` that drive the
browser practice scorer. Author them AFTER the lesson notes, once the rubric
content is grounded.

## `rubric.md`

The grading criteria, **grounded in the official public band descriptors**. Before
writing, use `WebSearch` to retrieve the official IELTS Writing Task 1 and Task 2
band descriptors (public version) and cite them. Include, for each of the four
criteria — Task Response/Achievement (TR), Coherence & Cohesion (CC), Lexical
Resource (LR), Grammatical Range & Accuracy (GRA) — the descriptor wording for
bands 5, 6, 7 and 8. This file is sent verbatim to the model as part of the
system prompt; write it so a grader could quote a specific line per criterion.

## `feedback-spec.md`

The output contract. State explicitly:
- Grade all four criteria (TR, CC, LR, GRA), each a whole or half band 0–9.
- The four `criteria` JSON keys are ALWAYS exactly `TR`, `CC`, `LR`, `GRA` — the
  browser scorer's validator rejects any other key. If a criterion has a
  task-specific name (e.g. IELTS Task 1's first criterion is "Task Achievement",
  Task 2's is "Task Response"), keep the key `TR` and note the task-specific name
  in that criterion's `justification` / `descriptorQuote`. Never rename a key.
- `overall` = mean of the four criterion bands, rounded to the nearest half band.
- For each criterion, return `band`, a `justification`, and a `descriptorQuote`
  (the exact band-descriptor line the essay was matched against — REQUIRED).
- Mark concrete `inlineErrors` (`quote`, `type` ∈ grammar|lexis|cohesion|task,
  `issue`, `fix`) and band-7 `rewrites` (`original`, `improved`, `why`).
- Emit `recurringErrorTags`: short kebab-case tags for systemic error patterns
  (e.g. `article-omission`, `subject-verb-agreement`).
- Return ONLY JSON in this exact shape:
  `{ overall, criteria: { TR|CC|LR|GRA: { band, justification, descriptorQuote } }, inlineErrors[], rewrites[], recurringErrorTags[] }`.

## `prompts.md`

A practice-prompt bank. One prompt per `###` heading (the heading is a stable,
kebab-case `id`). Under each heading, metadata lines then the prompt text:

    ### opinion-tech-replaces-teachers
    - task: 2
    - type: opinion
    Some people believe technology will replace teachers. To what extent do you agree or disagree?

    ### line-chart-energy-2000-2020
    - task: 1
    - type: line-chart
    - image: /practice-assets/<slug>/energy.png
    The line graph shows energy consumption by source between 2000 and 2020. Summarise the information.

Cover both Task 1 and Task 2 across the question/chart types taught in the course.
The optional `- image:` is a site-relative path under `interactive-book/static/`.
