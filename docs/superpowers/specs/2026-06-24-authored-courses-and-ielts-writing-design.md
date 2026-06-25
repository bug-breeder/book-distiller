# Authored Courses Pipeline + IELTS Writing 7.0 Coaching System — Design

**Date:** 2026-06-24 (Phase 2 architecture revised 2026-06-25)
**Status:** Phase 1 (authoring core) implemented & merged (PR #6). Phase 2 (practice→feedback loop) re-architected to a browser-side, bring-your-own-key scorer — approved (brainstorming), pending implementation plan.
**Builds on:** `2026-05-31-ai-tutor-design.md` (lesson notes, `/tutor`, progress), `2026-05-11-interactive-learning-design.md` and `2026-06-12-generic-visual-engine-design.md` (Docusaurus + `/visualize` sims). Reuses their downstream pipeline unchanged.
**References (methodology, not code):** `github.com/dmccreary/intelligent-textbooks` — course-description → Bloom → concept-enumeration → concept-dependency DAG → taxonomy → learning-graph workflow.

## Context & motivation

study-mate today can only learn from a **parsed book** (PDF/EPUB → `/parse-book` → `/tutor-prep` → lesson notes → `/visualize` → `interactive` → `/tutor`). There is no way to author a course **from a topic** when no source book exists.

Two things are wanted:

1. **A reusable "topic → interactive coaching system" pipeline** — author a course from a topic description, with the same (and better) interactive book + live tutor + spaced-repetition output study-mate already produces.
2. **The first course built on it: an IELTS Academic Writing 7.0 course** for the project owner — Vietnamese-L1, strong everyday/professional English (software engineer), no prior IELTS exposure, self-assessed ~5.5. Goal: **band 7.0 in Writing with minimum time-effort**, 2×1-hour lessons/week over 10 weeks.

**Key realization that shaped this design:** IELTS Writing is a *productive skill*, not a body of facts. Reading + flashcards alone do not move a band score — **writing essays and getting them scored against the four official criteria, then revising, does.** Therefore the **practice→feedback loop is the core of the product**, not an add-on. The pipeline is correspondingly made **domain-adaptive**: it distinguishes *knowledge-type* courses (today's behaviour) from *skill-type* courses (which additionally generate a rubric, a practice-prompt bank, and a feedback spec driving a browser-side essay scorer).

## The seam (why this is mostly additive)

Everything downstream of `book-output/<slug>/lessons/*.md` — `/visualize`, `interactive` (Docusaurus), `/tutor`, `progress.json`, `lint-lessons` — is **topic-agnostic and already built.** Only two things are PDF/EPUB-specific: `/parse-book` (produces chapters) and `book-analyst` (distils a chapter into a lesson note). The authored pipeline replaces exactly those two with a knowledge/research-sourced front-end and reuses the rest.

```
KNOWLEDGE-TYPE (and today's parsed flow):
  /author-course "<topic>"  →  course-spec.md, concepts.csv, outline.md, lessons/*.md
                            →  /visualize → interactive → /tutor        (UNCHANGED)

SKILL-TYPE (e.g. IELTS) additionally emits:
                            →  rubric.md, prompts.md (practice bank), feedback-spec.md
                            →  interactive builds practice.json + practice.mdx into the site
                            →  <PracticeScorer> in the browser: essay → graded feedback
                               → localStorage trajectory + SM-2 deck  (NEW loop, browser-side)
```

## Goals

- **`/author-course "<topic>"`**: generate a full course from a topic + constraints, producing artifacts that flow into the existing Docusaurus + tutor pipeline with no downstream changes.
- **Adopt dmccreary's upfront rigor**, scaled to the domain: a structured **course-spec** (audience, prerequisites, Bloom-tagged objectives, assessment), **concept enumeration**, a **concept-dependency DAG**, and a **~10-category color taxonomy**.
- **Keep study-mate's superior back end**: React sims (not p5 iframes), live AI tutor, enforced clarity contract, spaced repetition.
- **Learning-graph viewer** (full, in v1): an interactive Docusaurus course-map of the concept DAG, **shaded by per-concept mastery** from `progress.json` (something the reference repo cannot do).
- **Domain-adaptive skill-type support**: rubric + practice-prompt bank + a **practice→feedback loop that runs in the browser** on the deployed Docusaurus site (Cloudflare Pages), with a **band/score trajectory** persisted in the visitor's `localStorage`.
- **Deliver the IELTS Academic Writing 7.0 course** as the first run: a sharp, minimum-effort-to-7.0 curriculum (20 sessions / 10 weeks), personalized to a Vietnamese-L1 strong-functional-English learner.

## Non-goals

- **Authoring** AI runs inside the Claude Code session (unchanged); `WebSearch` grounding during authoring is allowed and optional. The **practice scorer is the deliberate exception**: it runs in the visitor's browser against an **OpenAI-compatible API the visitor configures with their own key** (stored only in their `localStorage`). study-mate ships **no API key** in the bundle and runs **no key-holding server** — there is nothing to leak or bill.
- No auth gate, no shared/pooled key, no accounts. Access control is "bring your own key": a visitor without a key can read the course but cannot score essays.
- No automated official-style band *certification* — the practice loop gives well-justified estimates against the public band descriptors, explicitly framed as practice feedback, not an official score.
- Not changing `/parse-book` or the parsed-book path; authored courses are an additional front-end.
- No new viz library beyond the existing allowlist (the learning-graph viewer uses D3, already allowlisted).
- Premature abstraction: skill-type support is built cleanly for IELTS and reused by construction, not generalized into speculative infrastructure for hypothetical courses.

## Architecture

### New / changed code surface (kept small)

| Component | Type | Role |
|---|---|---|
| `/author-course` | **new skill** | Orchestrates course-spec → concepts.csv (DAG + taxonomy) → outline → per-module lesson notes. Resumable. Detects skill-type vs knowledge-type. |
| `course-author` | **new agent** | Authoring analog of `book-analyst`: writes one module's lesson note from knowledge + optional `WebSearch`, conforming to the (extended) lesson-note template + clarity lint. |
| `<PracticeScorer>` | **new Docusaurus component** | Skill-type only, runs in the browser. Settings (key/baseURL/model in `localStorage`) → prompt picker → essay box → `scoreEssay()` calls the visitor's OpenAI-compatible provider → validated 4-criteria JSON → render (per-criterion bands + inline errors + band-7 rewrites). Appends the attempt + seeds error cards into `localStorage`. Companion `<BandTrajectory>` (Recharts) and `<ReviewDrills>` (persistent SM-2 deck) read the same store. |
| `scoreEssay` + `practiceStore` + `srs` | **new browser lib** | `src/lib/score.ts` (provider call + `parseScoreResponse` validation gate + error taxonomy + one-retry CORS fallback), `src/lib/practiceStore.ts` (per-slug `localStorage` for attempts + deck), `src/lib/srs.ts` (pure SM-2 ported from `src/progress/schedule.ts`). All pure except the injected `fetch`. |
| `functions/api/score.ts` | **new Cloudflare Pages Function** | Keyless pass-through that forwards the visitor's `Authorization` header + body to their configured provider with permissive CORS. Holds no secret; used only when a provider blocks browser-origin calls. |
| `course-author` skill artifacts | **extended** | For skill-type courses, additionally authors `rubric.md` (WebSearch-grounded + descriptor-cited), `prompts.md`, `feedback-spec.md`. |
| `interactive` generator | **extended (additive)** | For `courseType === 'skill'`, parses the three skill files and emits `practice.json` (config bundle) + `practice.mdx` (mounts `<PracticeScorer>`), reusing the existing co-located-JSON emission pattern. |
| `LearningGraph` | **new Docusaurus component** | Interactive course-map: nodes = concepts colored by taxonomy, edges = prerequisites, shaded by mastery; click → jump to lesson. D3-based. |
| `learning-graph` | **new CLI subcommand** | Validate `concepts.csv` is a DAG (no cycles, every concept connected), emit the viewer's JSON; `interactive` embeds the map page. |
| lesson-note template | **extended (additive)** | Optional skill blocks: `#### Model answers` (banded, e.g. band-6 vs band-7 side by side) and `#### Practice` (prompt + what's assessed). Knowledge-type courses omit them. |
| practice history | **browser `localStorage`** | Skill-course practice state lives **client-side**, not in `progress.json` (the static site has no writable server): `studymate:<slug>:attempts` (per-attempt criterion scores + date → trajectory), `studymate:<slug>:deck` (SM-2 review items seeded from recurring errors), `studymate:<slug>:config` (key/baseURL/model). Essay text is not persisted by default; export-to-JSON + reset are offered. `progress.json` and `/tutor` are unchanged. |
| frontmatter | **extended** | `source: { type: authored }`; `extract-figures` is a no-op for authored books (no source PDF). |

Reused unchanged: `lint-lessons`, `/visualize` + `sim-author`, `SimHost`/`GraphFigure`/`VizControls`, `/tutor`, `progress.json`, the session-only `<Flashcards>`. The `interactive` generator gains an additive skill-course branch; the SM-2 scheduler in `src/progress/schedule.ts` is **ported** (copied as pure functions to `src/lib/srs.ts` for the browser bundle), its Node source unchanged.

### Authored-course artifacts (`book-output/<slug>/`)

| Artifact | Contents |
|---|---|
| `course-spec.md` | Title, audience, prerequisites, narrative description, **Bloom-tagged learning objectives**, topics, duration, **assessment method**, course `type: skill\|knowledge`. |
| `concepts.csv` | `ConceptID, ConceptLabel, Dependencies (pipe-delimited IDs), TaxonomyID, Bloom`. A DAG: foundation concepts have empty Dependencies. Scaled to the domain (~50 for IELTS, not 250). |
| `outline.md` | Concepts grouped into modules (= the 20 IELTS sessions), in teaching order. |
| `lessons/*.md` | One lesson note per module, existing template + per-concept Bloom tag (+ skill blocks for skill-type). |
| `rubric.md` *(skill)* | The grading criteria (for IELTS: the four public band descriptors, band 5–8 rows). |
| `prompts.md` *(skill)* | Practice-prompt bank (Task 1 + Task 2 prompts across question/chart types). |
| `feedback-spec.md` *(skill)* | The grading **output contract** shipped to the browser scorer as part of the system prompt: the four criteria, what each band requires, the official rounding rule (mean of TR/CC/LR/GRA → nearest half band), inline-error conventions, the required `descriptorQuote` per criterion, and the exact JSON response shape (`overall`, `criteria{TR,CC,LR,GRA}`, `inlineErrors[]`, `rewrites[]`, `recurringErrorTags[]`). |

### Phase 2 — Practice→feedback loop (detailed architecture)

**Data flow (authoring → build → browser):**

```
AUTHOR   /author-course (skill-type) → course-author writes rubric.md (WebSearch-grounded,
         descriptor-cited) + prompts.md (Task 1 & Task 2 bank) + feedback-spec.md (JSON contract)
BUILD    interactive <slug>, courseType === 'skill' → parse the 3 files →
         emit docs/<slug>/practice.json (rubric + feedback-spec + prompt bank, NO key) +
         docs/<slug>/practice.mdx (mounts <PracticeScorer config={practice.json} />)
BROWSER  visitor sets key/baseURL/model (localStorage) → picks a prompt → writes essay →
         scoreEssay(): system = rubric + feedback-spec, user = task + prompt + essay,
         response_format = json_schema → provider (direct; one auto-retry via /api/score on CORS) →
         parseScoreResponse() validates → render → appendAttempt + seed deck → trajectory + drills
```

**Grading response contract** (validated client-side by `parseScoreResponse` before any render):

```
{ overall: number,                                  // 0–9 in .5 steps; mean of the four, rounded to nearest half
  criteria: { TR|CC|LR|GRA: { band, justification, descriptorQuote } },  // descriptorQuote REQUIRED
  inlineErrors: [ { quote, type: grammar|lexis|cohesion|task, issue, fix } ],
  rewrites:     [ { original, improved, why } ],     // band-7 upgrades
  recurringErrorTags: string[] }                     // seed the SM-2 deck (deduped by tag)
```

A response missing a criterion, missing a `descriptorQuote`, or with a band outside 0–9/.5 steps is rejected with a typed `ScoreFormatError` — garbage is never rendered.

**Error taxonomy → UX** (no silent failures): `NoKeyError` (prompt to add key) · `AuthError` 401/403 (key rejected) · `RateLimitError` 429 (retry button) · `NetworkError`/CORS (auto-retry once via `/api/score`, then surface) · `ScoreFormatError` (one auto-retry, then manual) · `ProviderError` 5xx. **At most one automatic retry per submit**; everything beyond is a manual retry button (no loops, no double-charging).

**Persistence (per-slug `localStorage`):** `…:config` = `{apiKey, baseURL, model}` (only place the key lives) · `…:attempts` = grade + metadata per attempt (essay text NOT stored by default) · `…:deck` = SM-2 `ReviewItem[]`. Recurring-error tags seed deck cards **deduped by tag** (a repeat error confirms weakness, doesn't duplicate the card). The UI surfaces a privacy note (key + history are local; essay goes only to the configured provider) plus export-to-JSON and per-course reset.

**`<ReviewDrills>` is distinct from the existing session-only `<Flashcards>`** — Flashcards stays untouched; ReviewDrills is a new persistent SM-2 deck over `localStorage`.

**Testing:** pure modules fully unit-tested (`parse*` of the 3 files, `buildPracticeBundle`, `parseScoreResponse` every rejection path, `srs`, `practiceStore` over a storage stub); `scoreEssay` with an injected `fetch` (request shape, CORS→fallback, each error mapping); generator fixture test (emits valid `practice.json` + `practice.mdx`); light React render tests; `pnpm build` as the render gate. **No live-API call in CI** — the provider is always mocked.

### The four loops (product view)

- **Learn** — interactive book: techniques, decoded band descriptors, banded model answers, sims. *(existing pipeline)*
- **Drill** — spaced repetition over the memorizable layer: sentence frames, collocations, linkers, the learner's **personal recurring error rules**. *(existing scheduler + new error feed)*
- **Practice + Feedback** ⭐ — `<PracticeScorer>` in the browser: real essay → the visitor's own LLM grades all 4 criteria with descriptor-cited justification + inline errors + band-7 rewrites → revise. *(new core, browser-side, bring-your-own-key)*
- **Track** — `<BandTrajectory>` (per-criterion + overall band over time) and `<ReviewDrills>` (persistent SM-2 deck) read the visitor's `localStorage`; `LearningGraph` map shaded by mastery from `progress.json`. *(new browser store + extend existing)*

### IELTS-specific sims (authored by `/visualize`, real study tools)

Band-descriptor explorer (toggle bands 5/6/7/8, watch each criterion change) · sentence-complexity analyzer (clause structure → simple/compound/complex) · essay-structure builder · Task 1 trend-language picker (chart shape → matching verbs + degree adverbs) · filterable collocation bank by theme.

## The IELTS Academic Writing 7.0 course (first run)

### Band-7 strategy (the pedagogy / IP)

- **GRA is the silent ceiling.** Band 7 requires "frequent error-free sentences" + a variety of complex structures. For a Vietnamese-L1 learner the predictable point-leaks are **articles (a/an/the), countability & plural -s, subject–verb agreement, tense consistency, and prepositions** (Vietnamese lacks article and inflectional morphology). Systematically eliminating these is the single biggest lever.
- **Task 2 is double-weighted** → it receives the most time.
- **Templates + error-elimination + targeted collocations** beat brute-force essay volume — reusable frames deployable on any prompt = minimum effort.
- **Task 1: the overview is mandatory** for band 7 and is the cheapest ~0.5 band; a fixed 4-part method (intro paraphrase → overview of key features → 2 detail paragraphs) makes it repeatable.
- **Cohesion without overuse** — mechanical linker-spam is a band-6 marker; band 7 uses a range "appropriately."
- **LR = collocation + paraphrase, not thesaurus dumping** — band 7 wants less-common items used naturally; misused "big words" cap LR.
- **Diagnostic-driven personalization** — S1 captures a baseline graded essay; the course emphasizes the learner's actual weakest criteria.

### Taxonomy (~10 color groups)

1. Test Foundations & Band Descriptors · 2. Grammatical Range & Accuracy (incl. VN error clinic) · 3. Lexical Resource · 4. Coherence & Cohesion · 5. Task 2 — Structure & Argument · 6. Task 2 — Question Types · 7. Task 1 — Method & Overview · 8. Task 1 — Chart/Diagram Types · 9. Exam Strategy, Timing & Proofreading · 10. Practice, Feedback & Self-Assessment.

### 20 sessions / 10 weeks (2×1h per week)

| Wk | Session | Focus |
|---|---|---|
| 1 | S1 | Test format + 4 band descriptors decoded + **diagnostic baseline essay → personal gap profile** |
| 1 | S2 | The 4 complex sentence structures that signal "range" (relative, conditional, subordinated, participle) |
| 2 | S3 | VN error clinic I: articles, countability, plurals, S–V agreement |
| 2 | S4 | VN error clinic II: tense consistency, prepositions, clause word order, punctuation |
| 3 | S5 | Task 2: the 5 question types — identify + match a structure |
| 3 | S6 | Task 2: introduction/thesis + conclusion frames; clear position throughout |
| 4 | S7 | Task 2 body paragraphs: point → develop → example → link; extending ideas |
| 4 | S8 | Coherence & cohesion: progression, linkers without overuse, referencing → **Practice essay #1 (graded)** |
| 5 | S9 | Opinion + Discussion essays (timed, graded) |
| 5 | S10 | Advantages/Disadvantages + Problem/Solution + Two-part (timed, graded) |
| 6 | S11 | Paraphrasing without errors (word forms, collocation-aware synonyms, voice) |
| 6 | S12 | Collocation + topic-vocab banks for 8 high-frequency themes (education, environment, technology, health, crime/law, work, government, globalization) |
| 7 | S13 | Task 1 method: 4-part structure + the mandatory overview + trend-language families (verbs + degree adverbs) |
| 7 | S14 | Task 1: line/bar/table — trends, comparison, proportion, tense → **Practice Task 1 #1 (graded)** |
| 8 | S15 | Task 1: pie, process (passive/sequence), map (location/change), mixed/multiple charts |
| 8 | S16 | Task 1 timed practice + data-accuracy / no-opinion rules + common mistakes |
| 9 | S17 | **Full timed Mock #1** (Task 1 + Task 2 in 60 min) — both graded |
| 9 | S18 | Proofreading under time: personal error checklist; upgrading 6→7 sentences live |
| 10 | S19 | **Full timed Mock #2** + targeted review of weakest criterion |
| 10 | S20 | Band-7 checklists (both tasks), personal do/don't list, exam-day plan, maintenance plan |

Outcome: ~7 graded pieces with a visible band trajectory by week 10; the practice loop and spaced-repetition deck personalize to the learner's recurring errors throughout.

## Build order (decomposition — nothing dropped; ordered for fastest time-to-value)

This is a program, not a single spec. Each phase is implemented in its own plan; the learner can begin studying after Phase 2.

1. **Authoring core + skill-type extension** — `/author-course`, `course-author`, course-spec, concepts.csv (DAG + taxonomy), outline, extended lesson-note template, `authored` frontmatter. Produces the IELTS lesson notes. *Unblocks Learn + Drill.*
2. **Practice→feedback loop (browser)** — `course-author` authors rubric/prompts/feedback-spec; `interactive` emits `practice.json` + `practice.mdx`; browser `scoreEssay`/`practiceStore`/`srs` libs; `<PracticeScorer>` + `<BandTrajectory>` + `<ReviewDrills>` components; `functions/api/score.ts` keyless CORS fallback; Cloudflare Pages deploy. Bring-your-own-key, `localStorage` trajectory + SM-2 deck. *Unblocks the band-moving practice.*
3. **IELTS content pass** — curated model answers (band-6 vs band-7), VN-L1 error clinic, collocation banks, 8-theme vocab, prompt bank.
4. **Learning-graph viewer + IELTS sims** — `LearningGraph` component + `learning-graph` CLI; the five study-tool sims via `/visualize`.

## Open questions / risks

- **Skill-type vs knowledge-type detection** — explicit flag on `course-spec` (set during `/author-course`), not heuristic, to avoid misclassification.
- **Grading reliability** — scorer estimates are anchored to the public descriptors and the WebSearch-grounded course rubric; framed as practice feedback, never an official score. The required `descriptorQuote` per criterion forces each band onto a cited descriptor row rather than vibes, and `parseScoreResponse` rejects any response that omits it. Quality also depends on the visitor's chosen model — `feedback-spec.md` requests a structured `response_format`, but a weak model still yields weak feedback; this is disclosed.
- **Browser API-key exposure** — mitigated by design: each visitor supplies their **own** key (stored only in their `localStorage`, sent only to the provider they configure). study-mate ships no key and runs no key-holding server, so there is no shared wallet to drain and nothing to leak from the bundle. The keyless `/api/score` Function forwards the visitor's own `Authorization` header and stores nothing.
- **Cloudflare Pages** — static Docusaurus `build/` output; Pages Functions dir for `/api/score` only; no env vars, no KV, no secrets in the project. A `wrangler`/Pages config note keeps the deploy reproducible.
- **Lesson-note template extension** must remain backward-compatible so `lint-lessons` and the `interactive` generator keep working for existing parsed books (the new blocks are optional and ignored when absent).
- **Concept count discipline** — ~50 skill concepts for IELTS; resist the reference repo's 250-concept default, which suits knowledge domains.
