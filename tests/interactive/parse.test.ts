// tests/interactive/parse.test.ts
import { describe, it, expect } from 'vitest';
import { parseLesson } from '../../src/interactive/parse.js';

const md = `---
chapter: 4
title: "Chapter 4: Networks in Their Surrounding Contexts"
source: { type: pdf, pages: "99-132" }
---

## Teaching arc

1. Homophily — Understand what homophily is and why it shapes structure
2. Schelling's Segregation Model — Explain how mild preferences produce segregation

## Concepts

### C1 — Homophily
- **Explanation:** People form ties with others who are similar.
- **Why it matters:** Networks are not random graphs.
- **Check:** Would a random graph look like Figure 4.1? — **Ideal answer:** No, random mixing would not produce the clusters.
- **Misconception:** Homophily does not mean only befriending identical others.
- **Application:** Recommender systems exploit homophily.

#### Dig deeper
**Intuition:** Similar people share contexts, so they meet more often.

**Worked example:** 6 boys, 3 girls, 18 edges. p = 2/3, q = 1/3, so
2pq = 4/9; expect 8 cross-gender edges. Observed 5 < 8 -> homophily.

- a list item survives the capture

### C7 — Schelling's Segregation Model
- **Explanation:** Agents move when too few neighbors match their type.
- **Why it matters:** Segregation emerges without anyone seeking it.
- **Check:** Why no integration from random start? — **Ideal answer:** Local moves cannot achieve global coordination.

## Figures / Tables / Equations

- **Figure 4.1** — p. 101 — "School friendship network colored by race."
- **Figure 4.14** — p. 122 — "Chicago race maps (1940, 1960)." | concept: Schelling's Segregation Model
- (none)

## Visualizations

### Triadic closure forms a triangle | concept: Homophily | layout: circle
caption: A's two friends meet, closing the triangle.
note: A tendency, not a rule.
nodes: A, B@1, C@1:See
edges: A-B strong, A-C strong, B-C new

### A leftover signed figure | layout: force
nodes: P, Q
edges: P-Q negative (−)

## Review items

- id: c1-q1 | concept: Homophily | Q: What is homophily? | A: Ties form between similar people.
- id: c7-q1 | concept: Schelling's Segregation Model | Q: What drives segregation? | A: Local thresholds.
`;

describe('parseLesson', () => {
  const lesson = parseLesson(md);

  it('parses frontmatter', () => {
    expect(lesson.chapter).toBe(4);
    expect(lesson.title).toBe('Chapter 4: Networks in Their Surrounding Contexts');
    expect(lesson.sourceType).toBe('pdf');
    expect(lesson.sourceRef).toBe('99-132');
  });

  it('parses the teaching arc lines without the leading number', () => {
    expect(lesson.teachingArc).toHaveLength(2);
    expect(lesson.teachingArc[0]).toMatch(/^Homophily — /);
  });

  it('parses concepts including the check split into question and ideal answer', () => {
    expect(lesson.concepts).toHaveLength(2);
    const c1 = lesson.concepts[0];
    expect(c1.label).toBe('C1');
    expect(c1.name).toBe('Homophily');
    expect(c1.explanation).toBe('People form ties with others who are similar.');
    expect(c1.whyItMatters).toBe('Networks are not random graphs.');
    expect(c1.check).toEqual({
      question: 'Would a random graph look like Figure 4.1?',
      idealAnswer: 'No, random mixing would not produce the clusters.',
    });
    expect(c1.misconception).toBe('Homophily does not mean only befriending identical others.');
    expect(c1.application).toBe('Recommender systems exploit homophily.');
  });

  it('omits the application when a concept has none', () => {
    expect(lesson.concepts[1].application).toBeUndefined();
  });

  it('parses figures (label, location, caption) and skips (none)', () => {
    expect(lesson.figures).toHaveLength(2);
    expect(lesson.figures[0]).toEqual({
      label: 'Figure 4.1',
      location: 'p. 101',
      caption: 'School friendship network colored by race.',
    });
    expect(lesson.figures[0].concept).toBeUndefined();
  });

  it('parses the optional `| concept:` tag that marks a figure for inline extraction', () => {
    expect(lesson.figures[1]).toEqual({
      label: 'Figure 4.14',
      location: 'p. 122',
      caption: 'Chicago race maps (1940, 1960).',
      concept: "Schelling's Segregation Model",
    });
  });

  it('parses review items with concept names', () => {
    expect(lesson.reviewItems).toHaveLength(2);
    expect(lesson.reviewItems[1].concept).toBe("Schelling's Segregation Model");
  });

  it('parses visualization specs: header metadata, nodes, and edges', () => {
    expect(lesson.visualizations).toHaveLength(2);
    const v = lesson.visualizations[0];
    expect(v.title).toBe('Triadic closure forms a triangle');
    expect(v.concept).toBe('Homophily');
    expect(v.layout).toBe('circle');
    expect(v.caption).toBe("A's two friends meet, closing the triangle.");
    expect(v.note).toBe('A tendency, not a rule.');
    expect(v.nodes).toEqual([
      { id: 'A' },
      { id: 'B', group: 1 },
      { id: 'C', group: 1, label: 'See' },
    ]);
    expect(v.edges).toEqual([
      { source: 'A', target: 'B', kind: 'strong' },
      { source: 'A', target: 'C', kind: 'strong' },
      { source: 'B', target: 'C', kind: 'new' },
    ]);
  });

  it('captures the #### Dig deeper block into digDeeper', () => {
    const homophily = lesson.concepts.find((c) => c.name === 'Homophily');
    expect(homophily?.digDeeper).toBeDefined();
    expect(homophily?.digDeeper).toContain('**Intuition:**');
    expect(homophily?.digDeeper).toContain('**Worked example:**');
    // multi-paragraph + inequalities + list items are preserved verbatim
    expect(homophily?.digDeeper).toContain('5 < 8');
    expect(homophily?.digDeeper).toContain('- a list item survives the capture');
    // the next concept (no Dig deeper) leaves it undefined; capture stops at ## Figures
    const schelling = lesson.concepts.find((c) => c.name === "Schelling's Segregation Model");
    expect(schelling?.digDeeper).toBeUndefined();
    // ## Figures content never leaks into a concept body
    expect(homophily?.digDeeper).not.toContain('Figure 4.1');
  });

  it('parses a visualization with no concept anchor and a signed edge label', () => {
    const v = lesson.visualizations[1];
    expect(v.title).toBe('A leftover signed figure');
    expect(v.concept).toBeUndefined();
    expect(v.layout).toBe('force');
    expect(v.edges[0]).toEqual({ source: 'P', target: 'Q', kind: 'negative', label: '−' });
  });
});
