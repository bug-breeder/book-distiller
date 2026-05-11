# Widget Taxonomy (K1–K6)

Six widget kinds. Each is defined by what the reader does and what they see in response.

## K1 — Live structure

Reader manipulates a graph, sequence, or data structure; downstream computation re-runs.
**Example** (Networks Ch.2): type comma-separated edges like `A-B, B-C, A-D`; the notebook draws the graph, computes degree, connected components, BFS distances.
**Fits:** chapters where the central object is a structure that can be drawn.

## K2 — Real-dataset explorer

Reader picks a subset, axis, or filter of a real dataset cited in the book; chart re-renders.
**Example** (Influence Ch.1): bar chart of Langer's three Xerox-machine compliance conditions (60% / 93% / 94%).
**Fits:** chapters that cite a specific empirical study with numbers.

## K3 — Phenomenon recreator

Reader runs the experiment from the book; the widget simulates the mechanism and shows the outcome.
**Example** (Influence Ch.1, three-buckets-of-water): pick left-hand and right-hand starting temperatures; the chart shows how the same lukewarm bucket feels different to each hand.
**Fits:** chapters that describe a named mechanism, principle, or experiment.

## K4 — Annotated figure

A figure from the book is shown with reader-toggleable overlays (highlights, callouts, decompositions).
**Example** (Networks Ch.3): Fig 3.7 (overlap vs. tie strength) with a hover-toggle that reveals the underlying clustering coefficient calculation.
**Fits:** chapters with rich visual figures the book itself uses to make a point.

## K5 — Scenario / quiz feedback

Reader picks an answer to a scenario; widget responds with green/red feedback and an explanation.
**Example** (Influence Ch.1): "A car salesman waits until you've agreed to a $25,000 sedan before mentioning the $1,200 leather seats — which weapon is in play?"
**Fits:** every chapter — the universal active-recall surface.

## K6 — Phrase / scenario builder

Reader assembles a request, communication, or scenario from a small set of parts; widget predicts an outcome based on rules from the chapter.
**Example** (Influence Ch.1): pick opener × reason structure × stake → predicted compliance %.
**Fits:** chapters about rules of communication, persuasion, negotiation, or any domain where the principle is "constructing X gets you Y."

## Content-type → widget mix

The skill picks widget kinds based on the chapter's character:

| Chapter character          | K1  | K2  | K3  | K4  | K5  | K6  |
|----------------------------|-----|-----|-----|-----|-----|-----|
| Math/CS, structures        | 50% | 10% | 20% | 10% | 10% | 0%  |
| Math/CS, proofs + data     | 30% | 10% | 30% | 20% | 10% | 0%  |
| Prose, anecdote-driven     | 0%  | 10% | 35% | 0%  | 35% | 20% |
| Reference book (mixed)     | 20% | 20% | 20% | 10% | 20% | 10% |

Target per chapter: **6–12 widgets total**. Less than 6 feels thin; more than 12 feels crowded.
