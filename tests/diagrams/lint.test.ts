import { describe, it, expect } from 'vitest';
import { parseMermaidGraph } from '../../src/diagrams/parse.js';
import { lintNodesAgainstText } from '../../src/diagrams/lint.js';
import { extractMermaidBlocks } from '../../src/diagrams/extract.js';

describe('lintNodesAgainstText', () => {
  it('ignores single-letter ids (unverifiable) and passes', () => {
    const g = parseMermaidGraph('graph LR\n A --- B\n B --- C');
    expect(lintNodesAgainstText(g, 'completely unrelated text')).toEqual({ ok: true, unknown: [] });
  });

  it('flags a named node label absent from the chapter text', () => {
    const g = parseMermaidGraph('graph LR\n MIT --- BBN\n MIT --- UTAH');
    const text = 'the network connected MIT and BBN at distance one';
    expect(lintNodesAgainstText(g, text)).toEqual({ ok: false, unknown: ['UTAH'] });
  });

  it('passes when all named labels appear in the text (case-insensitive)', () => {
    const g = parseMermaidGraph('graph LR\n Reciprocity --- Liking');
    expect(lintNodesAgainstText(g, 'the rule of RECIPROCITY and the principle of liking')).toEqual({
      ok: true,
      unknown: [],
    });
  });
});

describe('extractMermaidBlocks', () => {
  it('extracts the inner content of each fenced mermaid block', () => {
    const md = 'intro\n\n```mermaid\ngraph LR\n A --- B\n```\n\nmid\n\n```mermaid\ngraph TD\n X --> Y\n```\n';
    expect(extractMermaidBlocks(md)).toEqual(['graph LR\n A --- B', 'graph TD\n X --> Y']);
  });

  it('returns [] when there are no mermaid blocks', () => {
    expect(extractMermaidBlocks('# title\n```js\ncode\n```')).toEqual([]);
  });
});
