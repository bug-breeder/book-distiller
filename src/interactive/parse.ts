// src/interactive/parse.ts
// Parse a tutor lesson note (book-output/<slug>/lessons/chapter-NN-lesson.md) into
// a structured ParsedLesson for interactive-book generation.
import { parseReviewItems } from '../progress/lessonNotes.js';
import type {
  Concept,
  FigureEdgeKind,
  FigureEdgeSpec,
  FigureNodeSpec,
  FigureRef,
  GraphFigureSpec,
  ParsedLesson,
} from './types.js';

/** Strip a leading `- **Label:** ` bullet prefix, returning the remaining text. */
function bulletValue(line: string): string | undefined {
  const m = line.match(/^-\s*\*\*[^*]+:\*\*\s*(.*)$/);
  return m ? m[1].trim() : undefined;
}

function sectionLines(lines: string[], heading: RegExp): string[] {
  const start = lines.findIndex((l) => heading.test(l.trim()));
  if (start === -1) return [];
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) break;
    out.push(lines[i]);
  }
  return out;
}

function parseFrontmatter(md: string): {
  body: string;
  chapter: number;
  title: string;
  sourceType: 'pdf' | 'epub' | 'authored';
  sourceRef: string;
} {
  const fm = md.match(/^---\n([\s\S]*?)\n---\n?/);
  let chapter = 0;
  let title = '';
  let sourceType: 'pdf' | 'epub' | 'authored' = 'pdf';
  let sourceRef = '';
  let body = md;
  if (fm) {
    body = md.slice(fm[0].length);
    const block = fm[1];
    chapter = Number(block.match(/^chapter:\s*(\d+)/m)?.[1] ?? 0);
    title = (block.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ?? '').trim();
    const src = block.match(/^source:\s*\{([^}]*)\}/m)?.[1] ?? '';
    if (/type:\s*epub/.test(src)) sourceType = 'epub';
    else if (/type:\s*authored/.test(src)) sourceType = 'authored';
    sourceRef = (src.match(/pages:\s*"?([^",}]+)"?/)?.[1] ?? src.match(/anchor:\s*"?([^",}]+)"?/)?.[1] ?? '').trim();
  }
  return { body, chapter, title, sourceType, sourceRef };
}

function parseTeachingArc(lines: string[]): string[] {
  return sectionLines(lines, /^##\s+teaching arc/i)
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s+/.test(l))
    .map((l) => l.replace(/^\d+\.\s+/, '').trim());
}

/**
 * Remove the smallest common leading space-indentation from a block of raw lines, then join.
 * Lesson notes are space-indented (no tabs), so we count leading spaces only — that keeps the
 * char count and the visual indent in agreement.
 */
function dedent(lines: string[]): string {
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^ */)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

function parseConcepts(lines: string[]): Concept[] {
  const start = lines.findIndex((l) => /^##\s+concepts/i.test(l.trim()));
  if (start === -1) return [];
  const concepts: Concept[] = [];
  let current: Concept | null = null;
  let digBuf: string[] | null = null; // non-null while capturing a `#### Dig deeper` block

  const flushDig = () => {
    // No-op when a `#### Dig deeper` precedes any `### Cn` heading (malformed note): nothing to attach to.
    if (current && digBuf) {
      const text = dedent(digBuf).trim();
      if (text) current.digDeeper = text;
    }
    digBuf = null;
  };

  for (let i = start + 1; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (/^##\s+/.test(line)) {
      flushDig();
      break; // next top-level section (e.g. ## Figures)
    }
    const head = line.match(/^###\s+(C\d+)\s*[—–-]\s*(.+)$/);
    if (head) {
      flushDig();
      if (current) concepts.push(current);
      current = { label: head[1], name: head[2].trim(), explanation: '', whyItMatters: '' };
      continue;
    }
    if (/^####\s+dig deeper/i.test(line)) {
      flushDig();
      digBuf = []; // start capturing the block body
      continue;
    }
    if (/^####\s+/.test(line)) {
      flushDig(); // any other sub-heading ends a Dig-deeper capture
      continue;
    }
    if (digBuf) {
      digBuf.push(raw); // inside Dig deeper: keep RAW markdown (blank lines, lists, bold)
      continue;
    }

    if (!current) continue;
    if (/^-\s*\*\*Explanation:\*\*/i.test(line)) current.explanation = bulletValue(line) ?? '';
    else if (/^-\s*\*\*Why it matters:\*\*/i.test(line)) current.whyItMatters = bulletValue(line) ?? '';
    else if (/^-\s*\*\*Check:\*\*/i.test(line)) {
      const val = bulletValue(line) ?? '';
      const split = val.split(/\s*[—–-]\s*\*\*Ideal answer:\*\*\s*/i);
      current.check = { question: split[0].trim(), idealAnswer: (split[1] ?? '').trim() };
    } else if (/^-\s*\*\*Misconception:\*\*/i.test(line)) current.misconception = bulletValue(line);
    else if (/^-\s*\*\*Application:\*\*/i.test(line)) current.application = bulletValue(line);
  }
  flushDig();
  if (current) concepts.push(current);
  return concepts;
}

function parseFigures(lines: string[]): FigureRef[] {
  const out: FigureRef[] = [];
  let inFence = false;
  for (const raw of sectionLines(lines, /^##\s+figures/i)) {
    let line = raw.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!line.startsWith('-')) continue;
    if (/^-\s*\(none\)/i.test(line)) continue;
    // Optional trailing pipe-delimited tag: `… | concept: <name>` marks a figure to
    // extract from the book and embed inline next to that concept. Split it off first.
    let concept: string | undefined;
    const pipe = line.indexOf(' | ');
    if (pipe !== -1) {
      const tag = line.slice(pipe + 3);
      const cm = tag.match(/concept:\s*(.+?)\s*$/i);
      if (cm) concept = cm[1].trim();
      line = line.slice(0, pipe).trim();
    }
    // - **Figure 1.1** — p. 16 — "caption text"
    const m = line.match(/^-\s*\*\*(.+?)\*\*\s*[—–-]\s*([^—–]+?)\s*[—–-]\s*"?(.+?)"?\s*$/);
    if (m) {
      out.push({ label: m[1].trim(), location: m[2].trim(), caption: m[3].trim(), concept });
      continue;
    }
    // Fallback: label + remainder (no clear caption split)
    const m2 = line.match(/^-\s*\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (m2) out.push({ label: m2[1].trim(), location: m2[2].trim(), caption: '', concept });
  }
  return out;
}

const EDGE_KINDS: readonly FigureEdgeKind[] = [
  'normal',
  'strong',
  'weak',
  'bridge',
  'new',
  'dim',
  'positive',
  'negative',
];

/** `id`, `id@2`, or `id@2:Label` → a node spec. */
function parseNodeToken(tok: string): FigureNodeSpec | null {
  const m = tok.trim().match(/^(\w+)(?:@(\d+))?(?::(.+))?$/);
  if (!m) return null;
  const spec: FigureNodeSpec = { id: m[1] };
  if (m[2] !== undefined) spec.group = Number(m[2]);
  if (m[3] !== undefined) spec.label = m[3].trim();
  return spec;
}

/** `A-B`, `A-B strong`, `5-7 bridge (25)`, `A-B (S)` → an edge spec. */
function parseEdgeToken(tok: string): FigureEdgeSpec | null {
  const m = tok
    .trim()
    .match(
      /^(\w+)\s*-\s*(\w+)(?:\s+(normal|strong|weak|bridge|new|dim|positive|negative))?(?:\s*\(([^)]+)\))?$/,
    );
  if (!m) return null;
  const spec: FigureEdgeSpec = { source: m[1], target: m[2] };
  if (m[3] && (EDGE_KINDS as readonly string[]).includes(m[3])) spec.kind = m[3] as FigureEdgeKind;
  if (m[4]) spec.label = m[4].trim();
  return spec;
}

/**
 * Parse the `## Visualizations` section. Each `### Title | concept: X | layout: Y`
 * block carries `caption:`, `note:`, `nodes:`, and `edges:` lines describing a small
 * graph the generator renders as an inline <GraphFigure>.
 */
function parseVisualizations(lines: string[]): GraphFigureSpec[] {
  const specs: GraphFigureSpec[] = [];
  let cur: GraphFigureSpec | null = null;
  for (const raw of sectionLines(lines, /^##\s+visualizations/i)) {
    const line = raw.trim();
    const head = line.match(/^###\s+(.+)$/);
    if (head) {
      if (cur) specs.push(cur);
      const parts = head[1].split('|').map((p) => p.trim());
      cur = { title: parts[0], nodes: [], edges: [] };
      for (const p of parts.slice(1)) {
        const cm = p.match(/^concept:\s*(.+)$/i);
        const lm = p.match(/^layout:\s*(force|circle)$/i);
        if (cm) cur.concept = cm[1].trim();
        else if (lm) cur.layout = lm[1].toLowerCase() as 'force' | 'circle';
      }
      continue;
    }
    if (!cur) continue;
    const cap = line.match(/^caption:\s*(.+)$/i);
    const note = line.match(/^note:\s*(.+)$/i);
    const nodes = line.match(/^nodes:\s*(.+)$/i);
    const edges = line.match(/^edges:\s*(.+)$/i);
    if (cap) cur.caption = cap[1].trim();
    else if (note) cur.note = note[1].trim();
    else if (nodes)
      cur.nodes = nodes[1]
        .split(',')
        .map(parseNodeToken)
        .filter((n): n is FigureNodeSpec => n !== null);
    else if (edges)
      cur.edges = edges[1]
        .split(',')
        .map(parseEdgeToken)
        .filter((e): e is FigureEdgeSpec => e !== null);
  }
  if (cur) specs.push(cur);
  return specs.filter((s) => s.nodes.length > 0);
}

export function parseLesson(markdown: string): ParsedLesson {
  const { body, chapter, title, sourceType, sourceRef } = parseFrontmatter(markdown);
  const lines = body.split('\n');
  return {
    chapter,
    title,
    sourceType,
    sourceRef,
    teachingArc: parseTeachingArc(lines),
    concepts: parseConcepts(lines),
    figures: parseFigures(lines),
    visualizations: parseVisualizations(lines),
    reviewItems: parseReviewItems(markdown, chapter).map((r) => ({
      id: r.id,
      concept: r.concept,
      question: r.question,
      answer: r.answer,
    })),
  };
}
