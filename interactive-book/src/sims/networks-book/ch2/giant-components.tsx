import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button, Slider } from '@site/src/widgets/VizControls';
import { useRng } from '@site/src/lib/useRng';

export const meta: SimMeta = {
  title: 'Giant Component Emergence',
  concept: 'Giant Components',
  caption: 'Add edges one by one and watch one component grow to dominate. The largest is the "giant component."',
  libs: [],
};

// ─── Parameters ────────────────────────────────────────────────────────────
const N_NODES = 24;

// Union-Find
function makeUF(n: number) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size   = new Array<number>(n).fill(1);
  function find(x: number): number {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function union(a: number, b: number): boolean {
    const ra = find(a); const rb = find(b);
    if (ra === rb) return false;
    if (size[ra] < size[rb]) { parent[ra] = rb; size[rb] += size[ra]; }
    else { parent[rb] = ra; size[ra] += size[rb]; }
    return true;
  }
  function componentOf(x: number): number { return find(x); }
  function sizes(): Map<number, number> {
    const m = new Map<number, number>();
    for (let i = 0; i < n; i++) {
      const r = find(i);
      m.set(r, (m.get(r) ?? 0) + 1);
    }
    return m;
  }
  return { find, union, componentOf, sizes };
}

function buildNodePositions(n: number, rand: () => number, w: number, h: number, pad: number): Array<{x: number; y: number}> {
  // Place nodes on a loose grid with slight jitter
  const cols = Math.ceil(Math.sqrt(n * (w / h)));
  const rows = Math.ceil(n / cols);
  const cellW = (w - 2 * pad) / cols;
  const cellH = (h - 2 * pad) / rows;
  const positions: Array<{x: number; y: number}> = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + (col + 0.5) * cellW + (rand() - 0.5) * cellW * 0.5;
    const y = pad + (row + 0.5) * cellH + (rand() - 0.5) * cellH * 0.5;
    positions.push({ x, y });
  }
  return positions;
}

// Pre-generate a shuffled edge list (all pairs) using a seeded RNG snapshot
function buildEdgeOrder(n: number, rand: () => number): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      edges.push([u, v]);
    }
  }
  // Fisher-Yates shuffle
  for (let i = edges.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [edges[i], edges[j]] = [edges[j], edges[i]];
  }
  return edges;
}

const COMP_COLORS_LIGHT = [
  '#e53e3e', '#3182ce', '#38a169', '#d69e2e',
  '#805ad5', '#dd6b20', '#319795', '#d53f8c',
  '#718096',
];
const COMP_COLORS_DARK = [
  '#fc8181', '#63b3ed', '#68d391', '#faf089',
  '#b794f4', '#f6ad55', '#81e6d9', '#f687b3',
  '#a0aec0',
];

export default function Sim({ width, seed, isDark }: SimProps) {
  const rand = useRng(seed);

  // Derive static layout and edge ordering from seed (memoized via refs)
  const posRef = useRef<Array<{x: number; y: number}> | null>(null);
  const edgesRef = useRef<Array<[number, number]> | null>(null);

  const height = Math.min(Math.round(width * 0.70), 460);
  const PAD = Math.max(20, width * 0.05);

  // Build positions and edges once per seed. Since useRng is seeded, calling
  // rand() always produces the same sequence for the same seed.
  // We use refs so we don't re-derive on every render.
  if (posRef.current === null) {
    // snapshot the rand calls in order
    posRef.current = buildNodePositions(N_NODES, rand, width, height, PAD);
    edgesRef.current = buildEdgeOrder(N_NODES, rand);
  }

  const positions = posRef.current;
  const edgeOrder = edgesRef.current!;
  const maxEdges = edgeOrder.length;

  const [edgeCount, setEdgeCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Recompute components for current edge set
  const uf = makeUF(N_NODES);
  for (let i = 0; i < edgeCount; i++) {
    const [u, v] = edgeOrder[i];
    uf.union(u, v);
  }
  const compSizes = uf.sizes();
  const componentOf = uf.componentOf;

  // Assign colors to components sorted by size (largest = color 0)
  const sortedRoots = Array.from(compSizes.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([root]) => root);
  const rootToColorIdx = new Map<number, number>();
  sortedRoots.forEach((root, idx) => rootToColorIdx.set(root, idx));

  const giantSize = sortedRoots.length > 0 ? (compSizes.get(sortedRoots[0]) ?? 0) : 0;
  const giantFraction = Math.round((giantSize / N_NODES) * 100);

  function nodeColor(id: number): string {
    const root = componentOf(id);
    const idx = rootToColorIdx.get(root) ?? 0;
    const palette = isDark ? COMP_COLORS_DARK : COMP_COLORS_LIGHT;
    return palette[Math.min(idx, palette.length - 1)];
  }

  const addEdge = useCallback(() => {
    setEdgeCount(prev => Math.min(prev + 1, maxEdges));
  }, [maxEdges]);

  const addMany = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    let added = 0;
    const step = () => {
      setEdgeCount(prev => {
        const next = Math.min(prev + 1, maxEdges);
        added++;
        if (next < maxEdges && added < 30) {
          timerRef.current = setTimeout(step, 60);
        } else {
          setAnimating(false);
        }
        return next;
      });
    };
    timerRef.current = setTimeout(step, 60);
  }, [animating, maxEdges]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEdgeCount(0);
    setAnimating(false);
  }, []);

  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const edgeColor = isDark ? '#4a5568' : '#cbd5e0';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const R = Math.max(10, Math.min(16, width * 0.022));
  const fontSize = Math.max(9, Math.min(12, width * 0.016));

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Button label="Add edge" onClick={addEdge} />
        <Button label="Add ×30" onClick={addMany} />
        <Button label="Reset" onClick={reset} />
        <span style={{ marginLeft: 12, color: textColor, fontSize: 13 }}>
          {edgeCount} edge{edgeCount !== 1 ? 's' : ''} — giant: <strong
            style={{ color: isDark ? COMP_COLORS_DARK[0] : COMP_COLORS_LIGHT[0] }}
          >{giantFraction}%</strong> of nodes
        </span>
      </ControlRow>
      <ControlRow>
        <Slider
          label="Edges"
          min={0}
          max={maxEdges}
          value={edgeCount}
          onChange={v => { if (!animating) setEdgeCount(v); }}
        />
      </ControlRow>

      <svg
        width={width}
        height={height}
        style={{ display: 'block' }}
        aria-label="Giant component emergence"
      >
        {/* Draw active edges */}
        {edgeOrder.slice(0, edgeCount).map(([u, v], i) => {
          const pu = positions[u];
          const pv = positions[v];
          // Color based on whether u and v are in the giant component
          const giantRoot = sortedRoots[0];
          const inGiant = giantRoot !== undefined
            && componentOf(u) === giantRoot
            && componentOf(v) === giantRoot;
          return (
            <line
              key={i}
              x1={pu.x} y1={pu.y}
              x2={pv.x} y2={pv.y}
              stroke={inGiant
                ? (isDark ? COMP_COLORS_DARK[0] : COMP_COLORS_LIGHT[0])
                : edgeColor}
              strokeWidth={inGiant ? 2 : 1.2}
              opacity={inGiant ? 0.7 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {positions.map((p, id) => (
          <g key={id}>
            <circle
              cx={p.x} cy={p.y} r={R}
              fill={nodeColor(id)}
              stroke={isDark ? '#1e1e2e' : '#fff'}
              strokeWidth={1.5}
            />
            <text
              x={p.x} y={p.y + 4}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#fff"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >{id + 1}</text>
          </g>
        ))}
      </svg>

      <div style={{ padding: '4px 8px', fontSize: 12, color: textColor, textAlign: 'center', opacity: 0.8 }}>
        {edgeCount === 0
          ? `${N_NODES} isolated nodes — ${N_NODES} components. Add edges to watch them merge.`
          : sortedRoots.length === 1
            ? 'Fully connected — one giant component contains all nodes.'
            : `${sortedRoots.length} components. Red = giant (${giantSize} nodes, ${giantFraction}%). Add one more edge to a satellite to absorb it.`}
      </div>
    </div>
  );
}
