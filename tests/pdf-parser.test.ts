import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parsePdf } from '../src/parser/pdf-parser.js';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
  };
});

import { getDocument } from 'pdfjs-dist';
const mockGetDocument = vi.mocked(getDocument);

type MockDoc = {
  numPages: number;
  getMetadata: ReturnType<typeof vi.fn>;
  getOutline: ReturnType<typeof vi.fn>;
  getDestination: ReturnType<typeof vi.fn>;
  getPageIndex: ReturnType<typeof vi.fn>;
  getPage: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

function makeMockDoc(opts: {
  numPages: number;
  title?: string;
  author?: string;
  outline?: Array<{ title: string; dest: string | null }> | null;
  destMap?: Record<string, number>; // dest name → 0-based page index
  pageHeadings?: Record<number, string>; // pageNum → heading text (for page scan tests)
}): MockDoc {
  const { numPages, title, author, outline = null, destMap = {}, pageHeadings = {} } = opts;

  return {
    numPages,
    getMetadata: vi.fn().mockResolvedValue({
      info: { Title: title ?? '', Author: author ?? '' },
    }),
    getOutline: vi.fn().mockResolvedValue(outline),
    getDestination: vi.fn().mockImplementation(async (name: string) => {
      const idx = destMap[name] ?? 0;
      return [{ num: idx, gen: 0 }];
    }),
    getPageIndex: vi.fn().mockImplementation(async (ref: { num: number }) => ref.num),
    getPage: vi.fn().mockImplementation(async (pageNum: number) => ({
      getTextContent: vi.fn().mockResolvedValue({
        items: pageHeadings[pageNum]
          ? [{ str: pageHeadings[pageNum] }]
          : [],
      }),
    })),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

function setupDoc(doc: MockDoc): void {
  mockGetDocument.mockReturnValue(
    { promise: Promise.resolve(doc) } as unknown as ReturnType<typeof getDocument>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parsePdf', () => {
  it('uses PDF outline bookmarks when available', async () => {
    const doc = makeMockDoc({
      numPages: 100,
      title: 'My Book',
      author: 'Jane Doe',
      outline: [
        { title: 'Chapter 1: Introduction', dest: 'ch1' },
        { title: 'Chapter 2: Graphs', dest: 'ch2' },
        { title: 'Chapter 3: Flows', dest: 'ch3' },
      ],
      destMap: { ch1: 0, ch2: 19, ch3: 44 }, // 0-based page indices → pages 1, 20, 45
    });
    setupDoc(doc);

    const result = await parsePdf('/fake/book.pdf');

    expect(result.info.title).toBe('My Book');
    expect(result.info.author).toBe('Jane Doe');
    expect(result.chapters).toHaveLength(3);
    expect(result.chapters[0].chapterTitle).toBe('Chapter 1: Introduction');
    expect(result.chapters[0].pageRange).toEqual({ start: 1, end: 19 });
    expect(result.chapters[1].pageRange).toEqual({ start: 20, end: 44 });
    expect(result.chapters[2].pageRange).toEqual({ start: 45, end: 100 });
    // PDF mode: no text content, estimated word count
    expect(result.chapters[0].content).toBe('');
    expect(result.chapters[0].wordCount).toBe(19 * 300);
  });

  it('falls back to page scan when outline is absent', async () => {
    const doc = makeMockDoc({
      numPages: 60,
      title: 'Scan Book',
      outline: null,
      pageHeadings: {
        1: 'Chapter 1: The Beginning',
        21: 'Chapter 2: The Middle',
      },
    });
    setupDoc(doc);

    const result = await parsePdf('/fake/scan.pdf');

    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].pageRange).toEqual({ start: 1, end: 20 });
    expect(result.chapters[1].pageRange).toEqual({ start: 21, end: 60 });
    expect(result.chapters[0].content).toBe('');
  });

  it('falls back to fixed-size page chunks when no headings found', async () => {
    const doc = makeMockDoc({ numPages: 45, outline: null });
    setupDoc(doc);

    const result = await parsePdf('/fake/no-headings.pdf');

    // 45 pages / 20 per chunk = 3 chapters
    expect(result.chapters).toHaveLength(3);
    expect(result.chapters[0].pageRange).toEqual({ start: 1, end: 20 });
    expect(result.chapters[1].pageRange).toEqual({ start: 21, end: 40 });
    expect(result.chapters[2].pageRange).toEqual({ start: 41, end: 45 });
    expect(result.chapters[0].wordCount).toBe(20 * 300);
    expect(result.chapters[2].wordCount).toBe(5 * 300);
  });

  it('uses filename as title when PDF has no metadata', async () => {
    const doc = makeMockDoc({ numPages: 10, title: '', outline: null });
    setupDoc(doc);

    const result = await parsePdf('/fake/my-book.pdf');
    expect(result.info.title).toBe('my-book');
  });

  it('sourceFile is the absolute resolved path', async () => {
    const doc = makeMockDoc({ numPages: 10, outline: null });
    setupDoc(doc);

    const result = await parsePdf('/absolute/path/to/book.pdf');
    expect(result.info.sourceFile).toBe('/absolute/path/to/book.pdf');
  });

  it('skips outline entries with malformed destinations', async () => {
    const doc = makeMockDoc({
      numPages: 50,
      outline: [
        { title: 'Chapter 1', dest: 'valid' },
        { title: 'Chapter 2', dest: null }, // no dest — should be skipped
        { title: 'Chapter 3', dest: 'valid3' },
      ],
      destMap: { valid: 0, valid3: 24 },
    });
    setupDoc(doc);

    const result = await parsePdf('/fake/malformed.pdf');

    // Chapter 2 skipped, only 2 valid entries
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].pageRange).toEqual({ start: 1, end: 24 });
    expect(result.chapters[1].pageRange).toEqual({ start: 25, end: 50 });
  });
});
