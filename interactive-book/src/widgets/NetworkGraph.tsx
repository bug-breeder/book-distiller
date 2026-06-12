import React, {useEffect, useRef} from 'react';
import * as d3 from 'd3';
import VizFrame from './VizFrame';

interface GNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}
interface GLink extends d3.SimulationLinkDatum<GNode> {
  source: string | GNode;
  target: string | GNode;
  weak?: boolean;
}
interface GraphData {
  nodes: GNode[];
  links: GLink[];
}

// Illustrative networks (clearly teaching examples, not real datasets).
const DATASETS: Record<string, GraphData> = {
  // Three tightly-knit communities joined by a few weak-tie "bridges".
  clustered: {
    nodes: [
      {id: 'A1', group: 0}, {id: 'A2', group: 0}, {id: 'A3', group: 0}, {id: 'A4', group: 0}, {id: 'A5', group: 0},
      {id: 'B1', group: 1}, {id: 'B2', group: 1}, {id: 'B3', group: 1}, {id: 'B4', group: 1}, {id: 'B5', group: 1},
      {id: 'C1', group: 2}, {id: 'C2', group: 2}, {id: 'C3', group: 2}, {id: 'C4', group: 2},
    ],
    links: [
      {source: 'A1', target: 'A2'}, {source: 'A1', target: 'A3'}, {source: 'A2', target: 'A3'},
      {source: 'A2', target: 'A4'}, {source: 'A3', target: 'A4'}, {source: 'A4', target: 'A5'}, {source: 'A3', target: 'A5'},
      {source: 'B1', target: 'B2'}, {source: 'B1', target: 'B3'}, {source: 'B2', target: 'B3'},
      {source: 'B2', target: 'B4'}, {source: 'B3', target: 'B4'}, {source: 'B4', target: 'B5'}, {source: 'B3', target: 'B5'},
      {source: 'C1', target: 'C2'}, {source: 'C1', target: 'C3'}, {source: 'C2', target: 'C3'},
      {source: 'C2', target: 'C4'}, {source: 'C3', target: 'C4'},
      // Weak-tie bridges between communities:
      {source: 'A5', target: 'B1', weak: true},
      {source: 'B5', target: 'C1', weak: true},
      {source: 'A4', target: 'C2', weak: true},
    ],
  },
};

const GROUP_COLORS = ['#4f8cff', '#f0883e', '#3fb950'];

interface NetworkGraphProps {
  dataset?: keyof typeof DATASETS;
  height?: number;
  title?: string;
  caption?: string;
  note?: string;
}

/**
 * Interactive force-directed graph. Drag nodes to feel that a graph is defined
 * by its connections, not its drawing; hover a node to highlight its neighbors;
 * dashed links are weak-tie bridges between communities.
 */
export default function NetworkGraph({
  dataset = 'clustered',
  height = 420,
  title = 'Interactive network',
  caption = 'Drag any node — the connections stay the same. Hover a node to light up its neighbors.',
  note = 'Illustrative network: three tightly-knit communities joined by weak-tie bridges (dashed).',
}: NetworkGraphProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    // Deep-clone so the force sim can mutate x/y without corrupting the dataset.
    const raw = DATASETS[dataset];
    const nodes: GNode[] = raw.nodes.map((n) => ({...n}));
    const links: GLink[] = raw.links.map((l) => ({...l}));

    const svg = d3.select(svgEl);
    let width = container.clientWidth || 600;

    svg.selectAll('*').remove();
    const linkSel = svg
      .append('g')
      .attr('stroke', 'var(--viz-edge)')
      .selectAll<SVGLineElement, GLink>('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => (d.weak ? 1.5 : 2.5))
      .attr('stroke-dasharray', (d) => (d.weak ? '4 3' : null))
      .attr('stroke-opacity', (d) => (d.weak ? 0.6 : 0.85));

    const nodeSel = svg
      .append('g')
      .selectAll<SVGGElement, GNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'grab');

    nodeSel
      .append('circle')
      .attr('r', 11)
      .attr('fill', (d) => GROUP_COLORS[d.group % GROUP_COLORS.length])
      .attr('stroke', 'var(--viz-node-stroke)')
      .attr('stroke-width', 2);

    nodeSel
      .append('text')
      .text((d) => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.32em')
      .attr('font-size', 9)
      .attr('font-weight', 600)
      .attr('fill', 'var(--viz-node-label)')
      .style('pointer-events', 'none');

    // Adjacency for hover highlighting.
    const neighbors = new Map<string, Set<string>>();
    nodes.forEach((n) => neighbors.set(n.id, new Set([n.id])));
    links.forEach((l) => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      neighbors.get(s)?.add(t);
      neighbors.get(t)?.add(s);
    });

    function idOf(e: GNode | string): string {
      return typeof e === 'string' ? e : e.id;
    }

    nodeSel
      .on('mouseenter', (_evt, d) => {
        const near = neighbors.get(d.id) ?? new Set([d.id]);
        nodeSel.attr('opacity', (n) => (near.has(n.id) ? 1 : 0.15));
        linkSel.attr('stroke-opacity', (l) =>
          near.has(idOf(l.source)) && near.has(idOf(l.target)) ? 1 : 0.06,
        );
      })
      .on('mouseleave', () => {
        nodeSel.attr('opacity', 1);
        linkSel.attr('stroke-opacity', (l) => (l.weak ? 0.6 : 0.85));
      });

    const sim = d3
      .forceSimulation<GNode>(nodes)
      .force('link', d3.forceLink<GNode, GLink>(links).id((d) => d.id).distance((l) => (l.weak ? 110 : 55)).strength((l) => (l.weak ? 0.25 : 0.8)))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(18));

    sim.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as GNode).x ?? 0)
        .attr('y1', (d) => (d.source as GNode).y ?? 0)
        .attr('x2', (d) => (d.target as GNode).x ?? 0)
        .attr('y2', (d) => (d.target as GNode).y ?? 0);
      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    const drag = d3
      .drag<SVGGElement, GNode>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    nodeSel.call(drag);

    function resize(): void {
      if (!container) return;
      const w = container.clientWidth || width;
      if (w === width) return;
      width = w;
      svg.attr('width', width);
      sim.force('center', d3.forceCenter(width / 2, height / 2));
      sim.alpha(0.5).restart();
    }
    svg.attr('width', width).attr('height', height);
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      sim.stop();
      ro.disconnect();
    };
  }, [dataset, height]);

  return (
    <VizFrame title={title} caption={caption} note={note}>
      <div ref={containerRef} className="viz__canvas-wrap">
        <svg ref={svgRef} role="img" aria-label="Interactive network graph" />
      </div>
    </VizFrame>
  );
}
