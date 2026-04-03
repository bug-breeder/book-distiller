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
