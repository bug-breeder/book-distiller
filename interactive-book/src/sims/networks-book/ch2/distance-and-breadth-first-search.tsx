import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'BFS: Distance Layer by Layer',
  concept: 'Distance and Breadth-First Search',
  caption: 'Click any node to start BFS from it. Watch layers expand outward — the layer number IS the distance.',
  libs: [],
};

// ─── Graph definition ──────────────────────────────────────────────────────
// A fixed 12-node graph with interesting diameter and branching.
// Nodes are laid out in relative coordinates [0,1] so the sim is responsive.

const NODES = [
  { id: 0, label: 'A', rx: 0.50, ry: 0.08 },
  { id: 1, label: 'B', rx: 0.25, ry: 0.25 },
  { id: 2, label: 'C', rx: 0.75, ry: 0.25 },
  { id: 3, label: 'D', rx: 0.12, ry: 0.50 },
  { id: 4, label: 'E', rx: 0.38, ry: 0.50 },
  { id: 5, label: 'F', rx: 0.62, ry: 0.50 },
  { id: 6, label: 'G', rx: 0.88, ry: 0.50 },
  { id: 7, label: 'H', rx: 0.22, ry: 0.73 },
  { id: 8, label: 'I', rx: 0.50, ry: 0.73 },
  { id: 9, label: 'J', rx: 0.78, ry: 0.73 },
  { id: 10, label: 'K', rx: 0.35, ry: 0.92 },
  { id: 11, label: 'L', rx: 0.65, ry: 0.92 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [1, 4],
  [2, 5], [2, 6],
  [3, 7],
  [4, 7], [4, 8],
  [5, 8], [5, 9],
  [6, 9],
  [7, 10],
  [8, 10], [8, 11],
  [9, 11],
];

// Pre-compute adjacency list
const ADJ: number[][] = NODES.map(() => []);
for (const [u, v] of EDGES) {
  ADJ[u].push(v);
  ADJ[v].push(u);
}

function bfs(source: number): Map<number, number> {
  const dist = new Map<number, number>();
  dist.set(source, 0);
  const queue = [source];
  let qi = 0;
  while (qi < queue.length) {
    const u = queue[qi++];
    const d = dist.get(u)!;
    for (const v of ADJ[u]) {
      if (!dist.has(v)) {
        dist.set(v, d + 1);
        queue.push(v);
      }
    }
  }
  return dist;
}

// ─── Layer colours (up to diameter 6, plus source) ─────────────────────────
// Light & dark palettes for layers 0..6
const LAYER_LIGHT = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#d53f8c'];
const LAYER_DARK  = ['#fc8181', '#f6ad55', '#faf089', '#68d391', '#63b3ed', '#b794f4', '#f687b3'];

type Step = { distances: Map<number, number>; maxLayer: number; revealedLayer: number };

export default function Sim({ width, isDark }: SimProps) {
  // Fixed-layout graph — no randomness needed, so `seed` is intentionally unused.
  const [source, setSource] = useState<number | null>(null);
  const [revealedLayer, setRevealedLayer] = useState<number>(-1);
  const [distances, setDistances] = useState<Map<number, number>>(new Map());
  const [maxLayer, setMaxLayer] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const height = Math.min(Math.round(width * 0.72), 480);
  const PAD = Math.max(16, width * 0.04);
  const W = width - PAD * 2;
  const H = height - PAD * 2;
  const R = Math.max(14, Math.min(22, width * 0.028));
  const fontSize = Math.max(10, Math.min(14, width * 0.018));

  function nodePos(n: typeof NODES[number]) {
    return { x: PAD + n.rx * W, y: PAD + n.ry * H };
  }

  // Cancel pending animation on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const startBfs = useCallback((nodeId: number) => {
    if (animating) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const dist = bfs(nodeId);
    const ml = Math.max(...Array.from(dist.values()));
    setSource(nodeId);
    setDistances(dist);
    setMaxLayer(ml);
    setRevealedLayer(0);
    setAnimating(true);

    let layer = 0;
    const step = () => {
      layer += 1;
      setRevealedLayer(layer);
      if (layer < ml) {
        timerRef.current = setTimeout(step, 520);
      } else {
        setAnimating(false);
      }
    };
    timerRef.current = setTimeout(step, 520);
  }, [animating]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSource(null);
    setRevealedLayer(-1);
    setDistances(new Map());
    setMaxLayer(0);
    setAnimating(false);
  }, []);

  // Colour for a node given current BFS state
  function nodeColor(id: number): string {
    if (source === null) return isDark ? '#4a5568' : '#a0aec0';
    const d = distances.get(id);
    if (d === undefined) return isDark ? '#4a5568' : '#a0aec0';
    if (d > revealedLayer) return isDark ? '#4a5568' : '#a0aec0';
    const palette = isDark ? LAYER_DARK : LAYER_LIGHT;
    return palette[Math.min(d, palette.length - 1)];
  }

  function edgeHighlighted(u: number, v: number): boolean {
    if (source === null) return false;
    const du = distances.get(u);
    const dv = distances.get(v);
    if (du === undefined || dv === undefined) return false;
    const lo = Math.min(du, dv);
    const hi = Math.max(du, dv);
    return hi === lo + 1 && hi <= revealedLayer;
  }

  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const edgeBase = isDark ? '#4a5568' : '#cbd5e0';
  const edgeActive = isDark ? '#a0aec0' : '#718096';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Button label="Reset" onClick={reset} />
        <span style={{ marginLeft: 12, color: textColor, fontSize: 13 }}>
          {source === null
            ? 'Click a node to start BFS'
            : animating
              ? `Revealing layer ${revealedLayer} of ${maxLayer}…`
              : `Source: ${NODES[source].label} — diameter from here: ${maxLayer}`}
        </span>
      </ControlRow>

      <svg
        width={width}
        height={height}
        style={{ display: 'block', cursor: 'default' }}
        aria-label="BFS graph visualization"
      >
        {/* Edges */}
        {EDGES.map(([u, v]) => {
          const pu = nodePos(NODES[u]);
          const pv = nodePos(NODES[v]);
          const hi = edgeHighlighted(u, v);
          return (
            <line
              key={`${u}-${v}`}
              x1={pu.x} y1={pu.y}
              x2={pv.x} y2={pv.y}
              stroke={hi ? edgeActive : edgeBase}
              strokeWidth={hi ? 2.5 : 1.5}
              opacity={hi ? 1 : 0.55}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((n) => {
          const p = nodePos(n);
          const fill = nodeColor(n.id);
          const d = distances.get(n.id);
          const revealed = d !== undefined && d <= revealedLayer;
          const isSource = n.id === source;
          return (
            <g
              key={n.id}
              onClick={() => startBfs(n.id)}
              style={{ cursor: animating ? 'default' : 'pointer' }}
            >
              <circle
                cx={p.x} cy={p.y} r={R}
                fill={fill}
                stroke={isSource ? (isDark ? '#fff' : '#1a202c') : (isDark ? '#718096' : '#e2e8f0')}
                strokeWidth={isSource ? 3 : 1.5}
                opacity={source !== null && !revealed ? 0.35 : 1}
              />
              <text
                x={p.x} y={p.y - R - 4}
                textAnchor="middle"
                fontSize={fontSize}
                fill={textColor}
                opacity={0.85}
                style={{ pointerEvents: 'none' }}
              >{n.label}</text>
              {revealed && d !== undefined && (
                <text
                  x={p.x} y={p.y + 5}
                  textAnchor="middle"
                  fontSize={Math.round(fontSize * 1.1)}
                  fontWeight="bold"
                  fill="#fff"
                  style={{ pointerEvents: 'none' }}
                >{d}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Layer legend */}
      {source !== null && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '6px 8px', justifyContent: 'center',
        }}>
          {Array.from({ length: maxLayer + 1 }, (_, layer) => {
            const palette = isDark ? LAYER_DARK : LAYER_LIGHT;
            const color = palette[Math.min(layer, palette.length - 1)];
            const dimmed = layer > revealedLayer;
            const count = Array.from(distances.values()).filter(d => d === layer).length;
            return (
              <div key={layer} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: textColor,
                opacity: dimmed ? 0.3 : 1,
                transition: 'opacity 0.3s',
              }}>
                <span style={{
                  display: 'inline-block',
                  width: 12, height: 12, borderRadius: '50%',
                  background: color,
                }} />
                <span>Layer {layer}{layer === 0 ? ' (source)' : ''}: {count} node{count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
