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
