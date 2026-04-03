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

  const info = data.info as Record<string, unknown> | null;
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
