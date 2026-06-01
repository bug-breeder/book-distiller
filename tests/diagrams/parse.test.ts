import { describe, it, expect } from 'vitest';
import { parseMermaidGraph } from '../../src/diagrams/parse.js';

describe('parseMermaidGraph', () => {
  it('parses undirected edges and registers nodes in order', () => {
    const g = parseMermaidGraph('graph LR\n  B --- A\n  B --- C\n  B --- D');
    expect(g.nodes.map((n) => n.id)).toEqual(['B', 'A', 'C', 'D']);
    expect(g.edges).toEqual([
      { from: 'B', to: 'A', directed: false },
      { from: 'B', to: 'C', directed: false },
      { from: 'B', to: 'D', directed: false },
    ]);
  });

  it('parses directed edges, node labels, and edge labels', () => {
    const g = parseMermaidGraph('graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Go]');
    expect(g.nodes).toEqual([
      { id: 'A', label: 'Start' },
      { id: 'B', label: 'Decision' },
      { id: 'C', label: 'Go' },
    ]);
    expect(g.edges).toEqual([
      { from: 'A', to: 'B', directed: true },
      { from: 'B', to: 'C', directed: true, label: 'Yes' },
    ]);
  });

  it('ignores headers, comments, and unparseable prose lines', () => {
    const g = parseMermaidGraph('graph TD\n  %% a comment\n  A --> B\n  random prose here');
    expect(g.edges).toEqual([{ from: 'A', to: 'B', directed: true }]);
    expect(g.nodes.map((n) => n.id)).toEqual(['A', 'B']);
  });
});
