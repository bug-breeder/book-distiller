import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Balance Theorem: Two Camps',
  concept: 'The Balance Theorem',
  caption:
    'A balanced complete graph MUST split into two friend-cliques at war with each other. Move nodes between camps and watch every triangle stay balanced.',
  libs: [],
};

// ── Data model ─────────────────────────────────────────────────────────────────
// Six nodes that can be dragged between two camps (X and Y).
// An edge is + if both nodes are in the same camp, − if they are in different camps.
// Every triangle is automatically balanced by construction — the sim lets the user
// experience *why* the two-camp structure is forced.

const ALL_NODES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
type NodeId = typeof ALL_NODES[number];

// Initial assignment: {A,B,C} in X, {D,E,F} in Y
const INITIAL: Record<NodeId, 'X' | 'Y'> = {
  A: 'X', B: 'X', C: 'X',
  D: 'Y', E: 'Y', F: 'Y',
};

// Sign of an edge given the camp assignment
function edgeSign(u: NodeId, v: NodeId, camps: Record<NodeId, 'X' | 'Y'>): '+' | '-' {
  return camps[u] === camps[v] ? '+' : '-';
}

// Count + edges in the triangle u-v-w
function trianglePositives(u: NodeId, v: NodeId, w: NodeId, camps: Record<NodeId, 'X' | 'Y'>): number {
  return [edgeSign(u, v, camps), edgeSign(u, w, camps), edgeSign(v, w, camps)]
    .filter(s => s === '+').length;
}

function triangleBalanced(u: NodeId, v: NodeId, w: NodeId, camps: Record<NodeId, 'X' | 'Y'>): boolean {
  const pos = trianglePositives(u, v, w, camps);
  return pos === 1 || pos === 3;
}

// All C(6,3) = 20 triangles
function allTriangles(): [NodeId, NodeId, NodeId][] {
  const tris: [NodeId, NodeId, NodeId][] = [];
  for (let i = 0; i < ALL_NODES.length; i++) {
    for (let j = i + 1; j < ALL_NODES.length; j++) {
      for (let k = j + 1; k < ALL_NODES.length; k++) {
        tris.push([ALL_NODES[i], ALL_NODES[j], ALL_NODES[k]]);
      }
    }
  }
  return tris;
}

const TRIANGLES = allTriangles();

// ── Layout ─────────────────────────────────────────────────────────────────────
// Two columns: camp X on left, camp Y on right.
// Within each camp, nodes are stacked vertically in a small cluster.

function campLayout(
  nodes: NodeId[],
  centerX: number,
  topY: number,
  spacing: number,
): Record<NodeId, { x: number; y: number }> {
  const result: Partial<Record<NodeId, { x: number; y: number }>> = {};
  nodes.forEach((n, i) => {
    // Slight zig-zag for visual clarity
    const offset = (i % 2 === 0 ? -0.18 : 0.18) * spacing;
    result[n] = { x: centerX + offset, y: topY + i * spacing };
  });
  return result as Record<NodeId, { x: number; y: number }>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sim({ width, isDark }: SimProps) {
  const [camps, setCamps] = useState<Record<NodeId, 'X' | 'Y'>>({ ...INITIAL });

  const toggleCamp = useCallback((node: NodeId) => {
    setCamps(prev => ({ ...prev, [node]: prev[node] === 'X' ? 'Y' : 'X' }));
  }, []);

  const reset = useCallback(() => setCamps({ ...INITIAL }), []);

  // Derived: split nodes into camps
  const xNodes = ALL_NODES.filter(n => camps[n] === 'X');
  const yNodes = ALL_NODES.filter(n => camps[n] === 'Y');

  // Triangle balance stats
  const unbalanced = TRIANGLES.filter(([u, v, w]) => !triangleBalanced(u, v, w, camps));
  const allBalanced = unbalanced.length === 0;

  // Layout
  const height = Math.min(Math.round(width * 0.80), 540);
  const PAD = Math.max(20, width * 0.05);
  const W = width - PAD * 2;
  const H = height - PAD * 2 - 64; // footer
  const R = Math.max(14, Math.min(22, width * 0.032));
  const fontSize = Math.max(10, Math.min(15, width * 0.024));
  const nodeSpacing = Math.max(36, Math.min(52, H / 6.5));

  const xCenterX = PAD + W * 0.22;
  const yCenterX = PAD + W * 0.78;
  const topY = PAD + H * 0.10;

  // Build positions for ALL nodes
  const xPositions = campLayout(xNodes, xCenterX, topY, nodeSpacing);
  const yPositions = campLayout(yNodes, yCenterX, topY, nodeSpacing);

  function nodePos(n: NodeId): { x: number; y: number } {
    return xPositions[n] ?? yPositions[n] ?? { x: 0, y: 0 };
  }

  // Colors
  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const xCampFill = isDark ? '#3b82f6' : '#2563eb';    // blue for X
  const yCampFill = isDark ? '#f97316' : '#ea580c';    // orange for Y
  const positiveColor = isDark ? '#68d391' : '#276749'; // green
  const negativeColor = isDark ? '#fc8181' : '#c53030'; // red
  const campBgX = isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.07)';
  const campBgY = isDark ? 'rgba(249,115,22,0.08)' : 'rgba(234,88,12,0.07)';
  const balancedBg = isDark ? '#1a4731' : '#c6f6d5';
  const unbalancedBg = isDark ? '#4a1a1a' : '#fed7d7';
  const balancedText = isDark ? '#68d391' : '#276749';
  const unbalancedText = isDark ? '#fc8181' : '#c53030';

  // All edges (complete graph on 6 nodes = 15 edges)
  const allEdges: [NodeId, NodeId][] = [];
  for (let i = 0; i < ALL_NODES.length; i++) {
    for (let j = i + 1; j < ALL_NODES.length; j++) {
      allEdges.push([ALL_NODES[i], ALL_NODES[j]]);
    }
  }

  // Camp bounding box helpers
  function campBBox(nodes: NodeId[]) {
    if (nodes.length === 0) return null;
    const positions = nodes.map(n => nodePos(n));
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const pad = R + 14;
    return {
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    };
  }

  const bboxX = campBBox(xNodes);
  const bboxY = campBBox(yNodes);

  const svgHeight = H + PAD;

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
        <Button label="Reset" onClick={reset} />
      </ControlRow>

      <svg
        width={width}
        height={svgHeight}
        style={{ display: 'block', marginTop: 4 }}
        aria-label="Balance theorem: two-camp signed complete graph"
      >
        {/* Camp background areas */}
        {bboxX && (
          <rect
            x={bboxX.x} y={bboxX.y} width={bboxX.w} height={bboxX.h}
            rx={12} fill={campBgX} stroke={xCampFill}
            strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7}
          />
        )}
        {bboxY && (
          <rect
            x={bboxY.x} y={bboxY.y} width={bboxY.w} height={bboxY.h}
            rx={12} fill={campBgY} stroke={yCampFill}
            strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7}
          />
        )}

        {/* Camp labels */}
        {bboxX && (
          <text
            x={bboxX.x + bboxX.w / 2}
            y={bboxX.y - 6}
            textAnchor="middle"
            fontSize={fontSize - 1}
            fill={xCampFill}
            fontWeight="bold"
            opacity={0.85}
          >
            Camp X ({xNodes.length})
          </text>
        )}
        {bboxY && (
          <text
            x={bboxY.x + bboxY.w / 2}
            y={bboxY.y - 6}
            textAnchor="middle"
            fontSize={fontSize - 1}
            fill={yCampFill}
            fontWeight="bold"
            opacity={0.85}
          >
            Camp Y ({yNodes.length})
          </text>
        )}

        {/* Edges (drawn below nodes) */}
        {allEdges.map(([u, v]) => {
          const pu = nodePos(u);
          const pv = nodePos(v);
          const sign = edgeSign(u, v, camps);
          const color = sign === '+' ? positiveColor : negativeColor;
          const strokeW = sign === '+' ? 2 : 1.5;
          const dash = sign === '-' ? '7 5' : undefined;
          const opacity = sign === '+' ? 0.75 : 0.55;
          return (
            <line
              key={`${u}-${v}`}
              x1={pu.x} y1={pu.y}
              x2={pv.x} y2={pv.y}
              stroke={color}
              strokeWidth={strokeW}
              strokeDasharray={dash}
              opacity={opacity}
            />
          );
        })}

        {/* Nodes — click to move between camps */}
        {ALL_NODES.map(n => {
          const p = nodePos(n);
          const fill = camps[n] === 'X' ? xCampFill : yCampFill;
          return (
            <g
              key={n}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleCamp(n)}
              role="button"
              aria-label={`Node ${n} in camp ${camps[n]}. Click to move to camp ${camps[n] === 'X' ? 'Y' : 'X'}.`}
            >
              <circle
                cx={p.x} cy={p.y} r={R}
                fill={fill}
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
                {n}
              </text>
            </g>
          );
        })}

        {/* Legend: + / − line samples */}
        <g>
          <line x1={PAD} y1={svgHeight - 18} x2={PAD + 22} y2={svgHeight - 18}
            stroke={positiveColor} strokeWidth={2.5} />
          <text x={PAD + 26} y={svgHeight - 14} fontSize={10} fill={textColor} opacity={0.7}>
            + friend (same camp)
          </text>
          <line x1={PAD + 140} y1={svgHeight - 18} x2={PAD + 162} y2={svgHeight - 18}
            stroke={negativeColor} strokeWidth={2} strokeDasharray="6 4" />
          <text x={PAD + 166} y={svgHeight - 14} fontSize={10} fill={textColor} opacity={0.7}>
            − enemy (cross-camp)
          </text>
        </g>
      </svg>

      {/* Balance verdict */}
      <div
        style={{
          margin: '4px 0 2px',
          padding: '7px 12px',
          borderRadius: 6,
          background: allBalanced ? balancedBg : unbalancedBg,
          color: allBalanced ? balancedText : unbalancedText,
          fontWeight: 'bold',
          fontSize: Math.max(11, fontSize - 1),
        }}
      >
        {allBalanced
          ? `✓ All 20 triangles balanced — two-camp structure holds!`
          : `✗ ${unbalanced.length} unbalanced triangle${unbalanced.length > 1 ? 's' : ''} — not a valid balanced split`}
      </div>

      {/* Instruction */}
      <div
        style={{
          padding: '2px 4px 0',
          fontSize: 11,
          color: textColor,
          opacity: 0.65,
          lineHeight: 1.4,
        }}
      >
        Click a node to move it between Camp X and Camp Y.
        {' '}The Balance Theorem says the ONLY way to keep all triangles balanced is exactly this two-camp layout.
        {' '}Try putting all 6 nodes in one camp — all triangles stay balanced (everyone is mutual friends).
      </div>
    </div>
  );
}
