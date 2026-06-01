import { describe, it, expect } from 'vitest';
import { parseMermaidGraph } from '../../src/diagrams/parse.js';
import { renderAdjacency } from '../../src/diagrams/render.js';

describe('renderAdjacency', () => {
  it('renders undirected edges with node labels', () => {
    const g = parseMermaidGraph('graph LR\n B --- A\n B --- C');
    expect(renderAdjacency(g)).toBe('Nodes: B, A, C\nEdges:\n  B — A\n  B — C');
  });

  it('renders directed edges and edge labels using labels', () => {
    const g = parseMermaidGraph('graph TD\n A[Start] --> B{Decision}\n B -->|Yes| C[Go]');
    expect(renderAdjacency(g)).toBe(
      'Nodes: Start, Decision, Go\nEdges:\n  Start → Decision\n  Decision → Go [Yes]',
    );
  });

  it('renders only the node line when there are no edges', () => {
    expect(renderAdjacency(parseMermaidGraph('graph TD\n A[Solo]'))).toBe('Nodes: Solo');
  });
});
