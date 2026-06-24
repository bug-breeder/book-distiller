// src/interactive/generate.ts
// Deterministically generate a Docusaurus interactive book from a parsed book's
// metadata + tutor lesson notes. No AI: a structural transform that anchors each
// book's AI-authored sim manifest to its concepts. Output → interactive-book/docs/<slug>/.
import path from 'node:path';
import fs from 'fs-extra';
import type { BookMetadata, ChapterIndex } from '../parser/types.js';
import type { FigureImage } from '../figures/images.js';
import { parseLesson } from './parse.js';
import type { Concept, FigureRef, GraphFigureSpec, ParsedLesson, SimEntry } from './types.js';

const SITE_DOCS = path.join('interactive-book', 'docs');
const SITE_STATIC = path.join('interactive-book', 'static');

type OkImage = Extract<FigureImage, { ok: true }>;

/** Per-chapter rendering context: figures, extracted book images, and sims. */
interface RenderCtx {
  slug: string;
  bookTitle: string;
  figures: GraphFigureSpec[];
  usedFigures: Set<GraphFigureSpec>;
  bookFigures: FigureRef[];
  usedBookFigures: Set<FigureRef>;
  imageByLabel: Map<string, OkImage>;
  /** Sims for this chapter, paired with their import identifier index. */
  sims: { entry: SimEntry; index: number }[];
  usedSims: Set<number>;
}

/** Escape prose for inline MDX (so `<`, `{` etc. are not parsed as JSX). */
function mdxText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

/** Quote prose as a JS string expression for a component prop: prop={jsStr(x)}. */
function jsStr(s: string): string {
  return JSON.stringify(s);
}

function baseName(chapter: ChapterIndex): string {
  return chapter.file.replace(/\.md$/, ''); // "chapter-01.md" -> "chapter-01"
}

function shortLabel(title: string): string {
  const m = title.match(/^Chapter\s+(\d+):\s*(.+)$/i);
  return m ? `${m[1]}. ${m[2]}` : title;
}

/** Render a created figure spec as an inline <GraphFigure>. Props go as JSON to dodge MDX escaping. */
function figureJsx(spec: GraphFigureSpec): string {
  const props: string[] = [`title={${jsStr(spec.title)}}`];
  if (spec.caption) props.push(`caption={${jsStr(spec.caption)}}`);
  if (spec.note) props.push(`note={${jsStr(spec.note)}}`);
  if (spec.layout) props.push(`layout={${jsStr(spec.layout)}}`);
  props.push(`nodes={${JSON.stringify(spec.nodes)}}`);
  props.push(`edges={${JSON.stringify(spec.edges)}}`);
  return `<GraphFigure ${props.join(' ')} />`;
}

/** Slug used for an extracted image file (mirrors scripts/extract_figures.py). */
function figureFileSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Render an extracted REAL book figure as an inline <BookFigure> image. */
function bookFigureJsx(ref: FigureRef, img: OkImage, ctx: RenderCtx): string {
  const src = `/figures/${ctx.slug}/${img.image}`;
  const props = [
    `src={${jsStr(src)}}`,
    `label={${jsStr(ref.label)}}`,
    `source={${jsStr(ctx.bookTitle)}}`,
  ];
  if (ref.caption) props.push(`caption={${jsStr(ref.caption)}}`);
  return `<BookFigure ${props.join(' ')} />`;
}

/** Book figures tagged for THIS concept that we successfully extracted, as <BookFigure> JSX. */
function bookFiguresForConcept(name: string, ctx: RenderCtx): string[] {
  const out: string[] = [];
  for (const f of ctx.bookFigures) {
    if (ctx.usedBookFigures.has(f)) continue;
    if (!f.concept || f.concept.toLowerCase().trim() !== name) continue;
    const img = ctx.imageByLabel.get(f.label);
    if (!img) continue; // tagged but not extracted (e.g. extract-figures not run)
    out.push(bookFigureJsx(f, img, ctx));
    ctx.usedBookFigures.add(f);
  }
  return out;
}

function renderConcept(concept: Concept, ctx: RenderCtx): string {
  const name = concept.name.toLowerCase().trim();
  const parts: string[] = [];
  parts.push(`## ${mdxText(concept.name)}`);
  if (concept.explanation) parts.push(mdxText(concept.explanation));

  // Show the figure(s) that illustrate this concept right after the explanation.
  // Figures use an exact concept-name match so "Triadic Closure" doesn't also grab
  // the figure authored for "Strong Triadic Closure Property".
  for (const f of ctx.figures) {
    if (ctx.usedFigures.has(f)) continue;
    if (f.concept && f.concept.toLowerCase().trim() === name) {
      parts.push(figureJsx(f));
      ctx.usedFigures.add(f);
    }
  }

  // Real book figures we couldn't recreate (karate club, charts, maps) — extracted
  // from the PDF and embedded inline next to the concept they illustrate.
  parts.push(...bookFiguresForConcept(name, ctx));

  // AI-authored sims anchored to this concept (exact concept-name match).
  for (const {entry, index} of ctx.sims) {
    if (ctx.usedSims.has(index)) continue;
    if (entry.concept.toLowerCase().trim() === name) {
      parts.push(`<SimHost meta={simMeta_${index}} component={Sim_${index}} />`);
      ctx.usedSims.add(index);
    }
  }

  // The "Dig deeper" disclosure (intuition + worked example). Emitted as MDX children
  // so its markdown renders; mdxText escapes < > { } so worked-example inequalities and
  // braces cannot break the build.
  if (concept.digDeeper) {
    parts.push(`<DigDeeper>\n\n${mdxText(concept.digDeeper)}\n\n</DigDeeper>`);
  }

  if (concept.whyItMatters) parts.push(`<Callout variant="why" text={${jsStr(concept.whyItMatters)}} />`);

  if (concept.check) {
    parts.push(`<Check question={${jsStr(concept.check.question)}} answer={${jsStr(concept.check.idealAnswer)}} />`);
  }
  if (concept.misconception) {
    parts.push(`<Callout variant="misconception" text={${jsStr(concept.misconception)}} />`);
  }
  if (concept.application) {
    parts.push(`<Callout variant="application" text={${jsStr(concept.application)}} />`);
  }
  return parts.join('\n\n');
}

export function renderChapter(
  lesson: ParsedLesson,
  chapter: ChapterIndex,
  slug: string,
  bookTitle: string,
  imageByLabel: Map<string, OkImage>,
  sims: SimEntry[],
): string {
  const base = baseName(chapter);
  const chapterSims = sims
    .filter((s) => s.chapter === chapter.chapterNumber)
    .map((entry, index) => ({entry, index}));
  const ctx: RenderCtx = {
    slug,
    bookTitle,
    figures: lesson.visualizations,
    usedFigures: new Set<GraphFigureSpec>(),
    bookFigures: lesson.figures.filter((f) => f.concept && imageByLabel.has(f.label)),
    usedBookFigures: new Set<FigureRef>(),
    imageByLabel,
    sims: chapterSims,
    usedSims: new Set<number>(),
  };

  const out: string[] = [];
  out.push(
    [
      '---',
      `id: ${base}`,
      `title: ${jsStr(chapter.chapterTitle)}`,
      `sidebar_label: ${jsStr(shortLabel(chapter.chapterTitle))}`,
      `sidebar_position: ${chapter.chapterNumber}`,
      '---',
    ].join('\n'),
  );
  out.push(`import reviews from './${base}.reviews.json';`);
  for (const {entry, index} of ctx.sims) {
    const spec = `@site/src/sims/${slug}/${entry.file.replace(/\.tsx$/, '')}`;
    out.push(`import Sim_${index}, { meta as simMeta_${index} } from '${spec}';`);
  }

  const srcLabel =
    lesson.sourceType === 'pdf'
      ? `PDF pages ${lesson.sourceRef}`
      : lesson.sourceType === 'authored'
        ? 'authored'
        : `source ${lesson.sourceRef}`;
  const figureCount = lesson.visualizations.length + ctx.bookFigures.length + ctx.sims.length;
  out.push(
    `> **Source:** ${mdxText(srcLabel)} · ${lesson.concepts.length} concepts · ${figureCount} figures · ${lesson.reviewItems.length} flashcards`,
  );

  // Teaching arc
  if (lesson.teachingArc.length > 0) {
    out.push('## What you’ll learn');
    const items = lesson.teachingArc.map((line) => {
      const [name, ...rest] = line.split(/\s+[—–]\s+/);
      const objective = rest.join(' — ');
      return objective
        ? `1. **${mdxText(name.trim())}** — ${mdxText(objective.trim())}`
        : `1. ${mdxText(line.trim())}`;
    });
    out.push(items.join('\n'));
  }

  // Concepts (with embedded figures + widgets)
  for (const concept of lesson.concepts) {
    out.push(renderConcept(concept, ctx));
  }

  // Anything that didn't anchor to a concept name still gets shown.
  const leftoverFigures = lesson.visualizations.filter((f) => !ctx.usedFigures.has(f));
  const leftoverBookFigures = ctx.bookFigures.filter((f) => !ctx.usedBookFigures.has(f));
  const leftoverSims = ctx.sims.filter((s) => !ctx.usedSims.has(s.index));
  if (leftoverFigures.length > 0 || leftoverBookFigures.length > 0 || leftoverSims.length > 0) {
    out.push('## Explore');
    for (const f of leftoverFigures) out.push(figureJsx(f));
    for (const f of leftoverBookFigures) {
      const img = ctx.imageByLabel.get(f.label);
      if (img) out.push(bookFigureJsx(f, img, ctx));
    }
    for (const {index} of leftoverSims) {
      out.push(`<SimHost meta={simMeta_${index}} component={Sim_${index}} />`);
    }
  }

  // Flashcards
  out.push('## Flashcards');
  out.push('Test yourself with active recall — read each prompt, answer in your head, then flip:');
  out.push('<Flashcards items={reviews} />');

  return out.join('\n\n') + '\n';
}

function renderBookIndex(meta: BookMetadata, preparedNumbers: Set<number>): string {
  const out: string[] = [];
  out.push(
    [
      '---',
      'id: index',
      `title: ${jsStr(meta.title)}`,
      `slug: /${meta.slug}`,
      'sidebar_label: Overview',
      'sidebar_position: 0',
      '---',
    ].join('\n'),
  );
  out.push(`# ${mdxText(meta.title)}`);
  if (meta.author && meta.author !== 'Unknown') out.push(`*by ${mdxText(meta.author)}*`);
  out.push(
    `This interactive edition turns the book into concept-by-concept lessons with live visualizations, comprehension checks, and flashcards. **${preparedNumbers.size} of ${meta.chapterCount} chapters** are prepared so far.`,
  );
  out.push('## Chapters');
  const lines = meta.chapters
    .filter((c) => c.chapterNumber > 0)
    .map((c) => {
      const label = shortLabel(c.chapterTitle);
      if (preparedNumbers.has(c.chapterNumber)) {
        // `.mdx` extension makes Docusaurus resolve this to the doc's URL.
        return `- [${mdxText(label)}](./${baseName(c)}.mdx) ✓`;
      }
      return `- ${mdxText(label)} — *not yet prepared*`;
    });
  out.push(lines.join('\n'));
  return out.join('\n\n') + '\n';
}

interface BookMeta {
  slug: string;
  title: string;
  author: string;
  prepared: number;
  total: number;
}

async function renderLanding(): Promise<string> {
  // Scan every generated book's _meta.json (a `_`-prefixed partial Docusaurus ignores).
  const books: BookMeta[] = [];
  if (await fs.pathExists(SITE_DOCS)) {
    for (const entry of await fs.readdir(SITE_DOCS, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const metaPath = path.join(SITE_DOCS, entry.name, '_meta.json');
      if (await fs.pathExists(metaPath)) books.push(await fs.readJson(metaPath));
    }
  }
  books.sort((a, b) => a.title.localeCompare(b.title));

  const out: string[] = [];
  out.push(
    ['---', 'id: intro', 'title: Study Mate', 'slug: /', 'sidebar_label: Home', 'sidebar_position: 0', '---'].join(
      '\n',
    ),
  );
  out.push('# Study Mate — Interactive Books');
  out.push(
    'Learn books in the browser instead of the terminal: every chapter is broken into concepts you can read, **interact with**, check your understanding of, and drill with flashcards.',
  );
  out.push('## Available books');
  if (books.length === 0) {
    out.push('_No books generated yet. Run `study-mate interactive <slug>`._');
  } else {
    out.push(
      books
        .map(
          (b) =>
            `- [${mdxText(b.title)}](/${b.slug})${b.author && b.author !== 'Unknown' ? ` — ${mdxText(b.author)}` : ''} · ${b.prepared} of ${b.total} chapters prepared`,
        )
        .join('\n'),
    );
  }
  return out.join('\n\n') + '\n';
}

export interface GenerateResult {
  written: string[];
  prepared: number;
  total: number;
  skipped: number[];
}

export async function generateInteractiveBook(slug: string): Promise<GenerateResult> {
  const metaPath = path.join('book-output', slug, 'metadata.json');
  if (!(await fs.pathExists(metaPath))) {
    throw new Error(`metadata not found: ${metaPath} — run "study-mate parse" first`);
  }
  const meta: BookMetadata = await fs.readJson(metaPath);
  const lessonsDir = path.join('book-output', slug, 'lessons');
  const bookDocs = path.join(SITE_DOCS, slug);
  await fs.ensureDir(bookDocs);

  // Load any extracted book-figure images (from `study-mate extract-figures <slug>`)
  // and copy the successful ones into Docusaurus static/ so <BookFigure> can serve them.
  const figuresDir = path.join('book-output', slug, 'figures');
  const manifestPath = path.join(figuresDir, 'manifest.json');
  const imageByLabel = new Map<string, OkImage>();
  if (await fs.pathExists(manifestPath)) {
    const manifest: FigureImage[] = await fs.readJson(manifestPath);
    const staticOut = path.join(SITE_STATIC, 'figures', slug);
    await fs.emptyDir(staticOut);
    for (const m of manifest) {
      if (!m.ok) continue;
      const srcImg = path.join(figuresDir, m.image);
      if (!(await fs.pathExists(srcImg))) continue;
      await fs.copy(srcImg, path.join(staticOut, m.image));
      imageByLabel.set(m.label, m);
    }
  }

  // Load AI-authored sims for this book (from /visualize), if any.
  let sims: SimEntry[] = [];
  const simManifestPath = path.join('interactive-book', 'src', 'sims', slug, 'manifest.json');
  if (await fs.pathExists(simManifestPath)) {
    const sm = (await fs.readJson(simManifestPath)) as { sims?: SimEntry[] };
    sims = Array.isArray(sm.sims) ? sm.sims : [];
  }

  const written: string[] = [];
  const preparedNumbers = new Set<number>();
  const skipped: number[] = [];

  for (const chapter of meta.chapters) {
    if (chapter.chapterNumber <= 0) continue;
    const base = baseName(chapter);
    const lessonPath = path.join(lessonsDir, `${base}-lesson.md`);
    if (!(await fs.pathExists(lessonPath))) {
      skipped.push(chapter.chapterNumber);
      continue;
    }
    const lesson = parseLesson(await fs.readFile(lessonPath, 'utf-8'));
    const mdx = renderChapter(lesson, chapter, slug, meta.title, imageByLabel, sims);
    const mdxPath = path.join(bookDocs, `${base}.mdx`);
    const reviewsPath = path.join(bookDocs, `${base}.reviews.json`);
    await fs.writeFile(mdxPath, mdx, 'utf-8');
    await fs.writeJson(reviewsPath, lesson.reviewItems, { spaces: 0 });
    written.push(mdxPath);
    preparedNumbers.add(chapter.chapterNumber);
  }

  // Book category, overview, and a partial _meta.json for the landing scan.
  await fs.writeJson(path.join(bookDocs, '_category_.json'), {
    label: meta.title,
    position: 1,
    collapsed: false,
  });
  await fs.writeFile(path.join(bookDocs, 'index.mdx'), renderBookIndex(meta, preparedNumbers), 'utf-8');
  await fs.writeJson(path.join(bookDocs, '_meta.json'), {
    slug: meta.slug,
    title: meta.title,
    author: meta.author,
    prepared: preparedNumbers.size,
    total: meta.chapterCount,
  } satisfies BookMeta);

  // Landing page (regenerated from all generated books).
  await fs.ensureDir(SITE_DOCS);
  await fs.writeFile(path.join(SITE_DOCS, 'intro.mdx'), await renderLanding(), 'utf-8');

  return { written, prepared: preparedNumbers.size, total: meta.chapterCount, skipped };
}
