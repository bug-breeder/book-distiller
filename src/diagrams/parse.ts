// src/diagrams/parse.ts

export interface GraphNode {
  id: string;
  label: string;
}
export interface GraphEdge {
  from: string;
  to: string;
  directed: boolean;
  label?: string;
}
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const HEADER_RE = /^\s*(graph|flowchart)\s+(TB|TD|BT|RL|LR)\b/i;
// left token, connector, optional |edge label|, right token
const EDGE_RE = /^\s*(.+?)\s*(<-->|-->|---)\s*(?:\|([^|]*)\|\s*)?(.+?)\s*$/;
// node id with an optional bracketed label: [..] {..} ((..)) (..)
const TOKEN_RE =
  /^([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\]|\{([^}]*)\}|\(\(([^)]*)\)\)|\(([^)]*)\))?$/;

function parseToken(tok: string): GraphNode | null {
  const m = TOKEN_RE.exec(tok.trim());
  if (!m) return null;
  const label = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? m[1]).trim();
  return { id: m[1], label };
}

/**
 * Parse a Mermaid `graph`/`flowchart` block into nodes and edges.
 * Undirected `A --- B`, directed `A --> B` / `A <--> B`, optional node labels
 * and `|edge labels|`. Lines that are not an edge or a node declaration
 * (headers, `%%` comments, prose) are ignored.
 */
export function parseMermaidGraph(block: string): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const addNode = (n: GraphNode | null): void => {
    if (n && !seen.has(n.id)) {
      seen.add(n.id);
      nodes.push(n);
    }
  };

  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line || HEADER_RE.test(line) || line.startsWith('%%')) continue;

    const em = EDGE_RE.exec(line);
    if (em) {
      const from = parseToken(em[1]);
      const to = parseToken(em[4]);
      if (from && to) {
        addNode(from);
        addNode(to);
        const edge: GraphEdge = { from: from.id, to: to.id, directed: em[2] !== '---' };
        if (em[3] && em[3].trim()) edge.label = em[3].trim();
        edges.push(edge);
        continue;
      }
    }
    addNode(parseToken(line));
  }
  return { nodes, edges };
}
