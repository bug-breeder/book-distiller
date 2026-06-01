// src/diagrams/lint.ts
import type { Graph } from './parse.js';

export interface LintResult {
  ok: boolean;
  unknown: string[];
}

/**
 * Deterministic grounding backstop: every *meaningful* node label (length >= 2,
 * not a bare single letter/number) must appear in the chapter text. Single-char
 * abstract ids are exempt — they occur all over the text and cannot be verified
 * (those graphs rely on the conservative authoring policy instead).
 */
export function lintNodesAgainstText(g: Graph, chapterText: string): LintResult {
  const hay = chapterText.toLowerCase();
  const unknown: string[] = [];
  for (const n of g.nodes) {
    const label = n.label.trim();
    if (/^[A-Za-z0-9]$/.test(label)) continue; // bare single char -> unverifiable
    if (!hay.includes(label.toLowerCase())) unknown.push(label);
  }
  return { ok: unknown.length === 0, unknown: [...new Set(unknown)] };
}

/**
 * The faithfulness policy caps a grounded illustrative graph at 8 nodes. Larger
 * graphs are real/enumerated networks whose edges cannot be transcribed from
 * prose — they must remain a location pointer, not an inline diagram. This is the
 * deterministic half of the size guard (node-label grounding is the other half).
 */
export const MAX_GRAPH_NODES = 8;

/** True when a graph has more nodes than the illustrative-graph cap allows. */
export function exceedsNodeCap(g: Graph): boolean {
  return g.nodes.length > MAX_GRAPH_NODES;
}
