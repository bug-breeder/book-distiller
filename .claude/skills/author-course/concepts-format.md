# concepts.csv format

A connected dependency DAG. Header row EXACTLY:

`ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom`

- **ConceptID** — positive integer, unique.
- **ConceptLabel** — short title-case label, NO commas.
- **Dependencies** — pipe-delimited ConceptIDs that must be learned first; empty for foundation concepts.
- **TaxonomyID** — the concept's category (1..N from the course taxonomy).
- **Bloom** — one of: Remember, Understand, Apply, Analyze, Evaluate, Create.

Scale to the domain: aim for the natural number of real concepts (≈50 for a focused skill course), NOT a fixed 250.

# outline.md format

Group concepts into modules (= sessions). Each module is ONE line of this exact form (other prose is ignored):

`- module: NN | title: <Module Title> | concepts: <comma-separated ConceptIDs>`

NN is zero-padded (01, 02, …) and becomes the chapter number.
