import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Triadic Closure',
  concept: 'Triadic Closure',
  caption: 'A and C are both friends with B. Click "Close triangle" to see triadic closure form the A–C edge.',
  libs: [],
};

// ── Fixed network: two open triangles waiting to close ──────────────────────
// Nodes and relative positions in [0,1] space.
// Group 1: B, A, C — open triad (A & C share mutual friend B)
// Group 2: E, D, F — open triad (D & F share mutual friend E)
// Isolated node G — no mutual friends, no closure pressure.
interface NodeDef {
  id: number;
  label: string;
  rx: number;
  ry: number;
  group: number; // 1 or 2 or 0
}

const NODES: NodeDef[] = [
  // Group 1 — open triad centered ~left
  { id: 0, label: 'A', rx: 0.18, ry: 0.32, group: 1 },
  { id: 1, label: 'B', rx: 0.32, ry: 0.15, group: 1 },
  { id: 2, label: 'C', rx: 0.46, ry: 0.32, group: 1 },
  // Group 2 — open triad centered ~right
  { id: 3, label: 'D', rx: 0.54, ry: 0.68, group: 2 },
  { id: 4, label: 'E', rx: 0.68, ry: 0.52, group: 2 },
  { id: 5, label: 'F', rx: 0.82, ry: 0.68, group: 2 },
  // Isolated node
  { id: 6, label: 'G', rx: 0.18, ry: 0.75, group: 0 },
];

// Existing (strong) edges
const STRONG_EDGES: [number, number][] = [
  [0, 1], // A–B
  [1, 2], // B–C
  [3, 4], // D–E
  [4, 5], // E–F
];

// Potential closure edges (dashed until closed)
const CLOSURE_EDGES: { u: number; v: number; id: string }[] = [
  { u: 0, v: 2, id: 'AC' }, // A–C (share mutual friend B)
  { u: 3, v: 5, id: 'DF' }, // D–F (share mutual friend E)
];

type ClosureState = 'open' | 'forming' | 'closed';

export default function Sim({ width, isDark }: SimProps) {
  const [closureState, setClosureState] = useState<Record<string, ClosureState>>({
    AC: 'open',
    DF: 'open',
  });
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const height = Math.min(Math.round(width * 0.62), 420);
  const PAD = Math.max(20, width * 0.05);
  const W = width - PAD * 2;
  const H = height - PAD * 2;
  const R = Math.max(14, Math.min(20, width * 0.028));
  const fontSize = Math.max(10, Math.min(14, width * 0.020));

  function nodePos(n: NodeDef) {
    return { x: PAD + n.rx * W, y: PAD + n.ry * H };
  }

  const allClosed = CLOSURE_EDGES.every(e => closureState[e.id] === 'closed');

  const closeNext = useCallback(() => {
    if (animating) return;
    const next = CLOSURE_EDGES.find(e => closureState[e.id] === 'open');
    if (!next) return;
    setAnimating(true);
    setClosureState(prev => ({ ...prev, [next.id]: 'forming' }));
    timerRef.current = setTimeout(() => {
      setClosureState(prev => ({ ...prev, [next.id]: 'closed' }));
      setAnimating(false);
    }, 700);
  }, [animating, closureState]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setClosureState({ AC: 'open', DF: 'open' });
    setAnimating(false);
  }, []);

  // Colours
  const bg       = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const strongC   = isDark ? '#63b3ed' : '#3182ce';
  const weakC     = isDark ? '#718096' : '#a0aec0';
  const newC      = '#d69e2e';           // gold — forming/closed closure edge
  const newPulse  = '#f6e05e';           // lighter gold for animation pulse
  const groupColors: Record<number, string> = {
    0: isDark ? '#4a5568' : '#a0aec0',
    1: isDark ? '#63b3ed' : '#3182ce',
    2: isDark ? '#68d391' : '#38a169',
  };

  // Labels for closure state
  const openCount = CLOSURE_EDGES.filter(e => closureState[e.id] === 'open').length;
  const closedCount = CLOSURE_EDGES.filter(e => closureState[e.id] === 'closed').length;
  let statusText = '';
  if (closedCount === 0) {
    statusText = 'Two open triads: A & C share mutual friend B; D & F share mutual friend E.';
  } else if (closedCount === 1) {
    statusText = `One triangle closed. ${openCount} open triad remains — click again to close it.`;
  } else {
    statusText = 'Both triangles closed. Triadic closure formed two new friendships.';
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Button label={allClosed ? 'All closed' : 'Close triangle'} onClick={closeNext} />
        <Button label="Reset" onClick={reset} />
      </ControlRow>

      <svg width={width} height={height} style={{ display: 'block' }} aria-label="Triadic closure">
        {/* Defs for dashed / animated edges */}
        <defs>
          <marker id="tc-arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={newC} />
          </marker>
        </defs>

        {/* Strong existing edges */}
        {STRONG_EDGES.map(([u, v]) => {
          const pu = nodePos(NODES[u]);
          const pv = nodePos(NODES[v]);
          return (
            <line
              key={`s-${u}-${v}`}
              x1={pu.x} y1={pu.y}
              x2={pv.x} y2={pv.y}
              stroke={strongC}
              strokeWidth={2.5}
              opacity={0.8}
            />
          );
        })}

        {/* Closure edges */}
        {CLOSURE_EDGES.map(e => {
          const pu = nodePos(NODES[e.u]);
          const pv = nodePos(NODES[e.v]);
          const state = closureState[e.id];
          if (state === 'open') {
            return (
              <line
                key={e.id}
                x1={pu.x} y1={pu.y}
                x2={pv.x} y2={pv.y}
                stroke={isDark ? '#718096' : '#cbd5e0'}
                strokeWidth={1.8}
                strokeDasharray="6 5"
                opacity={0.55}
              />
            );
          }
          if (state === 'forming') {
            return (
              <line
                key={e.id}
                x1={pu.x} y1={pu.y}
                x2={pv.x} y2={pv.y}
                stroke={newPulse}
                strokeWidth={3.5}
                strokeDasharray="6 4"
                opacity={0.9}
              />
            );
          }
          // closed
          return (
            <line
              key={e.id}
              x1={pu.x} y1={pu.y}
              x2={pv.x} y2={pv.y}
              stroke={newC}
              strokeWidth={3}
              opacity={1}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const p = nodePos(n);
          const fill = groupColors[n.group];
          return (
            <g key={n.id}>
              <circle
                cx={p.x} cy={p.y} r={R}
                fill={fill}
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

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '4px 8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <LegendItem color={strongC} dash={false} label="Existing strong tie" textColor={textColor} />
        <LegendItem color={isDark ? '#718096' : '#cbd5e0'} dash={true} label="Open triad (likely to close)" textColor={textColor} />
        <LegendItem color={newC} dash={false} label="New tie (triadic closure)" textColor={textColor} />
      </div>

      <div style={{ padding: '4px 8px', fontSize: 12, color: textColor, opacity: 0.85 }}>
        {statusText}
      </div>
    </div>
  );
}

function LegendItem({ color, dash, label, textColor }: { color: string; dash: boolean; label: string; textColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: textColor }}>
      <svg width={28} height={8} style={{ flexShrink: 0 }}>
        <line
          x1={2} y1={4} x2={26} y2={4}
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={dash ? '5 4' : undefined}
        />
      </svg>
      {label}
    </div>
  );
}
