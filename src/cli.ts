// src/cli.ts
import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import slugify from 'slugify';
import { parseBook } from './parser/index.js';
import type { BookMetadata } from './parser/index.js';

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
        const content = `# ${chapter.chapterTitle}\n\n${chapter.content}`;
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

program.parse();
