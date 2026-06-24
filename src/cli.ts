// src/cli.ts
import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import slugify from 'slugify';
import { parseBook } from './parser/index.js';
import type { BookMetadata } from './parser/index.js';
import { cmdDue, cmdRecord, cmdAdvance, cmdShow } from './progress/commands.js';
import type { ChapterStatus } from './progress/types.js';
import { figuresFromPdf } from './figures/extract.js';
import { correctFigurePages } from './figures/fix.js';
import { extractMermaidBlocks } from './diagrams/extract.js';
import { parseMermaidGraph } from './diagrams/parse.js';
import { renderAdjacency } from './diagrams/render.js';
import {
  lintNodesAgainstText,
  exceedsNodeCap,
  MAX_GRAPH_NODES,
  lintEdgesAgainstText,
} from './diagrams/lint.js';
import { pdfPageText } from './pdf/text.js';
import { generateInteractiveBook } from './interactive/generate.js';
import { parseLesson } from './interactive/parse.js';
import { extractFigureImages, type FigureToExtract } from './figures/images.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseAllowlist, addToAllowlist, packageName } from './viz/allowlist.js';
import { lintSimSource } from './viz/lint.js';
import { checkConcepts } from './lessons/clarity.js';
import { runValidateConcepts } from './courses/concepts.js';
import { runAuthorScaffold } from './courses/scaffold.js';

const execFileAsync = promisify(execFile);
const VIZ_ALLOWLIST = path.join('interactive-book', 'viz-allowlist.json');

const program = new Command();

program
  .name('study-mate')
  .description('Parse PDF and EPUB books into structured chapters for Claude Code analysis');

program
  .command('parse <file>')
  .description('Parse a book file into raw chapters')
  .action(async (file: string) => {
    const absPath = path.resolve(file);

    if (!(await fs.pathExists(absPath))) {
      console.error(`Error: file not found: ${absPath}`);
      process.exit(1);
    }

    try {
      console.log(`Parsing ${path.basename(absPath)}...`);

      const result = await parseBook(absPath);
      const slug = slugify(result.info.title, { lower: true, strict: true });
      const outputDir = path.join('book-output', slug);
      const chaptersDir = path.join(outputDir, 'raw-chapters');

      await fs.ensureDir(chaptersDir);

      for (const chapter of result.chapters) {
        const filename = `chapter-${String(chapter.chapterNumber).padStart(2, '0')}.md`;
        const content =
          chapter.pageRange !== undefined && chapter.content === ''
            ? [
                `# ${chapter.chapterTitle}`,
                '',
                `> PDF source: pages ${chapter.pageRange.start}–${chapter.pageRange.end}`,
                `> Content read directly from PDF by book-analyst agent.`,
              ].join('\n')
            : `# ${chapter.chapterTitle}\n\n${chapter.content}`;
        await fs.writeFile(path.join(chaptersDir, filename), content, 'utf-8');
      }

      const metadata: BookMetadata = {
        slug,
        title: result.info.title,
        author: result.info.author,
        language: result.info.language,
        sourceFile: absPath,
        parsedAt: new Date().toISOString(),
        chapterCount: result.chapters.length,
        chapters: result.chapters.map((ch) => ({
          chapterNumber: ch.chapterNumber,
          chapterTitle: ch.chapterTitle,
          wordCount: ch.wordCount,
          file: `chapter-${String(ch.chapterNumber).padStart(2, '0')}.md`,
          ...(ch.pageRange !== undefined ? { pageRange: ch.pageRange } : {}),
        })),
      };

      await fs.writeJSON(path.join(outputDir, 'metadata.json'), metadata, {
        spaces: 2,
      });

      console.log(`\n✓ Parsed: "${result.info.title}" by ${result.info.author}`);
      console.log(`  Chapters: ${result.chapters.length}`);
      console.log(`  Output:   ${outputDir}/`);
      console.log(`\nNext step: /tutor-prep ${slug}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command('figures <pdf> <start> <end>')
  .description('List figure/table caption locations (exact PDF page numbers) in a page range')
  .action(async (pdf: string, start: string, end: string) => {
    const s = Number(start);
    const e = Number(end);
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < s) {
      console.error('Error: <start> and <end> must be positive integers with start <= end');
      process.exit(1);
    }
    const absPath = path.resolve(pdf);
    if (!(await fs.pathExists(absPath))) {
      console.error(`Error: file not found: ${absPath}`);
      process.exit(1);
    }
    const figs = await figuresFromPdf(absPath, s, e);
    if (figs.length === 0) {
      console.log('(none)');
      return;
    }
    for (const f of figs) console.log(`${f.label} | p.${f.page} | ${f.caption}`);
  });

program
  .command('figures-fix <note> <pdf> <start> <end>')
  .description("Rewrite a lesson note's figure/table page citations to match the authoritative extraction")
  .action(async (note: string, pdf: string, start: string, end: string) => {
    const s = Number(start);
    const e = Number(end);
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < s) {
      console.error('Error: <start> and <end> must be positive integers with start <= end');
      process.exit(1);
      return;
    }
    const noteAbs = path.resolve(note);
    const pdfAbs = path.resolve(pdf);
    if (!(await fs.pathExists(noteAbs))) {
      console.error(`Error: file not found: ${noteAbs}`);
      process.exit(1);
      return;
    }
    if (!(await fs.pathExists(pdfAbs))) {
      console.error(`Error: file not found: ${pdfAbs}`);
      process.exit(1);
      return;
    }
    const md = await fs.readFile(noteAbs, 'utf-8');
    const figs = await figuresFromPdf(pdfAbs, s, e);
    const { text, fixes, normalized, unverified } = correctFigurePages(md, figs);
    if (text !== md) await fs.writeFile(noteAbs, text, 'utf-8');
    const parts: string[] = [];
    if (fixes.length > 0) {
      const fixStr = fixes.map((f) => `${f.label} p.${f.from}→p.${f.to}`).join(', ');
      parts.push(`${fixes.length} page(s) corrected (${fixStr})`);
    }
    if (normalized.length > 0) parts.push(`${normalized.length} hedge(s) normalized`);
    if (unverified.length > 0) parts.push(`${unverified.length} unverified (${unverified.join(', ')})`);
    if (parts.length === 0) {
      console.log(`✓ all figure/table page citations already correct (${figs.length} known)`);
    } else {
      console.log(`✓ figures-fix: ${parts.join('; ')}`);
    }
  });

const diagramsCmd = program
  .command('diagrams')
  .description('Render or lint grounded diagrams embedded in a lesson note');

diagramsCmd
  .command('render <note>')
  .description('Print each mermaid block in a lesson note as a terminal adjacency view')
  .action(async (note: string) => {
    const abs = path.resolve(note);
    if (!(await fs.pathExists(abs))) {
      console.error(`Error: file not found: ${abs}`);
      process.exit(1);
      return;
    }
    const md = await fs.readFile(abs, 'utf-8');
    const blocks = extractMermaidBlocks(md);
    if (blocks.length === 0) {
      console.log('(no mermaid diagrams)');
      return;
    }
    blocks.forEach((block, i) => {
      if (i > 0) console.log('');
      console.log(renderAdjacency(parseMermaidGraph(block)));
    });
  });

diagramsCmd
  .command('lint <note> <pdf> <start> <end>')
  .description('Verify each mermaid block\'s node labels and edges are grounded in the chapter text and within the node cap')
  .action(async (note: string, pdf: string, start: string, end: string) => {
    const s = Number(start);
    const e = Number(end);
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < s) {
      console.error('Error: <start> and <end> must be positive integers with start <= end');
      process.exit(1);
      return;
    }
    const noteAbs = path.resolve(note);
    const pdfAbs = path.resolve(pdf);
    if (!(await fs.pathExists(noteAbs))) {
      console.error(`Error: file not found: ${noteAbs}`);
      process.exit(1);
      return;
    }
    if (!(await fs.pathExists(pdfAbs))) {
      console.error(`Error: file not found: ${pdfAbs}`);
      process.exit(1);
      return;
    }
    const md = await fs.readFile(noteAbs, 'utf-8');
    const blocks = extractMermaidBlocks(md);
    if (blocks.length === 0) {
      console.log('✓ all diagram node labels and edges are grounded in the chapter text');
      return;
    }
    const text = await pdfPageText(pdfAbs, s, e);
    const offenders: string[] = [];
    const oversized: number[] = [];
    const ungroundedEdges: string[] = [];
    for (const block of blocks) {
      const graph = parseMermaidGraph(block);
      if (exceedsNodeCap(graph)) oversized.push(graph.nodes.length);
      offenders.push(...lintNodesAgainstText(graph, text).unknown);
      ungroundedEdges.push(...lintEdgesAgainstText(graph, text).ungrounded);
    }
    let failed = false;
    if (oversized.length > 0) {
      console.error(
        `✗ ${oversized.length} diagram(s) exceed the ${MAX_GRAPH_NODES}-node cap (sizes: ${oversized.join(', ')}) — a real/large network must be a location pointer, not an inline graph`,
      );
      failed = true;
    }
    if (offenders.length > 0) {
      console.error(
        `✗ ungrounded node labels (not found in chapter text): ${[...new Set(offenders)].join(', ')}`,
      );
      failed = true;
    }
    if (ungroundedEdges.length > 0) {
      console.error(
        `✗ ungrounded edges (not stated in chapter prose): ${[...new Set(ungroundedEdges)].join(', ')}`,
      );
      failed = true;
    }
    if (failed) {
      process.exit(1);
      return;
    }
    console.log('✓ all diagram node labels and edges are grounded in the chapter text');
  });

const today = () => new Date().toISOString().slice(0, 10);
const progressCmd = program.command('progress').description('Tutor progress & spaced-repetition state');

progressCmd
  .command('due <slug>')
  .description('List review items due today (JSON)')
  .action(async (slug: string) => {
    console.log(JSON.stringify(await cmdDue(slug, today()), null, 2));
  });

progressCmd
  .command('record <slug>')
  .requiredOption('--id <id>', 'review item id')
  .requiredOption('--result <result>', 'pass | fail')
  .action(async (slug: string, opts: { id: string; result: string }) => {
    if (opts.result !== 'pass' && opts.result !== 'fail') {
      console.error('Error: --result must be "pass" or "fail"');
      process.exit(1);
    }
    await cmdRecord(slug, opts.id, opts.result, today());
    console.log(`✓ recorded ${opts.result} for ${opts.id}`);
  });

progressCmd
  .command('advance <slug>')
  .requiredOption('--chapter <n>', 'chapter number')
  .requiredOption('--status <status>', 'not_started | in_progress | mastered')
  .option('--gaps <gaps>', 'semicolon-separated gap notes', '')
  .action(async (slug: string, opts: { chapter: string; status: string; gaps: string }) => {
    const allowed = ['not_started', 'in_progress', 'mastered'];
    if (!allowed.includes(opts.status)) {
      console.error(`Error: --status must be one of ${allowed.join(', ')}`);
      process.exit(1);
    }
    const chapterNum = Number(opts.chapter);
    if (!Number.isInteger(chapterNum) || chapterNum < 1) {
      console.error('Error: --chapter must be a positive integer');
      process.exit(1);
    }
    const gaps = opts.gaps ? opts.gaps.split(';').map((s) => s.trim()).filter(Boolean) : [];
    await cmdAdvance(slug, chapterNum, opts.status as ChapterStatus, gaps, today());
    console.log(`✓ advanced ${slug} chapter ${opts.chapter} → ${opts.status}`);
  });

progressCmd
  .command('show <slug>')
  .description('Human-readable progress')
  .action(async (slug: string) => {
    console.log(await cmdShow(slug));
  });

program
  .command('extract-figures <slug>')
  .description(
    "Extract real book figures (tagged with `| concept:` in lesson notes) from the source PDF into book-output/<slug>/figures/ for inline embedding",
  )
  .action(async (slug: string) => {
    const metaPath = path.join('book-output', slug, 'metadata.json');
    if (!(await fs.pathExists(metaPath))) {
      console.error(`Error: metadata not found: ${metaPath} — run "study-mate parse" first`);
      process.exit(1);
      return;
    }
    const meta: BookMetadata = await fs.readJson(metaPath);
    if (meta.sourceFile.toLowerCase().endsWith('.epub') || !(await fs.pathExists(meta.sourceFile))) {
      console.error(
        `Error: figure extraction needs the source PDF (${meta.sourceFile}); not found or not a PDF`,
      );
      process.exit(1);
      return;
    }
    const lessonsDir = path.join('book-output', slug, 'lessons');

    // Collect every `| concept:`-tagged figure across prepared chapters, resolving
    // each to its authoritative page via the deterministic figures extractor.
    const wanted = new Map<string, FigureToExtract>();
    let chaptersScanned = 0;
    for (const ch of meta.chapters) {
      if (ch.chapterNumber <= 0 || ch.pageRange === undefined) continue;
      const lessonPath = path.join(lessonsDir, ch.file.replace(/\.md$/, '-lesson.md'));
      if (!(await fs.pathExists(lessonPath))) continue;
      const lesson = parseLesson(await fs.readFile(lessonPath, 'utf-8'));
      const tagged = lesson.figures.filter((f) => f.concept && /^figure/i.test(f.label));
      if (tagged.length === 0) continue;
      chaptersScanned++;
      const locs = await figuresFromPdf(meta.sourceFile, ch.pageRange.start, ch.pageRange.end);
      const byLabel = new Map(locs.map((l) => [l.label, l]));
      for (const f of tagged) {
        if (wanted.has(f.label)) continue;
        const loc = byLabel.get(f.label);
        const page = loc?.page ?? Number(f.location.match(/p\.\s*(\d+)/i)?.[1] ?? NaN);
        if (!Number.isInteger(page)) {
          console.warn(`  ! ${f.label}: could not resolve a page — skipping`);
          continue;
        }
        wanted.set(f.label, { label: f.label, page, caption: loc?.caption ?? f.caption });
      }
    }

    if (wanted.size === 0) {
      console.log(
        'No `| concept:`-tagged figures found in lesson notes. Tag a figure line like:\n' +
          '  - **Figure 3.13** — p. 85 — "…" | concept: Graph Partitioning and Betweenness',
      );
      return;
    }

    const outDir = path.join('book-output', slug, 'figures');
    try {
      const manifest = await extractFigureImages(meta.sourceFile, outDir, [...wanted.values()]);
      await fs.writeJson(path.join(outDir, 'manifest.json'), manifest, { spaces: 1 });
      const ok = manifest.filter((m) => m.ok);
      const failed = manifest.filter((m) => !m.ok);
      console.log(`✓ Extracted ${ok.length}/${manifest.length} figures → ${outDir}/`);
      for (const f of failed) {
        if (!f.ok) console.log(`  ! ${f.label}: ${f.reason}`);
      }
      console.log(`\nNext: study-mate interactive ${slug}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command('interactive <slug>')
  .description('Generate the interactive Docusaurus book from a parsed book and its lesson notes')
  .action(async (slug: string) => {
    try {
      const result = await generateInteractiveBook(slug);
      console.log(`✓ Generated interactive book for "${slug}"`);
      console.log(`  Prepared chapters: ${result.prepared}/${result.total}`);
      if (result.skipped.length > 0) {
        console.log(`  Not yet prepped (no lesson note): ${result.skipped.join(', ')}`);
      }
      console.log(`  Pages written: ${result.written.length} → interactive-book/docs/${slug}/`);
      console.log(`\nNext: cd interactive-book && pnpm start`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command('add-viz-lib <pkg>')
  .description('Install a new sim library into interactive-book and add it to the viz allowlist')
  .action(async (pkg: string) => {
    const bare = packageName(pkg.replace(/@[^/]+$/, '')); // strip a trailing @version
    try {
      console.log(`Installing ${pkg} into interactive-book/ ...`);
      await execFileAsync('pnpm', ['add', pkg], { cwd: 'interactive-book', maxBuffer: 32 * 1024 * 1024 });
      const current = (await fs.pathExists(VIZ_ALLOWLIST))
        ? parseAllowlist(await fs.readFile(VIZ_ALLOWLIST, 'utf-8'))
        : [];
      const next = addToAllowlist(current, bare);
      await fs.writeJson(VIZ_ALLOWLIST, { allowed: next }, { spaces: 2 });
      console.log(`✓ added "${bare}" to the allowlist (${next.length} libs). Commit the lockfile + allowlist.`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command('lint-sims <slug>')
  .description('Lint generated sim components for off-allowlist imports and banned APIs')
  .action(async (slug: string) => {
    const simsDir = path.join('interactive-book', 'src', 'sims', slug);
    if (!(await fs.pathExists(simsDir))) {
      console.log(`No sims for "${slug}" (${simsDir} not found). Run /visualize ${slug} first.`);
      return;
    }
    const allow = (await fs.pathExists(VIZ_ALLOWLIST))
      ? parseAllowlist(await fs.readFile(VIZ_ALLOWLIST, 'utf-8'))
      : [];
    // Recursively collect .tsx sim files (chN/*.tsx).
    const files: string[] = [];
    for (const entry of await fs.readdir(simsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const sub = path.join(simsDir, entry.name);
        for (const f of await fs.readdir(sub)) if (f.endsWith('.tsx')) files.push(path.join(sub, f));
      }
    }
    let failed = 0;
    for (const file of files) {
      const r = lintSimSource(file, await fs.readFile(file, 'utf-8'), allow);
      if (!r.ok) {
        failed++;
        const reasons = [
          ...r.offendingImports.map((i) => `off-allowlist import "${i}"`),
          ...r.bannedApis.map((a) => `banned API "${a}"`),
          ...r.libMismatch,
        ];
        console.error(`✗ ${path.relative('interactive-book', file)} — ${reasons.join('; ')}`);
      }
    }
    if (failed > 0) {
      console.error(`\n${failed}/${files.length} sim(s) failed lint.`);
      process.exit(1);
    }
    console.log(`✓ ${files.length} sim(s) clean (imports on allowlist, no banned APIs).`);
  });

program
  .command('lint-lessons <slug>')
  .description('Clarity check: flag concepts missing/short "Dig deeper" blocks or using vague filler')
  .action(async (slug: string) => {
    const lessonsDir = path.join('book-output', slug, 'lessons');
    if (!(await fs.pathExists(lessonsDir))) {
      console.log(`No lessons for "${slug}" (${lessonsDir} not found). Run /tutor-prep ${slug} first.`);
      return;
    }
    const files = (await fs.readdir(lessonsDir)).filter((f) => f.endsWith('-lesson.md')).sort();
    let errors = 0;
    let warnings = 0;
    for (const file of files) {
      const lesson = parseLesson(await fs.readFile(path.join(lessonsDir, file), 'utf-8'));
      for (const f of checkConcepts(lesson.concepts)) {
        if (f.level === 'error') {
          errors++;
          console.error(`✗ ${file} — ${f.concept}: ${f.message}`);
        } else {
          warnings++;
          console.warn(`⚠ ${file} — ${f.concept}: ${f.message}`);
        }
      }
    }
    console.log(`\n${files.length} lesson(s): ${errors} error(s), ${warnings} warning(s).`);
    if (errors > 0) process.exit(1);
  });

program
  .command('validate-concepts <slug>')
  .description('Validate book-output/<slug>/concepts.csv is a connected dependency DAG')
  .action(async (slug: string) => {
    const { findings } = await runValidateConcepts(slug);
    const errors = findings.filter((f) => f.level === 'error');
    for (const f of findings) {
      console.log(`${f.level === 'error' ? '✗' : '⚠'} ${f.message}`);
    }
    if (errors.length === 0) {
      console.log('✓ concepts.csv is a valid DAG');
    } else {
      process.exit(1);
    }
  });

program
  .command('author-scaffold <slug>')
  .description('Build metadata.json from book-output/<slug>/course-spec.md + outline.md')
  .action(async (slug: string) => {
    try {
      const meta = await runAuthorScaffold(slug);
      console.log(`✓ wrote metadata.json (${meta.chapterCount} modules) for "${meta.title}"`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program.parseAsync().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
