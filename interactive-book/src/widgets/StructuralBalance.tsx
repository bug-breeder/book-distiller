import React, {useMemo, useState} from 'react';
import VizFrame from './VizFrame';

// Four people on a square; every pair has a relationship (a complete graph K4).
const POS = [
  {id: 'A', x: 120, y: 70},
  {id: 'B', x: 360, y: 70},
  {id: 'C', x: 360, y: 290},
  {id: 'D', x: 120, y: 290},
];
const EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
];
// The four triangles of K4, each as indices into EDGES.
const TRIANGLES: Array<[number, number, number]> = [
  [0, 3, 1], // A-B, B-C, A-C
  [0, 4, 2], // A-B, B-D, A-D
  [1, 5, 2], // A-C, C-D, A-D
  [3, 5, 4], // B-C, C-D, B-D
];

/**
 * Structural balance on a complete graph. Click any edge to flip it between
 * friendship (+, green) and antagonism (−, red). A triangle is balanced when it
 * has an odd number of + edges (all friends, or "the enemy of my enemy is my
 * friend"); the whole network is balanced only when every triangle is.
 */
export default function StructuralBalance(): React.ReactElement {
  const [signs, setSigns] = useState<number[]>([1, 1, 1, 1, 1, 1]);

  const {balanced, badEdges} = useMemo(() => {
    const bad = new Set<number>();
    let allBalanced = true;
    for (const tri of TRIANGLES) {
      const pos = tri.reduce((acc, e) => acc + (signs[e] > 0 ? 1 : 0), 0);
      const triBalanced = pos % 2 === 1; // 1 or 3 positive edges
      if (!triBalanced) {
        allBalanced = false;
        tri.forEach((e) => bad.add(e));
      }
    }
    return {balanced: allBalanced, badEdges: bad};
  }, [signs]);

  function toggle(e: number): void {
    setSigns((s) => s.map((v, i) => (i === e ? -v : v)));
  }

  return (
    <VizFrame
      title="Structural Balance Explorer"
      caption="Click an edge to flip friendship (+) ↔ antagonism (−). Unbalanced triangles glow red."
      note={
        balanced
          ? '✓ Balanced: every triangle has an odd number of friendships — no nagging social tension.'
          : '✗ Not balanced: at least one triangle has exactly two friendships (or none), which the theory says is unstable.'
      }>
      <div className="viz__canvas-wrap">
        <svg viewBox="0 0 480 360" role="img" aria-label="Signed complete graph on four people" className="balance-svg">
          {EDGES.map(([a, b], e) => {
            const positive = signs[e] > 0;
            const isBad = badEdges.has(e);
            const mx = (POS[a].x + POS[b].x) / 2;
            const my = (POS[a].y + POS[b].y) / 2;
            return (
              <g key={e} className="balance-edge" onClick={() => toggle(e)} style={{cursor: 'pointer'}}>
                <line
                  x1={POS[a].x}
                  y1={POS[a].y}
                  x2={POS[b].x}
                  y2={POS[b].y}
                  stroke={positive ? '#3fb950' : '#f85149'}
                  strokeWidth={isBad ? 6 : 4}
                  strokeOpacity={isBad ? 1 : 0.85}
                  strokeDasharray={positive ? undefined : '8 5'}
                />
                <circle cx={mx} cy={my} r={13} fill="var(--viz-bg)" stroke={positive ? '#3fb950' : '#f85149'} strokeWidth={2} />
                <text x={mx} y={my} dy="0.35em" textAnchor="middle" fontSize={16} fontWeight={700} fill={positive ? '#3fb950' : '#f85149'}>
                  {positive ? '+' : '−'}
                </text>
              </g>
            );
          })}
          {POS.map((p) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={22} fill="#4f8cff" stroke="var(--viz-node-stroke)" strokeWidth={2.5} />
              <text x={p.x} y={p.y} dy="0.34em" textAnchor="middle" fontSize={18} fontWeight={700} fill="#fff">
                {p.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </VizFrame>
  );
}
