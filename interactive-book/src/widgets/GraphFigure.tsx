import React, {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import VizFrame from './VizFrame';

// A declarative, faithful redraw of a book figure — NOT a citation. The generator
// passes nodes + edges parsed from the lesson note's `## Visualizations` specs, so
// the same small graphs the book draws (triangles, bridges, strong/weak ties,
// communities) are rendered inline next to the concept they illustrate.

export type EdgeKind =
  | 'normal'
  | 'strong'
  | 'weak'
  | 'bridge'
  | 'new'
  | 'dim'
  | 'positive'
  | 'negative';

export interface FigureNode {
  id: string;
  /** Community / colour group (0-based). */
  group?: number;
  /** Display label; defaults to id. */
  label?: string;
}
export interface FigureEdge {
  source: string;
  target: string;
  kind?: EdgeKind;
  label?: string;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  kind: EdgeKind;
  label?: string;
}

const GROUP_COLORS = ['#4f8cff', '#f0883e', '#3fb950', '#d29922', '#a371f7'];

const EDGE_STYLE: Record<EdgeKind, {width: number; dash: string | null; opacity: number; color: string}> = {
  normal: {width: 2.6, dash: null, opacity: 0.8, color: 'var(--viz-edge)'},
  strong: {width: 3.6, dash: null, opacity: 0.95, color: 'var(--viz-edge)'},
  weak: {width: 1.8, dash: '6 4', opacity: 0.7, color: 'var(--viz-edge)'},
  bridge: {width: 3.4, dash: null, opacity: 1, color: '#e3b341'},
  new: {width: 2.8, dash: '7 4', opacity: 1, color: '#3fb950'},
  dim: {width: 1.5, dash: '3 4', opacity: 0.3, color: 'var(--viz-edge)'},
  positive: {width: 3.2, dash: null, opacity: 0.95, color: '#3fb950'},
  negative: {width: 2.8, dash: '7 5', opacity: 0.92, color: '#f85149'},
};

export interface GraphFigureProps {
  title: string;
  caption?: string;
  note?: string;
  nodes: FigureNode[];
  edges: FigureEdge[];
  /** 'force' (default) lays out with a brief deterministic simulation; 'circle' pins nodes evenly on a ring (good for small/proof graphs). */
  layout?: 'force' | 'circle';
  height?: number;
}

function idOf(e: SimNode | string): string {
  return typeof e === 'string' ? e : e.id;
}

/**
 * Renders one book figure as an inline SVG graph. Layout is deterministic (fixed
 * circle seeding + a fixed number of force ticks) so a given spec always draws the
 * same picture. Hover a node to spotlight its neighbourhood.
 */
export default function GraphFigure({
  title,
  caption,
  note,
  nodes,
  edges,
  layout = 'force',
  height = 400,
}: GraphFigureProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [legendKinds, setLegendKinds] = useState<EdgeKind[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const known = new Set(nodes.map((n) => n.id));
    const simNodes: SimNode[] = nodes.map((n, i) => ({
      id: n.id,
      group: n.group ?? 0,
      label: n.label ?? n.id,
      // Deterministic circle seed (no RNG) → reproducible layout every render.
      x: Math.cos((2 * Math.PI * i) / nodes.length),
      y: Math.sin((2 * Math.PI * i) / nodes.length),
    }));
    const simLinks: SimLink[] = edges
      .filter((e) => known.has(e.source) && known.has(e.target))
      .map((e) => ({source: e.source, target: e.target, kind: e.kind ?? 'normal', label: e.label}));

    setLegendKinds([...new Set(simLinks.map((l) => l.kind))].filter((k) => k !== 'normal'));

    const width = container.clientWidth || 640;

    // Lay out in an arbitrary local space; the fit-to-box step below rescales the
    // whole graph to fill the canvas, so absolute coordinates here don't matter.
    if (layout === 'circle') {
      const r = 150;
      simNodes.forEach((n, i) => {
        n.x = r * Math.cos((2 * Math.PI * i) / simNodes.length - Math.PI / 2);
        n.y = r * Math.sin((2 * Math.PI * i) / simNodes.length - Math.PI / 2);
      });
    } else {
      simNodes.forEach((n) => {
        n.x = n.x! * 150;
        n.y = n.y! * 150;
      });
      const sim = d3
        .forceSimulation<SimNode>(simNodes)
        .force(
          'link',
          d3
            .forceLink<SimNode, SimLink>(simLinks)
            .id((d) => d.id)
            .distance((l) => (l.kind === 'weak' || l.kind === 'bridge' ? 95 : 62))
            .strength(0.7),
        )
        .force('charge', d3.forceManyBody().strength(-280))
        .force('center', d3.forceCenter(0, 0))
        .force('collide', d3.forceCollide(32))
        .stop();
      // Fixed iteration count → deterministic static layout, no animation.
      for (let i = 0; i < 320; i++) sim.tick();
    }

    // forceLink resolves link.source/target into node objects; the circle path
    // skips the simulation, so resolve string ids → nodes ourselves before drawing.
    const byId = new Map(simNodes.map((n) => [n.id, n]));
    simLinks.forEach((l) => {
      if (typeof l.source === 'string') l.source = byId.get(l.source)!;
      if (typeof l.target === 'string') l.target = byId.get(l.target)!;
    });

    // Fit-to-box with an ADAPTIVE height: scale the graph to fill the width, then
    // let the canvas height grow to match the layout's aspect ratio. This keeps node
    // spacing intact (no squishing) so dense/elongated graphs stay readable.
    const pad = 46; // margin so nodes + below-node labels never clip
    const xs = simNodes.map((n) => n.x ?? 0);
    const ys = simNodes.map((n) => n.y ?? 0);
    const bw = Math.max(Math.max(...xs) - Math.min(...xs), 1);
    const bh = Math.max(Math.max(...ys) - Math.min(...ys), 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const MIN_H = 230;
    const MAX_H = 560;
    const MAX_SCALE = 3.2;
    let scale = Math.min((width - 2 * pad) / bw, MAX_SCALE);
    let drawH = Math.round(bh * scale + 2 * pad);
    if (drawH > MAX_H) {
      drawH = MAX_H;
      scale = (drawH - 2 * pad) / bh; // tall graph: fall back to height-fit
    } else if (drawH < Math.max(height, MIN_H)) {
      drawH = Math.max(height, MIN_H); // short graph: pad out to the baseline height
    }
    const offX = (width - bw * scale) / 2 - minX * scale;
    const offY = (drawH - bh * scale) / 2 - minY * scale;
    simNodes.forEach((n) => {
      n.x = (n.x ?? 0) * scale + offX;
      n.y = (n.y ?? 0) * scale + offY;
    });

    // Node radius is derived from the ACTUAL rendered spacing rather than a fixed
    // pixel value — that's what was keeping the nodes tiny on small graphs. We take
    // the closest pair of nodes and size the radius to a fraction of that gap, so
    // sparse graphs (triangles, bridges) get big bold nodes while dense ones stay
    // overlap-free. The 0.4 factor guarantees two nearest nodes can't collide.
    let minNN = Infinity;
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const dx = (simNodes[i].x ?? 0) - (simNodes[j].x ?? 0);
        const dy = (simNodes[i].y ?? 0) - (simNodes[j].y ?? 0);
        const d = Math.hypot(dx, dy);
        if (d < minNN) minNN = d;
      }
    }
    if (!Number.isFinite(minNN)) minNN = 120;
    // Target floor 22 and visual cap 30, BUT never let two touching nodes overlap:
    // 0.46× the closest gap keeps a sliver between them, so an unusually dense graph
    // trims the radius below the floor rather than colliding.
    const NODE_R = Math.min(30, minNN * 0.46, Math.max(22, minNN * 0.36));
    const labelFs = Math.round(NODE_R * 0.78);

    // Long (named) labels render BELOW their node, so the bottom-most node needs
    // extra room or its label clips off the canvas. Grow the canvas downward only —
    // nodes are already centred in drawH, so this becomes free space at the bottom.
    const hasLongLabel = simNodes.some((n) => n.label.length > 3);
    const bottomPad = hasLongLabel ? Math.max(0, Math.round(NODE_R + 31 - pad)) : 0;
    const svgH = drawH + bottomPad;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', svgH).attr('viewBox', `0 0 ${width} ${svgH}`);

    const linkSel = svg
      .append('g')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => EDGE_STYLE[d.kind].color)
      .attr('stroke-width', (d) => EDGE_STYLE[d.kind].width)
      .attr('stroke-dasharray', (d) => EDGE_STYLE[d.kind].dash)
      .attr('stroke-opacity', (d) => EDGE_STYLE[d.kind].opacity)
      .attr('stroke-linecap', 'round')
      .attr('x1', (d) => (d.source as SimNode).x ?? 0)
      .attr('y1', (d) => (d.source as SimNode).y ?? 0)
      .attr('x2', (d) => (d.target as SimNode).x ?? 0)
      .attr('y2', (d) => (d.target as SimNode).y ?? 0);

    // Edge labels (e.g. S / W, flow values).
    svg
      .append('g')
      .selectAll<SVGTextElement, SimLink>('text')
      .data(simLinks.filter((l) => l.label))
      .join('text')
      .text((d) => d.label!)
      .attr('x', (d) => (((d.source as SimNode).x ?? 0) + ((d.target as SimNode).x ?? 0)) / 2)
      .attr('y', (d) => (((d.source as SimNode).y ?? 0) + ((d.target as SimNode).y ?? 0)) / 2 - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .attr('font-weight', 700)
      .attr('fill', 'var(--ifm-font-color-base)')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--viz-body-bg)')
      .attr('stroke-width', 3.5)
      .style('pointer-events', 'none');

    const nodeSel = svg
      .append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);

    nodeSel
      .append('circle')
      .attr('r', NODE_R)
      .attr('fill', (d) => GROUP_COLORS[d.group % GROUP_COLORS.length])
      .attr('stroke', 'var(--viz-node-stroke)')
      .attr('stroke-width', 2.5);

    // Short labels (ids like A, B, 12) sit white inside the circle; longer named
    // labels (e.g. "Karate", "Daniel") go below in body colour so they stay readable.
    nodeSel
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 700)
      .style('pointer-events', 'none')
      .each(function (d) {
        const long = d.label.length > 3;
        const sel = d3.select(this);
        if (long) {
          sel
            .attr('y', NODE_R + 18)
            .attr('dy', '0')
            .attr('font-size', Math.max(14, Math.round(NODE_R * 0.42)))
            .attr('fill', 'var(--ifm-font-color-base)')
            .attr('paint-order', 'stroke')
            .attr('stroke', 'var(--viz-body-bg)')
            .attr('stroke-width', 4);
        } else {
          sel
            .attr('dy', '0.32em')
            .attr('font-size', d.label.length > 2 ? Math.round(labelFs * 0.8) : labelFs)
            .attr('fill', 'var(--viz-node-label)');
        }
      });

    const neighbors = new Map<string, Set<string>>();
    simNodes.forEach((n) => neighbors.set(n.id, new Set([n.id])));
    simLinks.forEach((l) => {
      const s = idOf(l.source);
      const t = idOf(l.target);
      neighbors.get(s)?.add(t);
      neighbors.get(t)?.add(s);
    });

    nodeSel
      .style('cursor', 'pointer')
      .on('mouseenter', (_evt, d) => {
        const near = neighbors.get(d.id) ?? new Set([d.id]);
        nodeSel.attr('opacity', (n) => (near.has(n.id) ? 1 : 0.18));
        linkSel.attr('stroke-opacity', (l) =>
          near.has(idOf(l.source)) && near.has(idOf(l.target)) ? 1 : 0.08,
        );
      })
      .on('mouseleave', () => {
        nodeSel.attr('opacity', 1);
        linkSel.attr('stroke-opacity', (l) => EDGE_STYLE[l.kind].opacity);
      });

    // The fixed viewBox + CSS `width: 100%` scale the figure responsively, so no
    // resize handler is needed.
  }, [nodes, edges, layout, height]);

  const LEGEND_LABEL: Record<EdgeKind, string> = {
    normal: 'tie',
    strong: 'strong tie',
    weak: 'weak tie',
    bridge: 'bridge',
    new: 'new edge',
    dim: 'removed / context',
    positive: 'friend (+)',
    negative: 'enemy (−)',
  };

  return (
    <VizFrame title={title} caption={caption} note={note}>
      <div ref={containerRef} className="viz__canvas-wrap viz__figure">
        <svg ref={svgRef} role="img" aria-label={title} />
      </div>
      {legendKinds.length > 0 ? (
        <div className="viz__legend">
          {legendKinds.map((k) => (
            <span className="viz__legend-item" key={k}>
              <span className={`viz__legend-swatch viz__legend-swatch--${k}`} />
              {LEGEND_LABEL[k]}
            </span>
          ))}
        </div>
      ) : null}
    </VizFrame>
  );
}
