# Book Distiller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code–native book parser + deep summary system: a TypeScript CLI for PDF/EPUB parsing, 5 skills, and a parallel subagent for per-chapter AI analysis.

**Architecture:** The Node.js/TypeScript CLI handles only deterministic file parsing (no AI). All AI work — summaries, practice exercises, quizzes — runs inside Claude Code via skills that dispatch the `book-analyst` subagent in parallel per chapter.

**Tech Stack:** TypeScript (strict, ESM, NodeNext), `pdf-parse`, `epub2`, `commander`, `fs-extra`, `slugify`, Vitest, Claude Code skills + subagents.

---

## File Map

**New files to create:**

| File | Responsibility |
|---|---|
| `package.json` | deps, scripts |
| `tsconfig.json` | strict TS, NodeNext ESM |
| `vitest.config.ts` | test discovery config |
| `.gitignore` | ignore book-output/, node_modules/, dist/ |
| `CLAUDE.md` | concise project instructions |
| `src/parser/types.ts` | shared TS types: Chapter, ParseResult, BookMetadata |
| `src/parser/chapter-splitter.ts` | regex/heuristic chapter boundary detection for PDFs |
| `src/parser/epub-parser.ts` | epub2-based EPUB → ParseResult |
| `src/parser/pdf-parser.ts` | pdf-parse-based PDF → ParseResult |
| `src/parser/index.ts` | `parseBook(filePath)` — detects format, delegates |
| `src/cli.ts` | Commander.js `parse` command only |
| `tests/chapter-splitter.test.ts` | unit tests for heading detection + page splitting |
| `tests/epub-parser.test.ts` | integration tests against Gutenberg EPUB fixture |
| `tests/pdf-parser.test.ts` | unit tests with mocked pdf-parse |
| `tests/fixtures/metamorphosis.epub` | Project Gutenberg fixture (downloaded once) |
| `.claude/agents/book-analyst.md` | read+write subagent for per-chapter analysis |
| `.claude/skills/parse-book/SKILL.md` | runs CLI parser, reports result |
| `.claude/skills/summarize-book/SKILL.md` | orchestrates parallel chapter agents |
| `.claude/skills/summarize-book/chapter-summary-template.md` | summary output structure |
| `.claude/skills/practice-book/SKILL.md` | orchestrates practice generation |
| `.claude/skills/practice-book/chapter-practice-template.md` | practice output structure |
| `.claude/skills/book-quiz/SKILL.md` | interactive AskUserQuestion quiz loop |
| `.claude/skills/book-status/SKILL.md` | scans book-output/ and prints status table |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "book-distiller",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "parse": "tsx src/cli.ts parse",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "epub2": "^3.0.2",
    "fs-extra": "^11.2.0",
    "pdf-parse": "^1.1.1",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts
git commit -m "chore: add project scaffold"
```

---

## Task 2: Shared Types

**Files:**
- Create: `src/parser/types.ts`

- [ ] **Step 1: Write types**

```typescript
// src/parser/types.ts

export interface Chapter {
  chapterNumber: number;
  chapterTitle: string;
  content: string;
  wordCount: number;
  pageRange?: { start: number; end: number };
}

export interface RawBookInfo {
  title: string;
  author: string;
  language: string;
  sourceFile: string;
}

export interface ParseResult {
  info: RawBookInfo;
  chapters: Chapter[];
}

export interface ChapterIndex {
  chapterNumber: number;
  chapterTitle: string;
  wordCount: number;
  file: string;
}

export interface BookMetadata {
  slug: string;
  title: string;
  author: string;
  language: string;
  sourceFile: string;
  parsedAt: string;
  chapterCount: number;
  chapters: ChapterIndex[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/parser/types.ts
git commit -m "feat: add shared parser types"
```

---

## Task 3: Chapter Splitter (TDD)

**Files:**
- Create: `tests/chapter-splitter.test.ts`
- Create: `src/parser/chapter-splitter.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/chapter-splitter.test.ts
import { describe, it, expect } from 'vitest';
import {
  detectChapterBoundaries,
  splitIntoChapters,
  splitByPageCount,
  countWords,
} from '../src/parser/chapter-splitter.js';

describe('countWords', () => {
  it('counts words in a simple string', () => {
    expect(countWords('hello world foo')).toBe(3);
  });

  it('handles extra whitespace', () => {
    expect(countWords('  spaces   between  ')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });
});

describe('detectChapterBoundaries', () => {
  it('detects "Chapter N" with arabic numerals', () => {
    const text = 'Intro text.\n\nChapter 1\n\nFirst content.\n\nChapter 2\n\nSecond content.';
    const b = detectChapterBoundaries(text);
    expect(b).toHaveLength(2);
    expect(b[0].title).toBe('Chapter 1');
    expect(b[1].title).toBe('Chapter 2');
  });

  it('detects "CHAPTER ONE" (all caps, English word)', () => {
    const text = 'CHAPTER ONE\n\nContent.\n\nCHAPTER TWO\n\nMore.';
    const b = detectChapterBoundaries(text);
    expect(b).toHaveLength(2);
  });

  it('detects "Chapter I" (roman numerals)', () => {
    const text = 'Chapter I\n\nContent.\n\nChapter II\n\nMore.';
    const b = detectChapterBoundaries(text);
    expect(b).toHaveLength(2);
    expect(b[0].title).toBe('Chapter I');
  });

  it('detects "Part I" and "Part 1" headings', () => {
    const text = 'Part I\n\nContent.\n\nPart II\n\nMore.';
    const b = detectChapterBoundaries(text);
    expect(b).toHaveLength(2);
  });

  it('detects chapter with subtitle after colon', () => {
    const text = 'Chapter 3: The Big Reveal\n\nContent here.';
    const b = detectChapterBoundaries(text);
    expect(b).toHaveLength(1);
    expect(b[0].title).toBe('Chapter 3: The Big Reveal');
  });

  it('does NOT match "Chapter" mentioned inline in a sentence', () => {
    const text = 'See Chapter 1 for details on this topic.\n\nChapter 2\n\nReal chapter.';
    const b = detectChapterBoundaries(text);
    // "See Chapter 1..." starts with "See", not "Chapter" → no match
    // "Chapter 2" is its own line → match
    expect(b).toHaveLength(1);
    expect(b[0].title).toBe('Chapter 2');
  });

  it('returns empty array when no headings found', () => {
    const text = 'Just plain text with no structure at all.';
    expect(detectChapterBoundaries(text)).toHaveLength(0);
  });
});

describe('splitIntoChapters', () => {
  it('splits text at detected boundaries', () => {
    const text = 'Preamble text.\n\nChapter 1\n\nFirst content here.\n\nChapter 2\n\nSecond content here.';
    const boundaries = detectChapterBoundaries(text);
    const chapters = splitIntoChapters(text, boundaries);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].chapterNumber).toBe(1);
    expect(chapters[0].chapterTitle).toBe('Chapter 1');
    expect(chapters[0].content).toContain('First content here.');
    expect(chapters[0].content).not.toContain('Chapter 1');
    expect(chapters[1].content).toContain('Second content here.');
  });

  it('assigns correct word counts', () => {
    const text = 'Chapter 1\n\nhello world foo bar';
    const boundaries = detectChapterBoundaries(text);
    const chapters = splitIntoChapters(text, boundaries);
    expect(chapters[0].wordCount).toBe(4);
  });
});

describe('splitByPageCount', () => {
  it('groups pages into chunks', () => {
    const pages = Array.from({ length: 45 }, (_, i) => `Page ${i + 1} content words here`);
    const chapters = splitByPageCount(pages, 20);
    expect(chapters).toHaveLength(3);
    expect(chapters[0].pageRange).toEqual({ start: 1, end: 20 });
    expect(chapters[1].pageRange).toEqual({ start: 21, end: 40 });
    expect(chapters[2].pageRange).toEqual({ start: 41, end: 45 });
  });

  it('infers title from first non-empty line', () => {
    const pages = ['\n\nThe Real Title\n\nBody content here'];
    const chapters = splitByPageCount(pages, 20);
    expect(chapters[0].chapterTitle).toBe('The Real Title');
  });

  it('handles fewer pages than pageSize', () => {
    const pages = ['Only page'];
    const chapters = splitByPageCount(pages, 20);
    expect(chapters).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npm test -- tests/chapter-splitter.test.ts
```

Expected: `Cannot find module '../src/parser/chapter-splitter.js'`

- [ ] **Step 3: Implement chapter-splitter.ts**

```typescript
// src/parser/chapter-splitter.ts
import type { Chapter } from './types.js';

// Covers digits, roman numerals I–L, English number words
const NUM_WORDS =
  'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty';
const ROMAN =
  'xl|xxxi{0,3}|xxx|xxi{0,3}|xx|xi{0,3}|ix|viii|vii|vi|iv|iii|ii|i';

const CHAPTER_HEADING_RE = new RegExp(
  `^(chapter|part|section)\\s+(\\d+|${ROMAN}|${NUM_WORDS})(\\s*[:\\-–—].*)?$`,
  'i'
);

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function detectChapterBoundaries(
  text: string
): { title: string; startIndex: number }[] {
  const boundaries: { title: string; startIndex: number }[] = [];
  let currentIndex = 0;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 120 && CHAPTER_HEADING_RE.test(trimmed)) {
      boundaries.push({ title: trimmed, startIndex: currentIndex });
    }
    currentIndex += line.length + 1; // +1 for the \n
  }

  return boundaries;
}

export function splitIntoChapters(
  text: string,
  boundaries: { title: string; startIndex: number }[]
): Chapter[] {
  return boundaries.map((boundary, i) => {
    const start = boundary.startIndex;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].startIndex : text.length;
    const raw = text.slice(start, end).trim();
    // Strip the heading line itself from content
    const newlinePos = raw.indexOf('\n');
    const content = newlinePos > -1 ? raw.slice(newlinePos).trim() : '';
    return {
      chapterNumber: i + 1,
      chapterTitle: boundary.title,
      content,
      wordCount: countWords(content),
    };
  });
}

export function splitByPageCount(pages: string[], pageSize = 20): Chapter[] {
  const chapters: Chapter[] = [];
  let chapterNum = 1;

  for (let i = 0; i < pages.length; i += pageSize) {
    const chunk = pages.slice(i, i + pageSize);
    const content = chunk.join('\n\n');
    const firstLine =
      content
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0) ?? `Chapter ${chapterNum}`;

    chapters.push({
      chapterNumber: chapterNum++,
      chapterTitle: firstLine.slice(0, 80),
      content,
      wordCount: countWords(content),
      pageRange: {
        start: i + 1,
        end: Math.min(i + pageSize, pages.length),
      },
    });
  }

  return chapters;
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npm test -- tests/chapter-splitter.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/parser/chapter-splitter.ts tests/chapter-splitter.test.ts
git commit -m "feat: add chapter splitter with TDD"
```

---

## Task 4: EPUB Parser (TDD)

**Files:**
- Create: `tests/fixtures/metamorphosis.epub` (downloaded)
- Create: `tests/epub-parser.test.ts`
- Create: `src/parser/epub-parser.ts`

- [ ] **Step 1: Download EPUB fixture**

```bash
mkdir -p tests/fixtures
curl -L -o tests/fixtures/metamorphosis.epub \
  "https://www.gutenberg.org/cache/epub/5200/pg5200.epub"
```

If this URL fails, go to https://www.gutenberg.org/ebooks/5200 and download any EPUB edition manually to `tests/fixtures/metamorphosis.epub`.

Verify: `ls -lh tests/fixtures/metamorphosis.epub` should show a file > 10KB.

- [ ] **Step 2: Write failing epub-parser tests**

```typescript
// tests/epub-parser.test.ts
import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseEpub } from '../src/parser/epub-parser.js';

const FIXTURE = fileURLToPath(
  new URL('./fixtures/metamorphosis.epub', import.meta.url)
);

describe('parseEpub', () => {
  it('extracts a non-empty title from metadata', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.info.title.length).toBeGreaterThan(0);
  });

  it('extracts a non-empty author from metadata', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.info.author.length).toBeGreaterThan(0);
  });

  it('extracts at least one chapter', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.chapters.length).toBeGreaterThan(0);
  });

  it('all chapters have non-empty content (skips nav/toc pages)', async () => {
    const result = await parseEpub(FIXTURE);
    for (const ch of result.chapters) {
      expect(ch.content.trim().length).toBeGreaterThan(100);
    }
  });

  it('all chapters have a positive word count', async () => {
    const result = await parseEpub(FIXTURE);
    for (const ch of result.chapters) {
      expect(ch.wordCount).toBeGreaterThan(0);
    }
  });

  it('chapter numbers are sequential starting at 1', async () => {
    const result = await parseEpub(FIXTURE);
    result.chapters.forEach((ch, i) => {
      expect(ch.chapterNumber).toBe(i + 1);
    });
  });

  it('sets sourceFile to the input path', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.info.sourceFile).toBe(FIXTURE);
  });
});
```

- [ ] **Step 3: Run tests — verify they FAIL**

```bash
npm test -- tests/epub-parser.test.ts
```

Expected: `Cannot find module '../src/parser/epub-parser.js'`

- [ ] **Step 4: Implement epub-parser.ts**

```typescript
// src/parser/epub-parser.ts
import epub from 'epub2';
import type { ParseResult, Chapter } from './types.js';
import { countWords } from './chapter-splitter.js';

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getChapterContent(book: epub, id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    book.getChapterRaw(id, (err: Error | null, text: string | null) => {
      if (err) reject(err);
      else resolve(text ?? '');
    });
  });
}

export async function parseEpub(filePath: string): Promise<ParseResult> {
  const book = await epub.createAsync(filePath);

  const title = (book.metadata.title as string) || 'Unknown Title';
  const author = (book.metadata.creator as string) || 'Unknown Author';
  const language = (book.metadata.language as string) || 'en';

  const chapters: Chapter[] = [];
  let chapterNum = 1;

  for (const item of book.flow as Array<{ id: string; title?: string }>) {
    if (!item.id) continue;
    try {
      const html = await getChapterContent(book, item.id);
      const text = stripHtml(html);
      if (text.length < 100) continue; // skip nav/toc/cover pages
      chapters.push({
        chapterNumber: chapterNum++,
        chapterTitle: item.title ?? `Chapter ${chapterNum - 1}`,
        content: text,
        wordCount: countWords(text),
      });
    } catch {
      // skip chapters that fail to load
    }
  }

  return {
    info: { title, author, language, sourceFile: filePath },
    chapters,
  };
}
```

- [ ] **Step 5: Run tests — verify they PASS**

```bash
npm test -- tests/epub-parser.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/metamorphosis.epub tests/epub-parser.test.ts src/parser/epub-parser.ts
git commit -m "feat: add EPUB parser with TDD"
```

---

## Task 5: PDF Parser (TDD)

**Files:**
- Create: `tests/pdf-parser.test.ts`
- Create: `src/parser/pdf-parser.ts`

- [ ] **Step 1: Write failing PDF parser tests**

Note: `pdf-parse` and `fs/promises` are mocked so no real PDF file is needed.

```typescript
// tests/pdf-parser.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parsePdf } from '../src/parser/pdf-parser.js';

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
  };
});

import pdfParse from 'pdf-parse';

const mockParse = vi.mocked(pdfParse);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parsePdf', () => {
  it('splits text at chapter headings when found', async () => {
    mockParse.mockResolvedValue({
      text: 'Chapter 1\n\nFirst chapter content with enough words.\n\nChapter 2\n\nSecond chapter content.',
      numpages: 4,
      info: { Title: 'My Book', Author: 'Jane Doe' },
    } as never);

    const result = await parsePdf('/fake/book.pdf');
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].chapterTitle).toMatch(/Chapter 1/i);
    expect(result.chapters[1].chapterTitle).toMatch(/Chapter 2/i);
  });

  it('uses title from PDF metadata', async () => {
    mockParse.mockResolvedValue({
      text: 'Chapter 1\n\nContent.',
      numpages: 2,
      info: { Title: 'Great Book', Author: 'John Smith' },
    } as never);

    const result = await parsePdf('/fake/book.pdf');
    expect(result.info.title).toBe('Great Book');
    expect(result.info.author).toBe('John Smith');
  });

  it('falls back to filename when PDF has no title metadata', async () => {
    mockParse.mockResolvedValue({
      text: 'Chapter 1\n\nContent.',
      numpages: 2,
      info: {},
    } as never);

    const result = await parsePdf('/fake/my-book.pdf');
    expect(result.info.title).toBe('my-book');
  });

  it('falls back to page-based splitting when no chapter headings found', async () => {
    const pages = Array.from({ length: 45 }, (_, i) => `Page ${i + 1} content`);
    mockParse.mockResolvedValue({
      text: pages.join('\f'),
      numpages: 45,
      info: {},
    } as never);

    const result = await parsePdf('/fake/no-headings.pdf');
    expect(result.chapters.length).toBeGreaterThan(1);
    // 45 pages / 20 per chapter = 3 chapters
    expect(result.chapters).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npm test -- tests/pdf-parser.test.ts
```

Expected: `Cannot find module '../src/parser/pdf-parser.js'`

- [ ] **Step 3: Implement pdf-parser.ts**

```typescript
// src/parser/pdf-parser.ts
import pdfParse from 'pdf-parse';
import { readFile } from 'fs/promises';
import path from 'path';
import type { ParseResult } from './types.js';
import {
  detectChapterBoundaries,
  splitIntoChapters,
  splitByPageCount,
} from './chapter-splitter.js';

export async function parsePdf(filePath: string): Promise<ParseResult> {
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);

  const info = data.info as Record<string, unknown>;
  const title =
    (info?.Title as string) ||
    path.basename(filePath, path.extname(filePath));
  const author = (info?.Author as string) || 'Unknown';

  const boundaries = detectChapterBoundaries(data.text);

  const chapters =
    boundaries.length >= 2
      ? splitIntoChapters(data.text, boundaries)
      : splitByPageCount(data.text.split('\f'), 20);

  return {
    info: {
      title,
      author,
      language: 'en',
      sourceFile: filePath,
    },
    chapters,
  };
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npm test -- tests/pdf-parser.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/pdf-parser.test.ts src/parser/pdf-parser.ts
git commit -m "feat: add PDF parser with TDD"
```

---

## Task 6: Parser Index

**Files:**
- Create: `src/parser/index.ts`

- [ ] **Step 1: Write index.ts**

```typescript
// src/parser/index.ts
import path from 'path';
import { parseEpub } from './epub-parser.js';
import { parsePdf } from './pdf-parser.js';

export type { ParseResult, Chapter, BookMetadata, ChapterIndex, RawBookInfo } from './types.js';

export async function parseBook(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.epub':
      return parseEpub(filePath);
    case '.pdf':
      return parsePdf(filePath);
    default:
      throw new Error(
        `Unsupported format: "${ext}". Supported: .epub, .pdf`
      );
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/parser/index.ts
git commit -m "feat: add parser index with format detection"
```

---

## Task 7: CLI

**Files:**
- Create: `src/cli.ts`

- [ ] **Step 1: Write cli.ts**

```typescript
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
      chapters: result.chapters.map((ch, i) => ({
        chapterNumber: ch.chapterNumber,
        chapterTitle: ch.chapterTitle,
        wordCount: ch.wordCount,
        file: `chapter-${String(i + 1).padStart(2, '0')}.md`,
      })),
    };

    await fs.writeJSON(path.join(outputDir, 'metadata.json'), metadata, {
      spaces: 2,
    });

    console.log(`\n✓ Parsed: "${result.info.title}" by ${result.info.author}`);
    console.log(`  Chapters: ${result.chapters.length}`);
    console.log(`  Output:   ${outputDir}/`);
    console.log(`\nNext step: /summarize-book ${slug}`);
  });

program.parse();
```

- [ ] **Step 2: Run a smoke test against the fixture EPUB**

```bash
npx tsx src/cli.ts parse tests/fixtures/metamorphosis.epub
```

Expected output (similar to):
```
Parsing metamorphosis.epub...

✓ Parsed: "Metamorphosis" by Franz Kafka
  Chapters: N
  Output:   book-output/metamorphosis/

Next step: /summarize-book metamorphosis
```

Verify: `ls book-output/metamorphosis/raw-chapters/` shows chapter files. `cat book-output/metamorphosis/metadata.json` shows valid JSON.

- [ ] **Step 3: Full test suite must still pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add CLI parse command"
```

---

## Task 8: Project Config Files

**Files:**
- Create: `CLAUDE.md`
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
book-output/
node_modules/
dist/
*.js.map
```

- [ ] **Step 2: Create CLAUDE.md**

```markdown
# Book Distiller

Parse PDF/EPUB books and generate deep summaries using Claude Code skills.

## Commands

- **Parse a book:** `npx tsx src/cli.ts parse <file.epub|pdf>`
- **Run tests:** `npm test`
- **Typecheck:** `npm run typecheck`

## Skills

| Skill | Purpose |
|---|---|
| `/parse-book <file>` | Parse a book file into raw chapters |
| `/summarize-book <slug>` | Generate deep chapter summaries (requires parsed book) |
| `/practice-book <slug> [N]` | Generate practice exercises per chapter |
| `/book-quiz <slug>` | Interactive quiz on a book's summaries |
| `/book-status` | Show all books and their completion status |

## Architecture

- **CLI (`src/cli.ts`):** Parse command only — no AI. Outputs to `book-output/<slug>/`.
- **Skills:** All AI work. Skills dispatch `book-analyst` subagents in parallel per chapter.
- **`book-output/`:** Git-ignored. Contains parsed chapters, summaries, practice files.

## Code Style

- TypeScript strict mode, ES modules, async/await
- Imports use `.js` extension (NodeNext resolution)
- No `any` — use explicit types or `unknown`
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md .gitignore
git commit -m "chore: add CLAUDE.md and .gitignore"
```

---

## Task 9: book-analyst Subagent

**Files:**
- Create: `.claude/agents/book-analyst.md`

- [ ] **Step 1: Create the subagent file**

```bash
mkdir -p .claude/agents
```

```markdown
---
name: book-analyst
description: Analyzes a single book chapter and writes deep summaries or practice exercises to disk. Delegate here for per-chapter content generation.
tools: Read, Write, Bash
model: sonnet
effort: high
color: cyan
---

You are a specialist in literary analysis, concept extraction, and educational content creation. Your sole purpose is to analyze one book chapter and produce high-quality output.

## What you receive

Each delegation message contains:
- **Analyze:** path to the raw chapter markdown file
- **Write to:** path where you must write the output file
- **Book:** title and author
- **Chapter title:** the chapter's title
- **Task:** either `summary` or `practice`
- **Template:** the exact structure to follow

## How to proceed

1. Read the chapter file at the path given in "Analyze:"
2. Read it thoroughly — understand every concept, argument, and example
3. Ensure the output directory exists: `mkdir -p <parent-directory-of-output-path>`
4. Generate output that strictly and completely follows the provided template
5. Write the output to the path given in "Write to:" using the Write tool
6. Respond with ONLY this one line: `✓ <output-filename> done (word count: NNNN)`

Do not write anything else. Do not explain. Just the confirmation line.

## Quality standard

Your output must be deep enough that someone who reads ONLY your output can:
- Understand the core concepts as if they read the chapter
- Remember the key ideas months later
- Explain the concepts to someone else
- Apply the knowledge in real situations

"This chapter discusses X" is a failure. Go deep on mechanisms, the author's reasoning, concrete examples, and real-world implications. Depth over brevity — these summaries are meant to replace re-reading.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/book-analyst.md
git commit -m "feat: add book-analyst subagent"
```

---

## Task 10: parse-book Skill

**Files:**
- Create: `.claude/skills/parse-book/SKILL.md`

- [ ] **Step 1: Create the skill**

```bash
mkdir -p .claude/skills/parse-book
```

```markdown
---
name: parse-book
description: Parse a PDF or EPUB book into raw chapters. Run before summarizing.
disable-model-invocation: true
argument-hint: <path/to/book.epub|pdf>
allowed-tools: Bash Read
---

Parse the book at: $ARGUMENTS

## Steps

1. **Check the file exists**
   If `$ARGUMENTS` is empty or the file doesn't exist, tell the user:
   "Usage: /parse-book <path/to/book.epub|pdf>"

2. **Run the parser**
   ```bash
   npx tsx src/cli.ts parse $ARGUMENTS
   ```
   If it fails, report the error and suggest checking: file path, file extension (.epub or .pdf), and that `npm install` has been run.

3. **Read the generated metadata**
   The slug is derived from the book title (lowercase, hyphens). Read:
   `book-output/<slug>/metadata.json`

4. **Report a clean summary**
   Show:
   - Title and author
   - Number of chapters with a numbered list of their titles
   - Output location (`book-output/<slug>/`)
   - Next step: `/summarize-book <slug>`
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/parse-book/SKILL.md
git commit -m "feat: add parse-book skill"
```

---

## Task 11: summarize-book Skill + Template

**Files:**
- Create: `.claude/skills/summarize-book/chapter-summary-template.md`
- Create: `.claude/skills/summarize-book/SKILL.md`

- [ ] **Step 1: Create the summary template**

```bash
mkdir -p .claude/skills/summarize-book
```

Create `.claude/skills/summarize-book/chapter-summary-template.md`:

````markdown
# Chapter [N]: [Title]

## 🧠 Core Thesis
The single most important idea of this chapter in 1-2 sentences. State it boldly and precisely.

## 📖 Detailed Breakdown

For each major concept or argument in the chapter, write a subsection:

### [Concept Name]
- **What it is:** Clear explanation in plain language — no jargon without definition.
- **Why it matters:** Why the author included this; what problem it solves.
- **How it works:** The mechanism, process, or logic explained step by step.
- **Key quote or example:** The most memorable illustration from the text (quote directly if possible).
- **Connection:** How this links to other concepts in the book.

(Repeat this block for every significant concept in the chapter.)

## 🔑 Key Takeaways
5–10 distilled takeaways. Each one should be actionable, memorable, or surprising. Write them as statements, not questions.

## 🗺️ Mental Model / Framework
A conceptual framework, analogy, or mental model that captures the chapter's core logic. This could be a decision tree described in text, a metaphor, or a before/after comparison.

## 💡 "Aha!" Moments
2–3 insights that are counterintuitive, surprising, or that reframe how you think about something. These are the moments that would make someone say "I never thought of it that way."

## 🔗 Connections to Other Chapters
How this chapter builds on previous ones and sets up ideas that come later. Be specific about which concepts carry forward.

## 📝 In My Own Words (ELI5)
Explain the entire chapter as if teaching a smart 12-year-old. Use analogies. Avoid jargon. This section forces total clarity.
````

- [ ] **Step 2: Create the summarize-book skill**

Create `.claude/skills/summarize-book/SKILL.md`:

```markdown
---
name: summarize-book
description: Generate deep chapter summaries and full-book summary. Requires parsed book.
disable-model-invocation: true
effort: high
argument-hint: <book-slug>
allowed-tools: Read Write Agent
---

ultrathink

Generate deep summaries for the book with slug: **$ARGUMENTS**

## Steps

### 1. Validate input
Read `book-output/$ARGUMENTS/metadata.json`.
If it doesn't exist: tell the user to run `/parse-book` first and stop.

### 2. Load the summary template
Read `${CLAUDE_SKILL_DIR}/chapter-summary-template.md`.
You will embed its full contents in every delegation message.

### 3. Create output directory
Ensure `book-output/$ARGUMENTS/summaries/` exists.

### 4. Dispatch all chapter agents IN PARALLEL
For EVERY chapter in the metadata, dispatch a `book-analyst` subagent using the Agent tool.
**Launch all agents simultaneously** — do not wait for one before starting the next.

Each delegation message must be exactly:
```
Analyze: book-output/$ARGUMENTS/raw-chapters/<chapter.file>
Write to: book-output/$ARGUMENTS/summaries/<chapter-slug>-summary.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: summary

Template:
<full contents of chapter-summary-template.md>
```

Where `<chapter-slug>` = the chapter file name with `-summary` appended (e.g. `chapter-03.md` → `chapter-03-summary.md`).

### 5. Generate full-book summary
After ALL chapter agents confirm completion, read every `chapter-XX-summary.md` file and write `book-output/$ARGUMENTS/summaries/full-book-summary.md` with this structure:

```markdown
# [Book Title] — Full Book Summary
**Author:** [Author] | **Chapters:** [N]

## Book Thesis
[3 sentences that capture the book's central argument and why it matters]

## Chapter-by-Chapter Summaries
[One paragraph per chapter — synthesize the Core Thesis from each chapter summary]

## Core Argument Arc
[How the ideas build across the book — what changes from beginning to end, and why the order matters]

## 10 Most Important Ideas
[Numbered list of the 10 most valuable insights from the entire book]

## Who Should Read This and Why
[Specific audience + specific reason — not generic "anyone interested in X"]

## What the Book Does NOT Cover
[Honest assessment of blind spots, outdated ideas, or topics the author avoids]
```

### 6. Report completion
List all generated files and suggest: "Next step: `/practice-book $ARGUMENTS`"
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/summarize-book/
git commit -m "feat: add summarize-book skill and summary template"
```

---

## Task 12: practice-book Skill + Template

**Files:**
- Create: `.claude/skills/practice-book/chapter-practice-template.md`
- Create: `.claude/skills/practice-book/SKILL.md`

- [ ] **Step 1: Create the practice template**

```bash
mkdir -p .claude/skills/practice-book
```

Create `.claude/skills/practice-book/chapter-practice-template.md`:

````markdown
# Practice Exercises: Chapter [N] — [Title]

## 🧪 Comprehension Check

Write 5 conceptual questions that test deep understanding — not trivia or recall. Each question should require the reader to explain, connect, or apply a concept.

For each question:
**Q[N]:** [Question text]
<details>
<summary>Answer</summary>

[Detailed answer — 2-5 sentences explaining the concept thoroughly]

</details>

---

## 🔄 Apply It

Write 3 realistic scenarios where the reader must apply this chapter's knowledge.

**Scenario [N]: [Brief title]**
[2-3 sentence scenario description — make it specific and plausible]

*What should you consider?*
[2-3 bullet points guiding the reader's thinking]

<details>
<summary>Model Response</summary>

[A thorough model answer showing how to apply the chapter's concepts]

</details>

---

## ✍️ Reflection Prompts

3 open-ended questions that force the reader to connect the material to their own life or work. Format: "Think of a time when [X]... What would you do differently now that you understand [concept]?"

1. [Prompt 1]
2. [Prompt 2]
3. [Prompt 3]

---

## 🗣️ Teach It Back (Feynman Technique)

**Prompt:** Explain [pick the most important concept from this chapter] in exactly 3 sentences to someone who has never encountered this idea before.

<details>
<summary>Model Explanation</summary>

[An ideal 3-sentence explanation of the concept — clear, jargon-free, accurate]

</details>

---

## 🧩 Synthesis Challenge

Design one exercise that requires combining knowledge from this chapter with a concept from a PREVIOUS chapter. State which chapters are involved.

**Exercise:** [Exercise description]

**Chapters involved:** Chapter [N] + Chapter [M]

---

## 📋 Action Items

3 concrete, specific things the reader can do THIS WEEK to begin applying the chapter's lessons. Be specific — not "read more about X" but "do Y on Monday morning before checking email."

1. [Action 1]
2. [Action 2]
3. [Action 3]
````

- [ ] **Step 2: Create the practice-book skill**

Create `.claude/skills/practice-book/SKILL.md`:

```markdown
---
name: practice-book
description: Generate practice exercises per chapter. Optional chapter number targets one chapter.
disable-model-invocation: true
effort: high
argument-hint: <book-slug> [chapter-number]
allowed-tools: Read Write Agent
---

ultrathink

Generate practice exercises for: **$ARGUMENTS**

`$0` is the book slug. `$1` (optional) is a chapter number — if provided, process only that chapter.

## Steps

### 1. Validate input
Read `book-output/$0/metadata.json`.
If it doesn't exist: tell the user to run `/parse-book $0` first and stop.

### 2. Load the practice template
Read `${CLAUDE_SKILL_DIR}/chapter-practice-template.md`.
Embed its full contents in every delegation message.

### 3. Determine chapters to process
- If `$1` is provided: process only the chapter where `chapterNumber == $1`
- Otherwise: process ALL chapters

### 4. Create output directory
Ensure `book-output/$0/practice/` exists.

### 5. Dispatch chapter agents IN PARALLEL
For each chapter to process, dispatch a `book-analyst` subagent using the Agent tool.
**Launch all simultaneously.**

Each delegation message:
```
Analyze: book-output/$0/raw-chapters/<chapter.file>
Write to: book-output/$0/practice/<chapter-slug>-practice.md
Book: "<metadata.title>" by <metadata.author>
Chapter title: <chapter.chapterTitle>
Task: practice

Template:
<full contents of chapter-practice-template.md>
```

### 6. Generate full-book practice (ONLY if processing ALL chapters)
After all agents complete, write `book-output/$0/practice/full-book-practice.md`:

```markdown
# [Book Title] — Full Book Practice

## Comprehensive Quiz (10 Questions)
[10 questions drawn from across all chapters, each with an answer in <details>]

## Capstone Scenarios (3)
[3 complex real-world scenarios requiring synthesis of knowledge from multiple chapters]

## 30-Day Implementation Plan
**Week 1:** [Specific daily actions]
**Week 2:** [Specific daily actions]
**Week 3:** [Specific daily actions]
**Week 4:** [Specific daily actions]
```

### 7. Report completion
List all generated files. Suggest: `/book-quiz $0` for interactive review.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/practice-book/
git commit -m "feat: add practice-book skill and practice template"
```

---

## Task 13: book-quiz Skill

**Files:**
- Create: `.claude/skills/book-quiz/SKILL.md`

- [ ] **Step 1: Create the skill**

```bash
mkdir -p .claude/skills/book-quiz
```

```markdown
---
name: book-quiz
description: Interactive quiz on a book's summaries using AskUserQuestion. Tracks score and gives feedback.
disable-model-invocation: true
argument-hint: <book-slug>
allowed-tools: Read
---

Run an interactive quiz for the book with slug: **$ARGUMENTS**

## Steps

### 1. Load summaries
Read `book-output/$ARGUMENTS/metadata.json`.
Read all `book-output/$ARGUMENTS/summaries/chapter-XX-summary.md` files.
If summaries don't exist: tell the user to run `/summarize-book $ARGUMENTS` first and stop.

### 2. Generate 10 quiz questions
From the summaries, generate exactly 10 conceptual questions. Rules:
- No trivia ("In which chapter does the author mention X?")
- Each question requires explanation, reasoning, or application
- Cover at least 6 different chapters
- Mix question types: "Explain...", "Why does...", "How would you apply...", "What's the difference between..."
- Prepare an ideal answer for each before starting

### 3. Run the quiz loop
For each question (1 through 10), use AskUserQuestion:

Prompt format:
```
**Question N/10** (Chapter [X]: [Chapter Title])

[Question text]

(Running score: [current]/[questions answered so far])
```

After receiving the answer:
- Score: **1 point** = correct or substantially correct | **0.5 points** = partially correct | **0 points** = incorrect/missing
- Give feedback in 2-4 sentences: what was right, what was missing, the complete correct answer
- Then immediately ask the next question

### 4. Final report
After all 10 questions:

```
**Quiz complete!**
Final score: [X]/10

**Strong chapters:** [list chapters where they scored well]
**Review these chapters:** [list chapters where they struggled]

Suggested next step: Re-read the summaries for [chapters] and run /book-quiz $ARGUMENTS again.
```
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/book-quiz/SKILL.md
git commit -m "feat: add book-quiz skill"
```

---

## Task 14: book-status Skill

**Files:**
- Create: `.claude/skills/book-status/SKILL.md`

- [ ] **Step 1: Create the skill**

```bash
mkdir -p .claude/skills/book-status
```

```markdown
---
name: book-status
description: Show all parsed books and their summarization/practice completion status.
disable-model-invocation: true
allowed-tools: Bash Read Glob
---

Show the status of all books in `book-output/`.

## Steps

### 1. Check if book-output/ exists
If `book-output/` doesn't exist or is empty:
> "No books have been parsed yet. Run `/parse-book <file>` to get started."
Stop.

### 2. Discover all books
List all subdirectories in `book-output/`. Each is a book slug.

### 3. For each book, collect status
- Read `book-output/<slug>/metadata.json` → title, author, chapterCount
- Raw chapters: count `.md` files in `book-output/<slug>/raw-chapters/`
- Summaries: count `chapter-XX-summary.md` files in `book-output/<slug>/summaries/`; check if `full-book-summary.md` exists
- Practice: count `chapter-XX-practice.md` files in `book-output/<slug>/practice/`; check if `full-book-practice.md` exists

### 4. Print the status table

```
Book              | Author           | Ch | Parsed | Summaries        | Practice
──────────────────────────────────────────────────────────────────────────────────
deep-work         | Cal Newport      | 18 |   ✓    | 18/18 + full ✓   | 0/18
atomic-habits     | James Clear      | 20 |   ✓    | 20/20 + full ✓   | 20/20 + full ✓
the-lean-startup  | Eric Ries        |  9 |   ✓    | 0/9              | 0/9
```

### 5. Suggest next actions
For each incomplete book, suggest the next skill to run.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/book-status/SKILL.md
git commit -m "feat: add book-status skill"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass with no failures.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 3: Verify all files exist**

```bash
find .claude src tests -type f | sort
```

Expected output should include all 22 files from the File Map at the top of this plan.

- [ ] **Step 4: Smoke test CLI on the fixture**

```bash
npx tsx src/cli.ts parse tests/fixtures/metamorphosis.epub
```

Expected:
```
Parsing metamorphosis.epub...

✓ Parsed: "Metamorphosis" by Franz Kafka
  Chapters: N
  Output:   book-output/metamorphosis/

Next step: /summarize-book metamorphosis
```

- [ ] **Step 5: Verify output structure**

```bash
ls book-output/metamorphosis/
# → metadata.json  raw-chapters/
ls book-output/metamorphosis/raw-chapters/ | head -5
# → chapter-01.md  chapter-02.md ...
cat book-output/metamorphosis/metadata.json | head -20
# → valid JSON with title, author, chapterCount, chapters[]
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git status  # review — should only be book-output/ (git-ignored) and no untracked source files
git commit -m "feat: complete book distiller implementation"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Phase 1 (parser): Tasks 2–7
- ✅ Phase 2 (skills): Tasks 10–14
- ✅ Phase 3 (subagent): Task 9
- ✅ Phase 4 (summary template): Task 11
- ✅ Phase 4b (full-book summary structure): embedded in summarize-book SKILL.md, Task 11
- ✅ Phase 4c (full-book practice structure): embedded in practice-book SKILL.md, Task 12
- ✅ Phase 5 (practice template): Task 12
- ✅ Phase 7 (project config): Task 8

**Type consistency:**
- `Chapter` defined in Task 2, used in Tasks 3, 4, 5, 6, 7 — consistent
- `ParseResult` defined in Task 2, returned by epub-parser (Task 4), pdf-parser (Task 5), index (Task 6) — consistent
- `BookMetadata` defined in Task 2, written by CLI (Task 7), read by skills — consistent
- `countWords` exported from chapter-splitter (Task 3), imported by epub-parser (Task 4) — consistent
