import React, { useState, useCallback, useMemo } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Slider, Button } from '@site/src/widgets/VizControls';
import { useRng } from '@site/src/lib/useRng';

export const meta: SimMeta = {
  title: 'Structural Cascade',
  concept: 'Network dynamics: structural cascades',
  caption: 'Step through adoption one round at a time — adjust the threshold and see how cluster density can block the cascade.',
  libs: [],
};

// ────────────────────────────────────────────────────────────────
// Network topology (fixed, seeded layout positions are jittered)
//
// Two groups:
//   "Seed cluster" (nodes 0-3): seeded adopters who trigger the cascade
//   "Sparse bridge" (nodes 4-5): weak-tie bridges
//   "Dense cluster" (nodes 6-9): tightly-linked group that may resist
//
// Edges:
//   Within seed cluster: 0-1, 0-2, 1-2, 1-3, 2-3
//   Bridge: 3-4, 4-5
//   Within dense: 6-7, 6-8, 6-9, 7-8, 7-9, 8-9
//   Entry: 5-6
// ────────────────────────────────────────────────────────────────

interface NodeDef {
  id: number;
  group: 'seed' | 'bridge' | 'dense';
  baseX: number;  // fraction of width
  baseY: number;  // fraction of height
}

const NODES: NodeDef[] = [
  // seed cluster
  { id: 0, group: 'seed', baseX: 0.08, baseY: 0.50 },
  { id: 1, group: 'seed', baseX: 0.17, baseY: 0.30 },
  { id: 2, group: 'seed', baseX: 0.17, baseY: 0.70 },
  { id: 3, group: 'seed', baseX: 0.28, baseY: 0.50 },
  // bridge
  { id: 4, group: 'bridge', baseX: 0.44, baseY: 0.50 },
  { id: 5, group: 'bridge', baseX: 0.58, baseY: 0.50 },
  // dense cluster
  { id: 6, group: 'dense', baseX: 0.74, baseY: 0.28 },
  { id: 7, group: 'dense', baseX: 0.88, baseY: 0.38 },
  { id: 8, group: 'dense', baseX: 0.88, baseY: 0.62 },
  { id: 9, group: 'dense', baseX: 0.74, baseY: 0.72 },
];

const EDGES: [number, number][] = [
  [0,1],[0,2],[1,2],[1,3],[2,3],   // seed cluster
  [3,4],[4,5],                     // bridge
  [6,7],[6,8],[6,9],[7,8],[7,9],[8,9], // dense cluster
  [5,6],                           // entry edge
];

function neighbors(id: number): number[] {
  return EDGES
    .filter(([a, b]) => a === id || b === id)
    .map(([a, b]) => (a === id ? b : a));
}

function computeDegree(id: number): number {
  return neighbors(id).length;
}

// One round of spreading: a non-adopted node adopts if
//   (adopted_neighbors / total_neighbors) >= threshold/100
function stepCascade(adopted: Set<number>, threshold: number): Set<number> {
  const next = new Set(adopted);
  for (const { id } of NODES) {
    if (adopted.has(id)) continue;
    const nbrs = neighbors(id);
    const adoptedCount = nbrs.filter(n => adopted.has(n)).length;
    if (nbrs.length > 0 && adoptedCount / nbrs.length >= threshold / 100) {
      next.add(id);
    }
  }
  return next;
}

const SEED_IDS = new Set([0, 1, 2, 3]);

export default function Sim({ width, seed, isDark }: SimProps) {
  const rand = useRng(seed);

  // Small jitter so layout doesn't look too rigid
  const nodePositions = useMemo(() => {
    return NODES.map(n => ({
      id: n.id,
      jx: (rand() - 0.5) * 0.025,
      jy: (rand() - 0.5) * 0.025,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const [threshold, setThreshold] = useState(34);
  const [adopted, setAdopted] = useState<Set<number>>(new Set(SEED_IDS));
  const [round, setRound] = useState(0);
  const [settled, setSettled] = useState(false);

  const h = Math.min(Math.round(width * 0.58), 340);
  const r = Math.max(14, Math.min(20, width * 0.024));

  const bg        = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const edgeColor = isDark ? '#4a5568' : '#cbd5e0';

  function nodeColor(id: number) {
    if (adopted.has(id)) {
      return isDark ? '#68d391' : '#38a169'; // green = adopted
    }
    if (SEED_IDS.has(id)) {
      // should never reach here after init but guard anyway
      return isDark ? '#68d391' : '#38a169';
    }
    return isDark ? '#4a5568' : '#a0aec0';  // grey = not yet
  }

  function nodeStroke(id: number) {
    if (NODES.find(n => n.id === id)?.group === 'dense') {
      return isDark ? '#f6ad55' : '#dd6b20';
    }
    return isDark ? '#2d3748' : '#e2e8f0';
  }

  const px = (n: NodeDef) => {
    const j = nodePositions.find(p => p.id === n.id)!;
    return (n.baseX + j.jx) * width;
  };
  const py = (n: NodeDef) => {
    const j = nodePositions.find(p => p.id === n.id)!;
    return (n.baseY + j.jy) * h;
  };

  const handleStep = useCallback(() => {
    const next = stepCascade(adopted, threshold);
    setAdopted(next);
    setRound(r2 => r2 + 1);
    if (next.size === adopted.size) setSettled(true);
  }, [adopted, threshold]);

  const handleReset = useCallback(() => {
    setAdopted(new Set(SEED_IDS));
    setRound(0);
    setSettled(false);
  }, []);

  const handleThreshold = useCallback((v: number) => {
    setThreshold(v);
    // reset when threshold changes
    setAdopted(new Set(SEED_IDS));
    setRound(0);
    setSettled(false);
  }, []);

  // Is the dense cluster reachable?
  const denseAdopted = [6,7,8,9].filter(id => adopted.has(id)).length;

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Slider
          label="Adoption threshold"
          min={10} max={60} step={1}
          value={threshold}
          onChange={handleThreshold}
        />
        <span style={{ marginLeft: 4, fontSize: 12, color: textColor, opacity: 0.7 }}>
          % of neighbours needed
        </span>
      </ControlRow>
      <ControlRow>
        <Button label="Step →" onClick={handleStep} />
        <Button label="Reset" onClick={handleReset} />
        <span style={{ marginLeft: 12, fontSize: 13, color: textColor }}>
          Round: <strong>{round}</strong> &nbsp;·&nbsp; Adopted: <strong>{adopted.size}</strong>/10
          {settled && (
            <span style={{ marginLeft: 8, color: denseAdopted === 4
              ? (isDark ? '#68d391' : '#276749')
              : (isDark ? '#f6ad55' : '#c05621') }}>
              {denseAdopted === 4
                ? ' — cascade reached the dense cluster!'
                : ' — cascade stalled (dense cluster blocked it)'}
            </span>
          )}
        </span>
      </ControlRow>

      <svg width={width} height={h} style={{ display: 'block' }}>
        {/* Edges */}
        {EDGES.map(([a, b]) => {
          const na = NODES[a];
          const nb = NODES[b];
          const active = adopted.has(a) && adopted.has(b);
          return (
            <line
              key={`${a}-${b}`}
              x1={px(na)} y1={py(na)}
              x2={px(nb)} y2={py(nb)}
              stroke={active ? (isDark ? '#68d391' : '#38a169') : edgeColor}
              strokeWidth={active ? 2.5 : 1.5}
              opacity={active ? 0.9 : 0.6}
            />
          );
        })}

        {/* Group labels */}
        <text
          x={NODES[1].baseX * width}
          y={py(NODES[0]) - r - 6}
          textAnchor="middle" fontSize={11}
          fill={isDark ? '#68d391' : '#276749'} fontWeight={600}
        >seed cluster</text>
        <text
          x={((NODES[4].baseX + NODES[5].baseX) / 2) * width}
          y={py(NODES[4]) - r - 6}
          textAnchor="middle" fontSize={11}
          fill={isDark ? '#90cdf4' : '#2b6cb0'}
        >weak-tie bridges</text>
        <text
          x={((NODES[6].baseX + NODES[7].baseX) / 2) * width}
          y={py(NODES[6]) - r - 6}
          textAnchor="middle" fontSize={11}
          fill={isDark ? '#f6ad55' : '#c05621'} fontWeight={600}
        >dense cluster</text>

        {/* Nodes */}
        {NODES.map(n => {
          const nbrs = neighbors(n.id);
          const adoptedNbrs = nbrs.filter(id => adopted.has(id)).length;
          const pct = nbrs.length > 0 ? Math.round((adoptedNbrs / nbrs.length) * 100) : 0;
          const willAdopt = !adopted.has(n.id) && nbrs.length > 0 && pct >= threshold;
          return (
            <g key={n.id}>
              <circle
                cx={px(n)} cy={py(n)} r={r}
                fill={nodeColor(n.id)}
                stroke={nodeStroke(n.id)}
                strokeWidth={2}
                style={{ transition: 'fill 0.3s' }}
              />
              {willAdopt && (
                <circle
                  cx={px(n)} cy={py(n)} r={r + 4}
                  fill="none"
                  stroke={isDark ? '#f6e05e' : '#d69e2e'}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  opacity={0.9}
                />
              )}
              <text
                x={px(n)} y={py(n) + 4}
                textAnchor="middle" fontSize={10}
                fill={adopted.has(n.id) ? '#fff' : (isDark ? '#e2e8f0' : '#2d3748')}
                fontWeight={600}
              >{n.id}</text>
              {/* adoption fraction under each non-adopted node */}
              {!adopted.has(n.id) && nbrs.length > 0 && (
                <text
                  x={px(n)} y={py(n) + r + 12}
                  textAnchor="middle" fontSize={9}
                  fill={textColor} opacity={0.7}
                >{pct}%</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, fontSize: 11,
        color: textColor, opacity: 0.75, padding: '4px 8px',
        flexWrap: 'wrap',
      }}>
        <span>
          <svg width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }}>
            <circle cx={6} cy={6} r={5} fill={isDark ? '#68d391' : '#38a169'} />
          </svg>
          adopted
        </span>
        <span>
          <svg width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }}>
            <circle cx={6} cy={6} r={5} fill={isDark ? '#4a5568' : '#a0aec0'} />
          </svg>
          not yet ({`threshold: ${threshold}%`})
        </span>
        <span>
          <svg width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }}>
            <circle cx={6} cy={6} r={5} fill="none"
              stroke={isDark ? '#f6e05e' : '#d69e2e'} strokeWidth={2} strokeDasharray="3 2" />
          </svg>
          will adopt next step
        </span>
        <span style={{ color: isDark ? '#f6ad55' : '#c05621' }}>
          orange border = dense-cluster node
        </span>
        <span style={{ opacity: 0.6 }}>% under node = adopted-neighbour fraction</span>
      </div>
    </div>
  );
}
