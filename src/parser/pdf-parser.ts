import { readFile } from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ParseResult, Chapter } from './types.js';
import { CHAPTER_HEADING_RE } from './chapter-splitter.js';

// Node.js: point to the bundled worker so pdfjs can run in-process (fake worker mode)
const _require = createRequire(import.meta.url);
const _pdfjsLegacyDir = path.dirname(_require.resolve('pdfjs-dist/legacy/build/pdf.mjs'));
GlobalWorkerOptions.workerSrc = path.join(_pdfjsLegacyDir, 'pdf.worker.mjs');

interface OutlineItem {
  title: string;
  dest: string | unknown[] | null;
  items: OutlineItem[];
}

/**
 * Phase 1: extract chapter boundaries from PDF bookmarks/outline.
 * Returns null if the PDF has no outline or fewer than 2 valid entries.
 */
async function extractFromOutline(
  doc: PDFDocumentProxy
): Promise<{ title: string; startPage: number }[] | null> {
  const outline = (await doc.getOutline()) as OutlineItem[] | null;
  if (!outline || outline.length < 2) return null;

  const entries: { title: string; startPage: number }[] = [];
  for (const item of outline) {
    if (!item.dest) continue;
    try {
      const dest =
        typeof item.dest === 'string'
          ? await doc.getDestination(item.dest)
          : (item.dest as unknown[]);
      if (!dest || !Array.isArray(dest) || dest.length === 0) continue;
      // dest[0] is a page reference object { num, gen }
      const pageRef = dest[0] as { num: number; gen: number };
      const pageIndex = await doc.getPageIndex(pageRef); // 0-based
      entries.push({ title: item.title, startPage: pageIndex + 1 });
    } catch {
      continue; // skip malformed destinations
    }
  }
  // Deduplicate consecutive entries pointing to the same page (keep first)
  const unique = entries.filter(
    (e, i) => i === 0 || e.startPage !== entries[i - 1].startPage
  );
  return unique.length >= 2 ? unique : null;
}

/**
 * Phase 2: scan each page's text for chapter headings, recording which page each starts on.
 */
async function extractFromPageScan(
  doc: PDFDocumentProxy
): Promise<{ title: string; startPage: number }[]> {
  const entries: { title: string; startPage: number }[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lines = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join('\n')
      .split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 120 && CHAPTER_HEADING_RE.test(trimmed)) {
        entries.push({ title: trimmed, startPage: pageNum });
        break; // only one chapter heading per page
      }
    }
  }
  return entries;
}

function entriesToChapters(
  entries: { title: string; startPage: number }[],
  totalPages: number
): Chapter[] {
  return entries.map((entry, i) => {
    const start = entry.startPage;
    const end = i + 1 < entries.length ? entries[i + 1].startPage - 1 : totalPages;
    return {
      chapterNumber: i + 1,
      chapterTitle: entry.title,
      content: '', // book-analyst reads PDF directly
      wordCount: (end - start + 1) * 300, // estimated
      pageRange: { start, end },
    };
  });
}

export async function parsePdf(filePath: string): Promise<ParseResult> {
  const buffer = await readFile(filePath);
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;

  const meta = await doc.getMetadata().catch(() => null);
  const info = meta?.info as Record<string, unknown> | undefined;
  const title =
    (info?.Title as string | undefined) ||
    path.basename(filePath, path.extname(filePath));
  const author = (info?.Author as string | undefined) || 'Unknown';

  const totalPages = doc.numPages;

  // Phase 1: try PDF outline/bookmarks
  let entries = await extractFromOutline(doc);

  // Phase 2: fall back to per-page text scan
  if (!entries || entries.length < 2) {
    const scanned = await extractFromPageScan(doc);
    entries = scanned.length >= 2 ? scanned : null;
  }

  let chapters: Chapter[];
  if (entries) {
    chapters = entriesToChapters(entries, totalPages);
  } else {
    // Phase 3: fixed 20-page chunks
    const CHUNK = 20;
    chapters = [];
    let num = 1;
    for (let start = 1; start <= totalPages; start += CHUNK) {
      const end = Math.min(start + CHUNK - 1, totalPages);
      chapters.push({
        chapterNumber: num++,
        chapterTitle: `Pages ${start}–${end}`,
        content: '',
        wordCount: (end - start + 1) * 300,
        pageRange: { start, end },
      });
    }
  }

  await doc.destroy();
  return {
    info: { title, author, language: 'en', sourceFile: path.resolve(filePath) },
    chapters,
  };
}
