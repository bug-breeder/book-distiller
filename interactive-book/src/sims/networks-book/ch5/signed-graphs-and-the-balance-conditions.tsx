import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Signed Triangle Explorer',
  concept: 'Signed graphs and the balance conditions',
  caption:
    'Click any edge to flip it + / −. The triangle is balanced when it has 1 or 3 positive edges.',
  libs: [],
};

// ── Triangle geometry ─────────────────────────────────────────────────────────
// Three nodes arranged in an equilateral triangle.
// Positions in [0,1] fractions of the drawing area.

const NODE_LABELS = ['A', 'B', 'C'] as const;
type NodeLabel = typeof NODE_LABELS[number];

// Relative positions (centred equilateral triangle, pointing up)
const NODE_REL: Record<NodeLabel, { rx: number; ry: number }> = {
  A: { rx: 0.50, ry: 0.12 },  // top
  B: { rx: 0.15, ry: 0.78 },  // bottom-left
  C: { rx: 0.85, ry: 0.78 },  // bottom-right
};

// Edges: each pair as [u, v]
const EDGES: [NodeLabel, NodeLabel][] = [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'C'],
];

type Sign = '+' | '-';
type EdgeKey = 'AB' | 'AC' | 'BC';

const EDGE_KEYS: EdgeKey[] = ['AB', 'AC', 'BC'];

function edgeKey(u: NodeLabel, v: NodeLabel): EdgeKey {
  return `${u}${v}` as EdgeKey;
}

// ── Balance logic ─────────────────────────────────────────────────────────────

function countPositive(signs: Record<EdgeKey, Sign>): number {
  return EDGE_KEYS.filter(k => signs[k] === '+').length;
}

function isBalanced(pos: number): boolean {
  return pos === 1 || pos === 3;
}

// Explain why given the sign configuration
function balanceExplanation(signs: Record<EdgeKey, Sign>): string {
  const ab = signs['AB'];
  const ac = signs['AC'];
  const bc = signs['BC'];
  const pos = countPositive(signs);

  if (pos === 3) {
    return 'All three are friends. "The friend of my friend is my friend." — Balanced.';
  }
  if (pos === 1) {
    // Figure out which is positive — two are enemies, one is friends
    if (ab === '+') return 'A and B are friends; C is an enemy of both. "The enemy of my friend is my enemy." — Balanced.';
    if (ac === '+') return 'A and C are friends; B is an enemy of both. "The enemy of my friend is my enemy." — Balanced.';
    return 'B and C are friends; A is an enemy of both. "The enemy of my friend is my enemy." — Balanced.';
  }
  if (pos === 2) {
    // The one negative edge creates the instability — find the node at the apex of two positives
    if (bc === '-') return 'A is friends with both B and C, but B and C are enemies. A feels pressure to reconcile them or take sides. — Not balanced.';
    if (ac === '-') return 'B is friends with both A and C, but A and C are enemies. B feels pressure to take sides. — Not balanced.';
    return 'C is friends with both A and B, but A and B are enemies. C feels pressure to take sides. — Not balanced.';
  }
  // pos === 0
  return 'All three are enemies. Two of them have an incentive to ally against the third. — Not balanced.';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sim({ width, isDark }: SimProps) {
  const [signs, setSigns] = useState<Record<EdgeKey, Sign>>({
    AB: '+',
    AC: '+',
    BC: '-',
  });

  const flipEdge = useCallback((key: EdgeKey) => {
    setSigns(prev => ({ ...prev, [key]: prev[key] === '+' ? '-' : '+' }));
  }, []);

  const reset = useCallback(() => {
    setSigns({ AB: '+', AC: '+', BC: '-' });
  }, []);

  const randomize = useCallback(() => {
    // Deterministic rotation through the 4 canonical sign cases.
    setSigns(prev => {
      const pos = countPositive(prev);
      // Cycle through: 2pos → 3pos → 1pos → 0pos → 2pos
      if (pos === 2) return { AB: '+', AC: '+', BC: '+' };
      if (pos === 3) return { AB: '+', AC: '-', BC: '-' };
      if (pos === 1) return { AB: '-', AC: '-', BC: '-' };
      return { AB: '+', AC: '+', BC: '-' };
    });
  }, []);

  const pos = countPositive(signs);
  const balanced = isBalanced(pos);
  const explanation = balanceExplanation(signs);

  // Layout
  const height = Math.min(Math.round(width * 0.72), 480);
  const PAD = Math.max(24, width * 0.06);
  const W = width - PAD * 2;
  const H = height - PAD * 2 - 80; // leave room for text below
  const R = Math.max(16, Math.min(26, width * 0.038));
  const fontSize = Math.max(11, Math.min(16, width * 0.026));
  const edgeLabelSize = Math.max(10, Math.min(14, width * 0.022));

  function nodePos(label: NodeLabel) {
    const rel = NODE_REL[label];
    return { x: PAD + rel.rx * W, y: PAD + rel.ry * H };
  }

  // Colors
  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const nodeFill = isDark ? '#4a5568' : '#718096';
  const positiveColor = isDark ? '#68d391' : '#276749'; // green, readable on both themes
  const negativeColor = isDark ? '#fc8181' : '#c53030'; // red
  const edgeHoverFill = isDark ? '#2d3748' : '#edf2f7';
  const balancedBg = isDark ? '#1a4731' : '#c6f6d5';
  const unbalancedBg = isDark ? '#4a1a1a' : '#fed7d7';
  const balancedText = isDark ? '#68d391' : '#276749';
  const unbalancedText = isDark ? '#fc8181' : '#c53030';

  // For each edge, compute the midpoint for the clickable label
  function edgeMid(u: NodeLabel, v: NodeLabel) {
    const pu = nodePos(u);
    const pv = nodePos(v);
    return { x: (pu.x + pv.x) / 2, y: (pu.y + pv.y) / 2 };
  }

  // Offset the edge label slightly outward from the triangle center
  const CENTER = { x: PAD + 0.5 * W, y: PAD + 0.56 * H };
  function labelOffset(u: NodeLabel, v: NodeLabel, amount: number) {
    const mid = edgeMid(u, v);
    const dx = mid.x - CENTER.x;
    const dy = mid.y - CENTER.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: mid.x + (dx / len) * amount, y: mid.y + (dy / len) * amount };
  }

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        background: bg,
        borderRadius: 8,
        padding: 8,
        userSelect: 'none',
        color: textColor,
      }}
    >
      <ControlRow>
        <Button label="Cycle signs" onClick={randomize} />
        <Button label="Reset" onClick={reset} />
      </ControlRow>

      <svg
        width={width}
        height={height - 72}
        style={{ display: 'block', marginTop: 4 }}
        aria-label="Signed triangle"
      >
        {/* Edges */}
        {EDGES.map(([u, v]) => {
          const key = edgeKey(u, v);
          const sign = signs[key];
          const pu = nodePos(u);
          const pv = nodePos(v);
          const color = sign === '+' ? positiveColor : negativeColor;
          const strokeW = sign === '+' ? 3 : 2.5;
          const dashArray = sign === '+' ? undefined : '8 5';
          const loff = labelOffset(u, v, 22);

          return (
            <g
              key={key}
              style={{ cursor: 'pointer' }}
              onClick={() => flipEdge(key)}
              role="button"
              aria-label={`Edge ${u}–${v}: ${sign === '+' ? 'positive' : 'negative'}. Click to flip.`}
            >
              {/* Invisible wide hit area */}
              <line
                x1={pu.x} y1={pu.y}
                x2={pv.x} y2={pv.y}
                stroke="transparent"
                strokeWidth={24}
              />
              {/* Visible edge */}
              <line
                x1={pu.x} y1={pu.y}
                x2={pv.x} y2={pv.y}
                stroke={color}
                strokeWidth={strokeW}
                strokeDasharray={dashArray}
                opacity={0.9}
              />
              {/* Edge sign badge */}
              <circle
                cx={loff.x}
                cy={loff.y}
                r={edgeLabelSize * 0.9}
                fill={edgeHoverFill}
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={loff.x}
                y={loff.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={edgeLabelSize + 2}
                fontWeight="bold"
                fill={color}
                style={{ pointerEvents: 'none' }}
              >
                {sign}
              </text>
              {/* Edge label (A–B, etc.) below badge */}
              <text
                x={loff.x}
                y={loff.y + edgeLabelSize * 0.9 + 10}
                textAnchor="middle"
                fontSize={edgeLabelSize - 2}
                fill={textColor}
                opacity={0.55}
                style={{ pointerEvents: 'none' }}
              >
                {u}–{v}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {NODE_LABELS.map(label => {
          const p = nodePos(label);
          return (
            <g key={label}>
              <circle
                cx={p.x} cy={p.y} r={R}
                fill={nodeFill}
                stroke={isDark ? '#1e1e2e' : '#fff'}
                strokeWidth={2.5}
              />
              <text
                x={p.x}
                y={p.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill="#fff"
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Balance verdict */}
      <div
        style={{
          margin: '4px 0',
          padding: '8px 12px',
          borderRadius: 6,
          background: balanced ? balancedBg : unbalancedBg,
          color: balanced ? balancedText : unbalancedText,
          fontWeight: 'bold',
          fontSize: Math.max(12, edgeLabelSize),
        }}
      >
        {balanced ? '✓ Balanced' : '✗ Not balanced'} — {pos} positive edge{pos !== 1 ? 's' : ''}
      </div>

      {/* Explanation */}
      <div
        style={{
          padding: '4px 4px 2px',
          fontSize: Math.max(11, edgeLabelSize - 1),
          color: textColor,
          opacity: 0.85,
          lineHeight: 1.4,
        }}
      >
        {explanation}
      </div>

      {/* Rule reminder */}
      <div
        style={{
          padding: '4px 4px 0',
          fontSize: 11,
          color: textColor,
          opacity: 0.55,
        }}
      >
        Rule: balanced = 1 or 3 positive edges &nbsp;|&nbsp; click an edge badge to flip its sign
      </div>
    </div>
  );
}
