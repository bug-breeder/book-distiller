// src/diagrams/render.ts
import type { Graph } from './parse.js';

/**
 * A deterministic, terminal-friendly view of a parsed graph: a node line plus
 * one edge per line (`—` undirected, `→` directed, `[label]` if present).
 * Node display uses the label; ids are only an internal handle.
 */
export function renderAdjacency(g: Graph): string {
  const labelOf = (id: string): string => g.nodes.find((n) => n.id === id)?.label ?? id;
  const nodeLine = `Nodes: ${g.nodes.map((n) => n.label).join(', ')}`;
  if (g.edges.length === 0) return nodeLine;
  const edgeLines = g.edges.map((e) => {
    const sym = e.directed ? '→' : '—';
    const lbl = e.label ? ` [${e.label}]` : '';
    return `  ${labelOf(e.from)} ${sym} ${labelOf(e.to)}${lbl}`;
  });
  return [nodeLine, 'Edges:', ...edgeLines].join('\n');
}
