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
