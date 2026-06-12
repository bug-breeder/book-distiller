import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Bridges and Local Bridges',
  concept: 'Bridges and Local Bridges',
  caption: 'Click an edge to remove it. See which removals disconnect the graph (bridge) or just lengthen the path (local bridge).',
  libs: [],
};

// ── Fixed graph: two tight clusters joined by a local bridge A–B ─────────────
// Cluster L: nodes 0(A)–3(D) — fully connected triangle + one extra
// Cluster R: nodes 4(E)–7(H) — fully connected triangle + one extra
// Local bridge: A(0)–E(4) — no shared neighbors, span = 4 (via detour)
// Extra weak tie: C(2)–G(6) — also a local bridge (different clusters, no common neighbor)

interface NodeDef {
  id: number;
  label: string;
  rx: number;
  ry: number;
  cluster: 'L' | 'R';
}

const NODES: NodeDef[] = [
  // Left cluster
  { id: 0, label: 'A', rx: 0.14, ry: 0.35, cluster: 'L' },
  { id: 1, label: 'B', rx: 0.28, ry: 0.18, cluster: 'L' },
  { id: 2, label: 'C', rx: 0.28, ry: 0.52, cluster: 'L' },
  { id: 3, label: 'D', rx: 0.42, ry: 0.35, cluster: 'L' },
  // Right cluster
  { id: 4, label: 'E', rx: 0.58, ry: 0.35, cluster: 'R' },
  { id: 5, label: 'F', rx: 0.72, ry: 0.18, cluster: 'R' },
  { id: 6, label: 'G', rx: 0.72, ry: 0.52, cluster: 'R' },
  { id: 7, label: 'H', rx: 0.86, ry: 0.35, cluster: 'R' },
];

interface EdgeDef {
  id: string;
  u: number;
  v: number;
  kind: 'internal' | 'local-bridge';
}

const ALL_EDGES: EdgeDef[] = [
  // Left cluster internal
  { id: 'AB', u: 0, v: 1, kind: 'internal' },
  { id: 'AC', u: 0, v: 2, kind: 'internal' },
  { id: 'BC', u: 1, v: 2, kind: 'internal' },
  { id: 'BD', u: 1, v: 3, kind: 'internal' },
  { id: 'CD', u: 2, v: 3, kind: 'internal' },
  // Right cluster internal
  { id: 'EF', u: 4, v: 5, kind: 'internal' },
  { id: 'EG', u: 4, v: 6, kind: 'internal' },
  { id: 'FG', u: 5, v: 6, kind: 'internal' },
  { id: 'FH', u: 5, v: 7, kind: 'internal' },
  { id: 'GH', u: 6, v: 7, kind: 'internal' },
  // Local bridges between clusters
  { id: 'AE', u: 0, v: 4, kind: 'local-bridge' },
  { id: 'CG', u: 2, v: 6, kind: 'local-bridge' },
];

function buildAdjacency(removedEdges: Set<string>): Map<number, Set<number>> {
  const adj = new Map<number, Set<number>>();
  for (const n of NODES) adj.set(n.id, new Set());
  for (const e of ALL_EDGES) {
    if (!removedEdges.has(e.id)) {
      adj.get(e.u)!.add(e.v);
      adj.get(e.v)!.add(e.u);
    }
  }
  return adj;
}

function bfsDistance(adj: Map<number, Set<number>>, src: number, dst: number): number {
  if (src === dst) return 0;
  const dist = new Map<number, number>();
  dist.set(src, 0);
  const queue = [src];
  let qi = 0;
  while (qi < queue.length) {
    const u = queue[qi++];
    const d = dist.get(u)!;
    for (const v of (adj.get(u) ?? [])) {
      if (!dist.has(v)) {
        if (v === dst) return d + 1;
        dist.set(v, d + 1);
        queue.push(v);
      }
    }
  }
  return Infinity;
}

function getComponents(adj: Map<number, Set<number>>): number[] {
  // Returns component id per node
  const comp = new Array<number>(NODES.length).fill(-1);
  let cid = 0;
  for (const n of NODES) {
    if (comp[n.id] !== -1) continue;
    const queue = [n.id];
    let qi = 0;
    comp[n.id] = cid;
    while (qi < queue.length) {
      const u = queue[qi++];
      for (const v of (adj.get(u) ?? [])) {
        if (comp[v] === -1) {
          comp[v] = cid;
          queue.push(v);
        }
      }
    }
    cid++;
  }
  return comp;
}

export default function Sim({ width, isDark }: SimProps) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  const height = Math.min(Math.round(width * 0.55), 380);
  const PAD = Math.max(20, width * 0.05);
  const W = width - PAD * 2;
  const H = height - PAD * 2;
  const R = Math.max(13, Math.min(20, width * 0.025));
  const fontSize = Math.max(10, Math.min(14, width * 0.019));

  function nodePos(n: NodeDef) {
    return { x: PAD + n.rx * W, y: PAD + n.ry * H };
  }

  const adj = buildAdjacency(removed);
  const comps = getComponents(adj);
  const numComponents = new Set(comps).size;
  const disconnected = numComponents > 1;

  const toggleEdge = useCallback((eid: string) => {
    setRemoved(prev => {
      const next = new Set(prev);
      if (next.has(eid)) next.delete(eid);
      else next.add(eid);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setRemoved(new Set());
    setHovered(null);
  }, []);

  // Detect what was just removed for status text
  function edgeInfo(e: EdgeDef): string {
    if (removed.has(e.id)) return '';
    // Would removing this edge be a bridge or local bridge?
    const testAdj = buildAdjacency(new Set([...removed, e.id]));
    const testComps = getComponents(testAdj);
    const testDisconnected = new Set(testComps).size > numComponents;
    if (testDisconnected) return 'bridge';
    // Check local bridge: no common neighbors
    const neighborsU = adj.get(e.u) ?? new Set<number>();
    const neighborsV = adj.get(e.v) ?? new Set<number>();
    const commonCount = [...neighborsU].filter(x => x !== e.v && neighborsV.has(x)).length;
    if (commonCount === 0) return 'local-bridge';
    return 'internal';
  }

  // Colours
  const bg        = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor  = isDark ? '#e2e8f0' : '#1a202c';
  const clrL       = isDark ? '#63b3ed' : '#3182ce';
  const clrR       = isDark ? '#68d391' : '#38a169';
  const bridgeClr  = '#d69e2e';   // gold = local bridge
  const internalC  = isDark ? '#4a5568' : '#cbd5e0';
  const removedC   = isDark ? '#2d3748' : '#edf2f7';
  const removedStroke = isDark ? '#4a5568' : '#a0aec0';

  // Status message
  let statusText = '';
  if (removed.size === 0) {
    statusText = 'Gold edges are local bridges — A & E (and C & G) share no mutual friends. Click them to remove.';
  } else if (disconnected) {
    statusText = `Graph split into ${numComponents} disconnected components. Removing both local bridges severs all inter-cluster paths.`;
  } else {
    const removedEdges = ALL_EDGES.filter(e => removed.has(e.id));
    const hadLocalBridge = removedEdges.some(e => e.kind === 'local-bridge');
    const detourSpan = bfsDistance(adj, 0, 4);
    if (hadLocalBridge && detourSpan < Infinity) {
      statusText = `Local bridge removed. Shortest path A→E is now ${detourSpan} hops (detour through remaining bridge).`;
    } else {
      statusText = `${removed.size} edge${removed.size > 1 ? 's' : ''} removed. The graph remains connected — internal edges don't disconnect it.`;
    }
  }

  // Hover status
  let hoverText = '';
  if (hovered) {
    const e = ALL_EDGES.find(x => x.id === hovered);
    if (e && !removed.has(hovered)) {
      const info = edgeInfo(e);
      if (info === 'bridge') hoverText = `Edge ${e.id}: removing this would disconnect the graph entirely.`;
      else if (info === 'local-bridge') hoverText = `Edge ${e.id}: LOCAL BRIDGE — ${NODES[e.u].label} & ${NODES[e.v].label} share no common friends.`;
      else hoverText = `Edge ${e.id}: internal edge — inside a cluster, sits in a triangle.`;
    } else if (e && removed.has(hovered)) {
      hoverText = `Edge ${e.id}: removed. Click to restore.`;
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: bg, borderRadius: 8, padding: 8, userSelect: 'none' }}>
      <ControlRow>
        <Button label="Reset" onClick={reset} />
        <span style={{ marginLeft: 12, color: textColor, fontSize: 12 }}>
          Click edges to remove/restore them
        </span>
      </ControlRow>

      <svg width={width} height={height} style={{ display: 'block' }} aria-label="Bridges and local bridges">
        {/* Edges */}
        {ALL_EDGES.map(e => {
          const pu = nodePos(NODES[e.u]);
          const pv = nodePos(NODES[e.v]);
          const isRemoved = removed.has(e.id);
          const isHovered = hovered === e.id;
          const isLocalBridge = e.kind === 'local-bridge';

          let stroke = isLocalBridge ? bridgeClr : internalC;
          let strokeWidth = isLocalBridge ? 3 : 1.8;
          let opacity = 1;

          if (isRemoved) {
            stroke = removedStroke;
            strokeWidth = 1.5;
            opacity = 0.35;
          } else if (isHovered) {
            strokeWidth += 1.5;
            opacity = 1;
          }

          // Invisible wider hit target
          const midX = (pu.x + pv.x) / 2;
          const midY = (pu.y + pv.y) / 2;

          return (
            <g
              key={e.id}
              onClick={() => toggleEdge(e.id)}
              onMouseEnter={() => setHovered(e.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit area */}
              <line
                x1={pu.x} y1={pu.y}
                x2={pv.x} y2={pv.y}
                stroke="transparent"
                strokeWidth={14}
              />
              {/* Visible line */}
              <line
                x1={pu.x} y1={pu.y}
                x2={pv.x} y2={pv.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={isRemoved ? '5 5' : undefined}
                opacity={opacity}
              />
              {/* Strike-through for removed */}
              {isRemoved && (
                <line
                  x1={midX - 6} y1={midY - 6}
                  x2={midX + 6} y2={midY + 6}
                  stroke={removedStroke}
                  strokeWidth={2}
                  opacity={0.5}
                />
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const p = nodePos(n);
          const fill = n.cluster === 'L' ? clrL : clrR;
          const compId = comps[n.id];
          const maxComp = comps.reduce((a, b) => Math.max(a, b), 0);
          const inSmallComp = disconnected && numComponents > 1 && comps.filter(c => c === compId).length < NODES.length / 2;
          return (
            <g key={n.id}>
              <circle
                cx={p.x} cy={p.y} r={R}
                fill={fill}
                stroke={disconnected && inSmallComp ? '#e53e3e' : (isDark ? '#1e1e2e' : '#fff')}
                strokeWidth={disconnected && inSmallComp ? 3 : 2}
                opacity={disconnected && inSmallComp ? 0.65 : 1}
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
        <LegendItem color={bridgeClr} dash={false} label="Local bridge" textColor={textColor} />
        <LegendItem color={isDark ? '#63b3ed' : '#3182ce'} dash={false} label="Left cluster" textColor={textColor} />
        <LegendItem color={isDark ? '#68d391' : '#38a169'} dash={false} label="Right cluster" textColor={textColor} />
      </div>

      <div style={{ padding: '2px 8px', fontSize: 12, color: textColor, opacity: 0.85, minHeight: 18 }}>
        {hoverText || statusText}
      </div>
    </div>
  );
}

function LegendItem({ color, dash, label, textColor }: { color: string; dash: boolean; label: string; textColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: textColor }}>
      <svg width={28} height={8} style={{ flexShrink: 0 }}>
        <line x1={2} y1={4} x2={26} y2={4} stroke={color} strokeWidth={2.5} strokeDasharray={dash ? '5 4' : undefined} />
      </svg>
      {label}
    </div>
  );
}
