import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: "Braess's Paradox",
  concept: 'Game theory and strategic interdependence',
  caption: 'Toggle the shortcut road and watch how individually rational routing makes everyone worse off.',
  libs: [],
};

// ────────────────────────────────────────────────────────────────
// Braess's Paradox network (classic 4-node version)
//
//        S ──── A ──── T        (route SAT: cost = 45 + 1·n)
//              ╲/               (new shortcut A→B, cost ≈ 0)
//        S ──── B ──── T        (route SBT: cost = 1·n + 45)
//
// Without shortcut: traffic splits 50/50 → each driver: 45+50 = 95 mins
// With    shortcut: equilibrium all go S→A→B→T  → each: 1·100 + 0 + 1·100 = 200 mins (classic)
//
// We scale to 100 drivers for clean numbers and use the textbook payoffs.
// ────────────────────────────────────────────────────────────────

const TOTAL = 100;

interface Routes {
  sat: number;   // drivers on S→A→T
  sbt: number;   // drivers on S→B→T
  sabt: number;  // drivers on S→A→B→T (only when shortcut exists)
}

/** Travel time for a link with variable cost = n/TOTAL * congestionFactor + fixedCost */
function travelTime(n: number, fixed: number, variable: number): number {
  // fixed = constant minutes; variable factor multiplied by n
  return fixed + variable * (n / TOTAL) * 100;
}

function computeEquilibrium(shortcut: boolean): { routes: Routes; avgTime: number } {
  if (!shortcut) {
    // Nash equilibrium: 50 on SAT, 50 on SBT
    // SAT cost: 45 (S→A fixed) + 50 (A→T variable n=50)  = 95
    // SBT cost: 50 (S→B variable n=50) + 45 (B→T fixed)  = 95
    return {
      routes: { sat: 50, sbt: 50, sabt: 0 },
      avgTime: 95,
    };
  } else {
    // With the free A→B shortcut, everyone defects to SABT
    // SABT cost: n (S→A) + 0 (A→B) + n (B→T) = n+n = 200 when n=100
    return {
      routes: { sat: 0, sbt: 0, sabt: 100 },
      avgTime: 200,
    };
  }
}

// Layout constants (relative, scaled at render time)
const LAYOUT = {
  S: { rx: 0.08, ry: 0.5 },
  A: { rx: 0.4,  ry: 0.2 },
  B: { rx: 0.4,  ry: 0.8 },
  T: { rx: 0.92, ry: 0.5 },
};

type NodeKey = keyof typeof LAYOUT;

function pos(key: NodeKey, w: number, h: number) {
  return { x: LAYOUT[key].rx * w, y: LAYOUT[key].ry * h };
}

export default function Sim({ width, isDark }: SimProps) {
  const [shortcut, setShortcut] = useState(false);
  const eq = computeEquilibrium(shortcut);

  const h = Math.min(Math.round(width * 0.55), 320);

  const bg        = isDark ? '#1e1e2e' : '#f8f9fb';
  const nodeFill  = isDark ? '#4f86c6' : '#2b6cb0';
  const nodeStroke = isDark ? '#93b4d8' : '#1a4e8a';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const edgeColor = isDark ? '#4a5568' : '#718096';
  const shortcutColor = shortcut ? (isDark ? '#f6ad55' : '#dd6b20') : (isDark ? '#4a5568' : '#cbd5e0');
  const activeEdge = isDark ? '#68d391' : '#276749';
  const labelBg   = isDark ? '#2d3748' : '#fff';

  const S = pos('S', width, h);
  const A = pos('A', width, h);
  const B = pos('B', width, h);
  const T = pos('T', width, h);

  const r = Math.max(18, Math.min(26, width * 0.03));

  // Edge thickness proportional to drivers
  function edgeWidth(n: number) {
    return Math.max(1.5, (n / TOTAL) * 10);
  }

  // Label for a road
  function roadLabel(n: number, fixedSrc: number, varSrc: number, fixedDst: number, varDst: number, nSrc: number, nDst: number) {
    void fixedDst; void varDst; void nDst;
    const cost = travelTime(nSrc, fixedSrc, varSrc);
    return `${n} drivers · ${Math.round(cost)} min`;
  }
  void roadLabel;

  // Midpoint helper
  function mid(p1: {x:number;y:number}, p2: {x:number;y:number}) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  // Time labels for each segment
  const nSA  = eq.routes.sat + eq.routes.sabt;
  const nSB  = eq.routes.sbt;
  const nAT  = eq.routes.sat;
  const nBT  = eq.routes.sbt + eq.routes.sabt;
  const nAB  = eq.routes.sabt;

  const tSA  = Math.round(travelTime(nSA, 0, 1));   // variable: n min
  const tAT  = Math.round(travelTime(nAT, 45, 0));  // fixed: 45 min
  const tSB  = Math.round(travelTime(nSB, 45, 0));  // fixed: 45 min
  const tBT  = Math.round(travelTime(nBT, 0, 1));   // variable: n min
  const tAB  = 0;                                    // free shortcut

  const midSA = mid(S, A);
  const midAT = mid(A, T);
  const midSB = mid(S, B);
  const midBT = mid(B, T);
  const midAB = mid(A, B);

  const toggle = useCallback(() => setShortcut(s => !s), []);

  // Color an edge active if it carries traffic
  function ec(n: number) { return n > 0 ? activeEdge : edgeColor; }

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Button label={shortcut ? 'Remove shortcut road' : 'Add shortcut road'} onClick={toggle} />
        <span style={{ marginLeft: 16, color: textColor, fontSize: 13 }}>
          {shortcut ? '⚠ Shortcut added — avg travel time: ' : 'No shortcut — avg travel time: '}
          <strong style={{ color: shortcut ? (isDark ? '#f6ad55' : '#c05621') : (isDark ? '#68d391' : '#276749') }}>
            {eq.avgTime} min
          </strong>
        </span>
      </ControlRow>

      <svg width={width} height={h} style={{ display: 'block' }}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={edgeColor} />
          </marker>
          <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={activeEdge} />
          </marker>
          <marker id="arrow-shortcut" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={shortcutColor} />
          </marker>
        </defs>

        {/* Edge S→A */}
        <line
          x1={S.x + r} y1={S.y} x2={A.x - r} y2={A.y}
          stroke={ec(nSA)} strokeWidth={edgeWidth(nSA)}
          markerEnd={nSA > 0 ? 'url(#arrow-active)' : 'url(#arrow)'}
        />
        {/* Edge A→T */}
        <line
          x1={A.x + r} y1={A.y} x2={T.x - r} y2={T.y}
          stroke={ec(nAT)} strokeWidth={edgeWidth(nAT)}
          markerEnd={nAT > 0 ? 'url(#arrow-active)' : 'url(#arrow)'}
        />
        {/* Edge S→B */}
        <line
          x1={S.x + r} y1={S.y} x2={B.x - r} y2={B.y}
          stroke={ec(nSB)} strokeWidth={edgeWidth(nSB)}
          markerEnd={nSB > 0 ? 'url(#arrow-active)' : 'url(#arrow)'}
        />
        {/* Edge B→T */}
        <line
          x1={B.x + r} y1={B.y} x2={T.x - r} y2={T.y}
          stroke={ec(nBT)} strokeWidth={edgeWidth(nBT)}
          markerEnd={nBT > 0 ? 'url(#arrow-active)' : 'url(#arrow)'}
        />
        {/* Shortcut A→B (dashed when absent, solid when present) */}
        <line
          x1={A.x} y1={A.y + r} x2={B.x} y2={B.y - r}
          stroke={shortcutColor}
          strokeWidth={shortcut ? edgeWidth(nAB) + 1 : 1.5}
          strokeDasharray={shortcut ? 'none' : '6 4'}
          markerEnd={shortcut ? 'url(#arrow-shortcut)' : undefined}
        />

        {/* Travel time labels */}
        {[
          { p: midSA, label: `S→A: ${tSA} min`, dx: 0, dy: -14 },
          { p: midAT, label: `A→T: ${tAT} min`, dx: 0, dy: -14 },
          { p: midSB, label: `S→B: ${tSB} min`, dx: 0, dy: 16 },
          { p: midBT, label: `B→T: ${tBT} min`, dx: 0, dy: 16 },
        ].map(({ p, label, dx, dy }) => (
          <g key={label}>
            <rect
              x={p.x + dx - 40} y={p.y + dy - 12}
              width={82} height={16}
              rx={3} fill={labelBg} opacity={0.85}
            />
            <text
              x={p.x + dx + 1} y={p.y + dy}
              textAnchor="middle" fontSize={11}
              fill={textColor} fontFamily="monospace"
            >{label}</text>
          </g>
        ))}
        {/* Shortcut label */}
        <g>
          <rect
            x={midAB.x - 38} y={midAB.y - 12}
            width={78} height={16} rx={3}
            fill={labelBg} opacity={0.85}
          />
          <text
            x={midAB.x + 1} y={midAB.y}
            textAnchor="middle" fontSize={11}
            fill={shortcut ? shortcutColor : (isDark ? '#718096' : '#a0aec0')}
            fontFamily="monospace"
          >{shortcut ? `A→B: ${tAB} min` : 'A→B: (proposed)'}</text>
        </g>

        {/* Nodes */}
        {([['S', S], ['A', A], ['B', B], ['T', T]] as [string, {x:number;y:number}][]).map(([label, p]) => (
          <g key={label}>
            <circle cx={p.x} cy={p.y} r={r} fill={nodeFill} stroke={nodeStroke} strokeWidth={2} />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#fff">{label}</text>
          </g>
        ))}

        {/* Driver flow annotation */}
        <text x={width / 2} y={h - 10} textAnchor="middle" fontSize={12} fill={textColor} opacity={0.7}>
          {shortcut
            ? `All 100 drivers take S→A→B→T (the shortcut is free, so everyone defects)`
            : `50 drivers on each route — Nash equilibrium without the shortcut`}
        </text>
      </svg>

      {/* Summary table */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        padding: '8px 4px', flexWrap: 'wrap',
      }}>
        {[
          { route: 'S→A→T', n: eq.routes.sat, time: eq.routes.sat > 0 ? tSA + tAT : '—' },
          { route: 'S→B→T', n: eq.routes.sbt, time: eq.routes.sbt > 0 ? tSB + tBT : '—' },
          ...(shortcut ? [{ route: 'S→A→B→T', n: eq.routes.sabt, time: eq.routes.sabt > 0 ? tSA + tAB + tBT : '—' }] : []),
        ].map(({ route, n, time }) => (
          <div key={route} style={{
            background: isDark ? '#2d3748' : '#edf2f7',
            borderRadius: 6, padding: '6px 12px',
            fontSize: 12, color: textColor, textAlign: 'center',
            minWidth: 130,
            border: n > 0 ? `1.5px solid ${activeEdge}` : '1.5px solid transparent',
          }}>
            <div style={{ fontWeight: 600 }}>{route}</div>
            <div>{n} drivers · {time} min</div>
          </div>
        ))}
      </div>
    </div>
  );
}
