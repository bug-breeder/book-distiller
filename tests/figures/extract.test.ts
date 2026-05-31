// tests/figures/extract.test.ts
import { describe, it, expect } from 'vitest';
import { parseFigures } from '../../src/figures/extract.js';

const FF = '\f';

// Three PDF pages (37, 38, 39). Page 37 only *references* Figure 2.1; the
// caption lives on page 38. Page 38 also has a sentence-initial reference to
// Figure 2.2 (no colon); the real Figure 2.2 caption is on page 39.
const sample =
  ['Chapter 2', 'Graphs', 'the graph in Figure 2.1(a) consists of 4 nodes'].join('\n') +
  FF +
  [
    '24                              CHAPTER 2. GRAPHS',
    '    Figure 2.1: Two graphs: (a) an undirected graph, and (b) a directed graph.',
    'Figure 2.2 depicts the network structure of the Internet.',
  ].join('\n') +
  FF +
  ['Figure 2.2: A network depicting the Arpanet in December 1970.'].join('\n');

describe('parseFigures', () => {
  it('locates captions by exact PDF page, ignoring in-text references', () => {
    expect(parseFigures(sample, 37)).toEqual([
      { label: 'Figure 2.1', page: 38, caption: 'Two graphs: (a) an undirected graph, and (b) a directed graph.' },
      { label: 'Figure 2.2', page: 39, caption: 'A network depicting the Arpanet in December 1970.' },
    ]);
  });

  it('keeps the first caption when a label appears more than once', () => {
    const dup = 'Table 1.1: First.' + FF + 'Table 1.1: Later mention.';
    expect(parseFigures(dup, 10)).toEqual([{ label: 'Table 1.1', page: 10, caption: 'First.' }]);
  });

  it('returns [] when there are no captions', () => {
    expect(parseFigures('just text\fmore text', 5)).toEqual([]);
  });
});
