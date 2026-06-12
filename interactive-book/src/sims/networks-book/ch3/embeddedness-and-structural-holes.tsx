import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Structural Holes & Brokerage',
  concept: 'Embeddedness and Structural Holes',
  caption: 'Compare two nodes: A is deeply embedded in one dense cluster; B spans structural holes between three separate groups.',
  libs: [],
};

// ── Network layout ─────────────────────────────────────────────────────────────
// Node A: center of one tightly-knit group (high embeddedness, no structural holes)
// Node B: broker spanning three separate groups (low embeddedness, spans holes)
//
// Groups:
//  Group 0 (A + a1,a2,a3): dense quadrilateral, A at center
//  Group 1 (p, q):         small pair, B connects to p
//  Group 2 (r, s):         small pair, B connects to r
//  Group 3 (t, u):         small pair, B connects to t
//  B (id 4): positioned centrally, bridging all three satellite groups

interface NodeDef {
  id: number;
  label: string;
  rx: number;
  ry: number;
  group: number; // 0=A's cluster, 1/2/3=satellite groups, 99=broker
}

const NODES: NodeDef[] = [
  // A's dense cluster (group 0) — left half
  { id: 0,  label: 'A',  rx: 0.18, ry: 0.50, group: 0  },
  { id: 1,  label: 'a₁', rx: 0.10, ry: 0.33, group: 0  },
  { id: 2,  label: 'a₂', rx: 0.10, ry: 0.67, group: 0  },
  { id: 3,  label: 'a₃', rx: 0.26, ry: 0.33, group: 0  },
  { id: 4,  label: 'a₄', rx: 0.26, ry: 0.67, group: 0  },
  // Broker B (group 99) — center-right
  { id: 5,  label: 'B',  rx: 0.62, ry: 0.50, group: 99 },
  // Group 1 (satellite top) — B connects to p
  { id: 6,  label: 'p',  rx: 0.78, ry: 0.22, group: 1  },
  { id: 7,  label: 'q',  rx: 0.92, ry: 0.22, group: 1  },
  // Group 2 (satellite middle-right) — B connects to r
  { id: 8,  label: 'r',  rx: 0.80, ry: 0.50, group: 2  },
  { id: 9,  label: 's',  rx: 0.94, ry: 0.50, group: 2  },
  // Group 3 (satellite bottom) — B connects to t
  { id: 10, label: 't',  rx: 0.78, ry: 0.78, group: 3  },
  { id: 11, label: 'u',  rx: 0.92, ry: 0.78, group: 3  },
];

interface EdgeDef {
  id: string;
  u: number;
  v: number;
  kind: 'internal' | 'bridge';
  owner: 'A' | 'B' | 'both'; // which focal node this edge belongs to
}

const ALL_EDGES: EdgeDef[] = [
  // A's cluster internal edges (fully connected pentagon minus A-a3-a4 triangle)
  { id: 'A-a1',   u: 0, v: 1,  kind: 'internal', owner: 'A' },
  { id: 'A-a2',   u: 0, v: 2,  kind: 'internal', owner: 'A' },
  { id: 'A-a3',   u: 0, v: 3,  kind: 'internal', owner: 'A' },
  { id: 'A-a4',   u: 0, v: 4,  kind: 'internal', owner: 'A' },
  { id: 'a1-a2',  u: 1, v: 2,  kind: 'internal', owner: 'A' },
  { id: 'a1-a3',  u: 1, v: 3,  kind: 'internal', owner: 'A' },
  { id: 'a2-a4',  u: 2, v: 4,  kind: 'internal', owner: 'A' },
  { id: 'a3-a4',  u: 3, v: 4,  kind: 'internal', owner: 'A' },
  // B's bridges to satellite groups
  { id: 'B-p',    u: 5, v: 6,  kind: 'bridge',   owner: 'B' },
  { id: 'B-r',    u: 5, v: 8,  kind: 'bridge',   owner: 'B' },
  { id: 'B-t',    u: 5, v: 10, kind: 'bridge',   owner: 'B' },
  // Satellite group internal edges
  { id: 'p-q',    u: 6, v: 7,  kind: 'internal', owner: 'B' },
  { id: 'r-s',    u: 8, v: 9,  kind: 'internal', owner: 'B' },
  { id: 't-u',    u: 10, v: 11, kind: 'internal', owner: 'B' },
];

function commonNeighbors(adj: Map<number, Set<number>>, u: number, v: number): number {
  const nu = adj.get(u) ?? new Set<number>();
  const nv = adj.get(v) ?? new Set<number>();
  let count = 0;
  for (const x of nu) {
    if (x !== v && nv.has(x)) count++;
  }
  return count;
}

function embeddedness(adj: Map<number, Set<number>>, u: number, v: number): number {
  return commonNeighbors(adj, u, v);
}

function buildAdj(): Map<number, Set<number>> {
  const adj = new Map<number, Set<number>>();
  for (const n of NODES) adj.set(n.id, new Set());
  for (const e of ALL_EDGES) {
    adj.get(e.u)!.add(e.v);
    adj.get(e.v)!.add(e.u);
  }
  return adj;
}

// Structural holes: count pairs of B's neighbors that are NOT connected to each other
function structuralHoles(adj: Map<number, Set<number>>, node: number): number {
  const neighbors = [...(adj.get(node) ?? [])];
  let holes = 0;
  for (let i = 0; i < neighbors.length; i++) {
    for (let j = i + 1; j < neighbors.length; j++) {
      if (!adj.get(neighbors[i])!.has(neighbors[j])) holes++;
    }
  }
  return holes;
}

// Average embeddedness of a node's edges
function avgEmbeddedness(adj: Map<number, Set<number>>, node: number): number {
  const neighbors = [...(adj.get(node) ?? [])];
  if (neighbors.length === 0) return 0;
  const total = neighbors.reduce((sum, v) => sum + embeddedness(adj, node, v), 0);
  return total / neighbors.length;
}

type FocusNode = 'A' | 'B' | null;

export default function Sim({ width, isDark }: SimProps) {
  const [focus, setFocus] = useState<FocusNode>(null);

  const height = Math.min(Math.round(width * 0.58), 400);
  const PAD = Math.max(20, width * 0.05);
  const W = width - PAD * 2;
  const H = height - PAD * 2;
  const R = Math.max(12, Math.min(18, width * 0.024));
  const fontSize = Math.max(9, Math.min(13, width * 0.018));

  const adj = buildAdj();

  function nodePos(n: NodeDef) {
    return { x: PAD + n.rx * W, y: PAD + n.ry * H };
  }

  const selectA = useCallback(() => setFocus(f => f === 'A' ? null : 'A'), []);
  const selectB = useCallback(() => setFocus(f => f === 'B' ? null : 'B'), []);
  const clearFocus = useCallback(() => setFocus(null), []);

  // Stats
  const aNeighbors = [...(adj.get(0) ?? [])];
  const bNeighbors = [...(adj.get(5) ?? [])];
  const aAvgEmbed = avgEmbeddedness(adj, 0);
  const bAvgEmbed = avgEmbeddedness(adj, 5);
  const aHoles = structuralHoles(adj, 0);
  const bHoles = structuralHoles(adj, 5);

  // Colours
  const bg          = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor    = isDark ? '#e2e8f0' : '#1a202c';
  const clrA         = isDark ? '#63b3ed' : '#3182ce';   // blue for A's cluster
  const clrB         = isDark ? '#f6ad55' : '#d69e2e';   // gold for B
  const satColors    = [
    isDark ? '#68d391' : '#38a169',
    isDark ? '#fc8181' : '#e53e3e',
    isDark ? '#b794f4' : '#805ad5',
  ];
  const bridgeC      = '#d69e2e';
  const internalC    = isDark ? '#4a5568' : '#cbd5e0';
  const dimmedC      = isDark ? '#2d3748' : '#edf2f7';

  // Determine which edges to highlight based on focus
  function edgeOpacity(e: EdgeDef): number {
    if (focus === null) return 1;
    if (focus === 'A') return e.owner === 'A' ? 1 : 0.12;
    if (focus === 'B') return e.owner === 'B' ? 1 : 0.12;
    return 1;
  }

  function nodeOpacity(n: NodeDef): number {
    if (focus === null) return 1;
    if (focus === 'A') {
      if (n.group === 0) return 1;
      if (n.id === 5) return 0.25; // B
      return 0.15;
    }
    if (focus === 'B') {
      if (n.group === 99 || n.group === 1 || n.group === 2 || n.group === 3) return 1;
      if (n.id === 0) return 0.25; // A
      return 0.15;
    }
    return 1;
  }

  function nodeColor(n: NodeDef): string {
    if (n.id === 0) return clrA;
    if (n.id === 5) return clrB;
    if (n.group === 0) return clrA;
    if (n.group === 1) return satColors[0];
    if (n.group === 2) return satColors[1];
    if (n.group === 3) return satColors[2];
    return isDark ? '#718096' : '#a0aec0';
  }

  function edgeColor(e: EdgeDef): string {
    if (e.kind === 'bridge') return bridgeC;
    return internalC;
  }

  const statusLines = focus === 'A'
    ? [
        `Node A: degree ${aNeighbors.length}, avg embeddedness ${aAvgEmbed.toFixed(1)}`,
        `Structural holes spanned: ${aHoles} — A's friends know each other well (closure).`,
      ]
    : focus === 'B'
    ? [
        `Node B: degree ${bNeighbors.length}, avg embeddedness ${bAvgEmbed.toFixed(1)}`,
        `Structural holes spanned: ${bHoles} — B's groups don't know each other (brokerage).`,
      ]
    : [
        'Click "Show A" or "Show B" to highlight each node\'s structural position.',
        'A: dense cluster (closure, trust). B: spans three separate groups (structural holes, brokerage power).',
      ];

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Button label="Show A" onClick={selectA} />
        <Button label="Show B" onClick={selectB} />
        <Button label="Show both" onClick={clearFocus} />
      </ControlRow>

      <svg width={width} height={height} style={{ display: 'block' }} aria-label="Embeddedness and structural holes">
        {/* Edges */}
        {ALL_EDGES.map(e => {
          const pu = nodePos(NODES[e.u]);
          const pv = nodePos(NODES[e.v]);
          const opacity = edgeOpacity(e);
          const stroke = edgeColor(e);
          const sw = e.kind === 'bridge' ? 3 : 1.8;
          return (
            <line
              key={e.id}
              x1={pu.x} y1={pu.y}
              x2={pv.x} y2={pv.y}
              stroke={opacity < 0.5 ? (isDark ? '#2d3748' : '#e2e8f0') : stroke}
              strokeWidth={sw}
              opacity={opacity}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const p = nodePos(n);
          const fill = nodeColor(n);
          const opacity = nodeOpacity(n);
          const isFocal = (n.id === 0 && focus === 'A') || (n.id === 5 && focus === 'B');
          return (
            <g key={n.id} style={{ opacity }}>
              <circle
                cx={p.x} cy={p.y} r={isFocal ? R * 1.25 : R}
                fill={fill}
                stroke={isFocal ? (isDark ? '#fff' : '#1a202c') : (isDark ? '#1e1e2e' : '#fff')}
                strokeWidth={isFocal ? 3 : 1.5}
              />
              <text
                x={p.x} y={p.y + 5}
                textAnchor="middle"
                fontSize={isFocal ? fontSize * 1.1 : fontSize}
                fontWeight={isFocal ? 'bold' : 'normal'}
                fill="#fff"
                style={{ pointerEvents: 'none' }}
              >{n.label}</text>
            </g>
          );
        })}

        {/* Structural hole annotation: dashed arcs between B's satellite groups */}
        {focus === 'B' && (
          <>
            {/* Hole between group1 and group2 */}
            <path
              d={`M ${PAD + NODES[6].rx * W} ${PAD + NODES[6].ry * H} Q ${PAD + 0.87 * W} ${PAD + 0.36 * H} ${PAD + NODES[8].rx * W} ${PAD + NODES[8].ry * H}`}
              fill="none"
              stroke={isDark ? '#4a5568' : '#a0aec0'}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.55}
            />
            {/* Hole between group2 and group3 */}
            <path
              d={`M ${PAD + NODES[8].rx * W} ${PAD + NODES[8].ry * H} Q ${PAD + 0.87 * W} ${PAD + 0.64 * H} ${PAD + NODES[10].rx * W} ${PAD + NODES[10].ry * H}`}
              fill="none"
              stroke={isDark ? '#4a5568' : '#a0aec0'}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.55}
            />
            {/* Hole between group1 and group3 */}
            <path
              d={`M ${PAD + NODES[7].rx * W} ${PAD + NODES[7].ry * H} Q ${PAD + 0.99 * W} ${PAD + 0.50 * H} ${PAD + NODES[11].rx * W} ${PAD + NODES[11].ry * H}`}
              fill="none"
              stroke={isDark ? '#4a5568' : '#a0aec0'}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.55}
            />
          </>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '4px 8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <LegendItem color={clrA} label="A's cluster (closure)" textColor={textColor} />
        <LegendItem color={clrB} label="B (broker)" textColor={textColor} />
        <LegendItem color={bridgeC} label="Structural hole bridge" textColor={textColor} />
      </div>

      <div style={{ padding: '2px 8px', fontSize: 12, color: textColor, opacity: 0.85 }}>
        {statusLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label, textColor }: { color: string; label: string; textColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: textColor }}>
      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: color }} />
      {label}
    </div>
  );
}
