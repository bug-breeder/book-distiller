import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';
import { useRng } from '@site/src/lib/useRng';

export const meta: SimMeta = {
  title: 'Connected Components',
  concept: 'Connectivity and Components',
  caption: 'Click an edge to remove it; click "Add random edge" to reconnect. Each color is one maximal connected component.',
  libs: [],
};

// ─── Fixed 13-node graph mirroring Figure 2.5 topology ─────────────────────
// Three components: {A,B}, {C,D,E}, {F,G,H,I,J,K,L,M}
// We start fully connected (all edges present) so the learner can observe
// components appear as edges are removed.

interface NodeDef { id: number; label: string; rx: number; ry: number }
const NODES: NodeDef[] = [
  { id: 0,  label: 'A', rx: 0.08, ry: 0.22 },
  { id: 1,  label: 'B', rx: 0.08, ry: 0.50 },
  { id: 2,  label: 'C', rx: 0.30, ry: 0.10 },
  { id: 3,  label: 'D', rx: 0.30, ry: 0.35 },
  { id: 4,  label: 'E', rx: 0.47, ry: 0.22 },
  { id: 5,  label: 'F', rx: 0.62, ry: 0.08 },
  { id: 6,  label: 'G', rx: 0.78, ry: 0.08 },
  { id: 7,  label: 'H', rx: 0.92, ry: 0.22 },
  { id: 8,  label: 'I', rx: 0.92, ry: 0.55 },
  { id: 9,  label: 'J', rx: 0.78, ry: 0.70 },
  { id: 10, label: 'K', rx: 0.62, ry: 0.70 },
  { id: 11, label: 'L', rx: 0.48, ry: 0.55 },
  { id: 12, label: 'M', rx: 0.30, ry: 0.65 },
];

// ALL_EDGES: list of [u,v] pairs representing all possible edges in the connected graph.
// The learner starts with all edges present.
const ALL_EDGES: [number, number][] = [
  // Original component A,B
  [0, 1],
  // Original component C,D,E
  [2, 3], [2, 4], [3, 4],
  // Original component F..M (a rich connected subgraph)
  [5, 6], [5, 11], [6, 7], [7, 8], [8, 9], [9, 10],
  [10, 11], [10, 12], [11, 12], [9, 11],
  // Bridge edges connecting the three original components
  [1, 3],   // connects {A,B} to {C,D,E}
  [4, 5],   // connects {C,D,E} to {F..M}
];

function edgeKey(u: number, v: number): string {
  return `${Math.min(u, v)}-${Math.max(u, v)}`;
}

// Union-Find for component detection
function computeComponents(nodeCount: number, edges: Set<string>): number[] {
  const parent = Array.from({ length: nodeCount }, (_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function union(a: number, b: number) {
    const ra = find(a); const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }
  for (const key of edges) {
    const [u, v] = key.split('-').map(Number);
    union(u, v);
  }
  // Normalize: map each root to a component index
  const rootToComp = new Map<number, number>();
  let next = 0;
  return Array.from({ length: nodeCount }, (_, i) => {
    const r = find(i);
    if (!rootToComp.has(r)) rootToComp.set(r, next++);
    return rootToComp.get(r)!;
  });
}

const COMP_COLORS_LIGHT = ['#e53e3e', '#3182ce', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];
const COMP_COLORS_DARK  = ['#fc8181', '#63b3ed', '#68d391', '#faf089', '#b794f4', '#f6ad55'];

export default function Sim({ width, seed, isDark }: SimProps) {
  const rand = useRng(seed);

  const [activeEdges, setActiveEdges] = useState<Set<string>>(
    () => new Set(ALL_EDGES.map(([u, v]) => edgeKey(u, v)))
  );

  const components = computeComponents(NODES.length, activeEdges);
  const numComponents = new Set(components).size;

  const height = Math.min(Math.round(width * 0.62), 420);
  const PAD = Math.max(16, width * 0.04);
  const W = width - PAD * 2;
  const H = height - PAD * 2;
  const R = Math.max(14, Math.min(22, width * 0.028));
  const fontSize = Math.max(10, Math.min(14, width * 0.018));

  function nodePos(n: NodeDef) {
    return { x: PAD + n.rx * W, y: PAD + n.ry * H };
  }

  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const edgeInactive = isDark ? '#2d3748' : '#e2e8f0';

  function compColor(comp: number): string {
    const palette = isDark ? COMP_COLORS_DARK : COMP_COLORS_LIGHT;
    return palette[comp % palette.length];
  }

  const toggleEdge = useCallback((u: number, v: number) => {
    const key = edgeKey(u, v);
    setActiveEdges(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      }
      return next;
    });
  }, []);

  // Add a random inactive edge
  const addRandomEdge = useCallback(() => {
    // Use rand() from seed for reproducibility
    const missing = ALL_EDGES.filter(([u, v]) => !activeEdges.has(edgeKey(u, v)));
    if (missing.length === 0) return;
    const idx = Math.floor(rand() * missing.length);
    const [u, v] = missing[idx % missing.length];
    setActiveEdges(prev => {
      const next = new Set(prev);
      next.add(edgeKey(u, v));
      return next;
    });
  }, [activeEdges, rand]);

  const resetAll = useCallback(() => {
    setActiveEdges(new Set(ALL_EDGES.map(([u, v]) => edgeKey(u, v))));
  }, []);

  const removeAll = useCallback(() => {
    setActiveEdges(new Set());
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Button label="Reset (all edges)" onClick={resetAll} />
        <Button label="Isolate (no edges)" onClick={removeAll} />
        <Button label="Add random edge" onClick={addRandomEdge} />
        <span style={{ marginLeft: 12, color: textColor, fontSize: 13 }}>
          Components: <strong>{numComponents}</strong>
        </span>
      </ControlRow>

      <svg
        width={width}
        height={height}
        style={{ display: 'block' }}
        aria-label="Connected components graph"
      >
        {/* Edges */}
        {ALL_EDGES.map(([u, v]) => {
          const key = edgeKey(u, v);
          const active = activeEdges.has(key);
          const pu = nodePos(NODES[u]);
          const pv = nodePos(NODES[v]);
          // Color edge based on component of u (both endpoints are same comp if active)
          const color = active ? compColor(components[u]) : edgeInactive;
          return (
            <line
              key={key}
              x1={pu.x} y1={pu.y}
              x2={pv.x} y2={pv.y}
              stroke={color}
              strokeWidth={active ? 2.5 : 1}
              opacity={active ? 0.85 : 0.25}
              style={{ cursor: active ? 'pointer' : 'default' }}
              onClick={() => active && toggleEdge(u, v)}
            >
              <title>{active ? `Click to remove edge ${NODES[u].label}–${NODES[v].label}` : ''}</title>
            </line>
          );
        })}

        {/* Nodes */}
        {NODES.map((n) => {
          const p = nodePos(n);
          const color = compColor(components[n.id]);
          return (
            <g key={n.id}>
              <circle
                cx={p.x} cy={p.y} r={R}
                fill={color}
                stroke={isDark ? '#1e1e2e' : '#fff'}
                strokeWidth={2}
              />
              <text
                x={p.x} y={p.y + 5}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill="#fff"
                style={{ pointerEvents: 'none' }}
              >{n.label}</text>
            </g>
          );
        })}
      </svg>

      {/* Component summary */}
      <div style={{ padding: '6px 8px', fontSize: 12, color: textColor, textAlign: 'center', opacity: 0.8 }}>
        {numComponents === 1
          ? 'Graph is connected — one component. Click edges to remove them and split it.'
          : `${numComponents} components. Same color = reachable from each other. Click an active edge to remove it.`}
      </div>
    </div>
  );
}
