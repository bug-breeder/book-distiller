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
