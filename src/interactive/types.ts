// src/interactive/types.ts
// Structured representation of a tutor lesson note, parsed for interactive-book generation.

export interface ConceptCheck {
  question: string;
  idealAnswer: string;
}

export interface Concept {
  /** The `Cn` label, e.g. "C1". */
  label: string;
  /** The concept name after the em dash in `### Cn — <name>`. */
  name: string;
  explanation: string;
  whyItMatters: string;
  check?: ConceptCheck;
  misconception?: string;
  /** Present only when the chapter genuinely supports a real-world use. */
  application?: string;
  /** Optional `#### Dig deeper` block: intuition + a fully worked example. Multi-paragraph markdown. */
  digDeeper?: string;
}

export interface FigureRef {
  /** e.g. "Figure 1.1" or "Equation 4.1". */
  label: string;
  /** e.g. "p. 16" or "around p. 97". */
  location: string;
  /** What to look for / what it shows. */
  caption: string;
  /**
   * Concept name this figure illustrates. When set (via `| concept: <name>` on the
   * figure line), the build extracts the REAL book figure image and embeds it inline
   * after that concept — for figures we can't faithfully recreate as a <GraphFigure>
   * (large/real networks like the karate club, charts, photos, maps).
   */
  concept?: string;
}

export type FigureEdgeKind =
  | 'normal'
  | 'strong'
  | 'weak'
  | 'bridge'
  | 'new'
  | 'dim'
  | 'positive'
  | 'negative';

export interface FigureNodeSpec {
  id: string;
  /** 0-based community/colour group. */
  group?: number;
  /** Display label; defaults to id. */
  label?: string;
}

export interface FigureEdgeSpec {
  source: string;
  target: string;
  kind?: FigureEdgeKind;
  /** Edge annotation, e.g. "S", "W", or a flow value. */
  label?: string;
}

/**
 * A figure the lesson *creates* (rendered as an inline `<GraphFigure>`), as opposed
 * to a `FigureRef` that merely cites a page in the source book.
 */
export interface GraphFigureSpec {
  title: string;
  /** Concept name this figure illustrates; anchors it after that concept. */
  concept?: string;
  /** 'force' (default) runs a brief deterministic layout; 'circle' pins a ring. */
  layout?: 'force' | 'circle';
  caption?: string;
  note?: string;
  nodes: FigureNodeSpec[];
  edges: FigureEdgeSpec[];
}

export interface ReviewItem {
  id: string;
  concept: string;
  question: string;
  answer: string;
}

export interface ParsedLesson {
  chapter: number;
  title: string;
  sourceType: 'pdf' | 'epub';
  /** e.g. "15-34" for pdf, or an anchor for epub. */
  sourceRef: string;
  /** Numbered teaching-arc lines (name + objective), in teaching order. */
  teachingArc: string[];
  concepts: Concept[];
  figures: FigureRef[];
  /** Inline figures the lesson renders itself (not page citations). */
  visualizations: GraphFigureSpec[];
  reviewItems: ReviewItem[];
}

/** One AI-authored sim, recorded in interactive-book/src/sims/<slug>/manifest.json. */
export interface SimEntry {
  chapter: number;
  /** Exact concept name (matches a `### Cn — <name>` heading); anchors the sim. */
  concept: string;
  title: string;
  caption: string;
  /** Path under interactive-book/src/sims/<slug>/, e.g. "ch4/schelling.tsx". */
  file: string;
  /** Third-party packages the sim imports. */
  libs: string[];
}

export interface SimManifest {
  slug: string;
  sims: SimEntry[];
}
