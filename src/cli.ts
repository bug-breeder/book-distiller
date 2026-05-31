// src/cli.ts
import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import slugify from 'slugify';
import { parseBook } from './parser/index.js';
import type { BookMetadata } from './parser/index.js';
import { cmdDue, cmdRecord, cmdAdvance, cmdShow } from './progress/commands.js';
import type { ChapterStatus } from './progress/types.js';

const program = new Command();

program
  .name('book-distiller')
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
      console.log(`\nNext step: /summarize-book ${slug}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
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

program.parseAsync().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
