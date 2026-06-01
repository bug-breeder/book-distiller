// src/diagrams/lint.ts
import type { Graph } from './parse.js';

export interface LintResult {
  ok: boolean;
  unknown: string[];
}

/** A label is verifiable iff it is not a bare single letter/number — those
 * abstract ids occur all over the text and cannot be grounded. Shared by the
 * node-label lint and the edge lint. */
export function isVerifiableLabel(label: string): boolean {
  return !/^[A-Za-z0-9]$/.test(label.trim());
}

/** Escape a string for literal use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive, word-boundary test: does `term` occur as a whole token? */
function textHasTerm(text: string, term: string): boolean {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text);
}

/**
 * Deterministic grounding backstop: every *verifiable* node label (not a bare
 * single letter/number) must appear in the chapter text as a whole word. Single-
 * char abstract ids are exempt — they occur all over the text and cannot be
 * verified (those graphs rely on the conservative authoring policy instead).
 */
export function lintNodesAgainstText(g: Graph, chapterText: string): LintResult {
  const unknown: string[] = [];
  for (const n of g.nodes) {
    const label = n.label.trim();
    if (!isVerifiableLabel(label)) continue;
    if (!textHasTerm(chapterText, label)) unknown.push(label);
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

/**
 * Split chapter text into rough sentences. `pdftotext` wraps lines mid-sentence,
 * so collapse all whitespace (newlines, form-feeds, runs of spaces) to single
 * spaces first, then split on sentence-ending punctuation. Heuristic — good
 * enough for a grounding backstop.
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
