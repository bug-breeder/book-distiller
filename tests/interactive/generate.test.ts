import { describe, it, expect } from 'vitest';
import { renderChapter } from '../../src/interactive/generate.js';
import type { ParsedLesson, SimEntry } from '../../src/interactive/types.js';
import type { ChapterIndex } from '../../src/parser/types.js';

const lesson: ParsedLesson = {
  chapter: 4,
  title: 'Chapter 4: Contexts',
  sourceType: 'pdf',
  sourceRef: '99-132',
  teachingArc: [],
  concepts: [
    { label: 'C1', name: 'Homophily', explanation: 'Ties form between similar people.', whyItMatters: '' },
    { label: 'C2', name: "Schelling's Segregation Model", explanation: 'Agents relocate.', whyItMatters: '' },
  ],
  figures: [],
  visualizations: [],
  reviewItems: [],
};

const chapter: ChapterIndex = {
  chapterNumber: 4,
  chapterTitle: 'Chapter 4: Contexts',
  wordCount: 1000,
  file: 'chapter-04.md',
  pageRange: { start: 99, end: 132 },
};

const sims: SimEntry[] = [
  {
    chapter: 4,
    concept: "Schelling's Segregation Model",
    title: 'Schelling on a grid',
    caption: 'Drag the slider.',
    file: 'ch4/schelling.tsx',
    libs: ['d3'],
  },
];

describe('renderChapter sim anchoring', () => {
  const mdx = renderChapter(lesson, chapter, 'networks-book', 'Networks', new Map(), sims);

  it('imports the sim component + its meta', () => {
    expect(mdx).toContain("import Sim_0, { meta as simMeta_0 } from '@site/src/sims/networks-book/ch4/schelling';");
  });

  it('renders the sim through SimHost right after its concept', () => {
    const schellingIdx = mdx.indexOf("## Schelling's Segregation Model");
    const hostIdx = mdx.indexOf('<SimHost meta={simMeta_0} component={Sim_0} />');
    expect(hostIdx).toBeGreaterThan(schellingIdx);
    const homophilyIdx = mdx.indexOf('## Homophily');
    expect(hostIdx).toBeGreaterThan(homophilyIdx);
  });

  it('counts sims in the source line', () => {
    expect(mdx).toMatch(/1 figures/);
  });
});

describe('renderChapter unanchored sim', () => {
  const orphan: SimEntry[] = [{ ...sims[0], concept: 'No Such Concept' }];
  const mdx = renderChapter(lesson, chapter, 'networks-book', 'Networks', new Map(), orphan);
  it('routes an unmatched sim into Explore', () => {
    const exploreIdx = mdx.indexOf('## Explore');
    const hostIdx = mdx.indexOf('<SimHost meta={simMeta_0} component={Sim_0} />');
    expect(exploreIdx).toBeGreaterThan(-1);
    expect(hostIdx).toBeGreaterThan(exploreIdx);
  });
});
