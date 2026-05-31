// src/figures/extract.ts
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface FigureLoc {
  /** e.g. "Figure 2.1" or "Table 3.2" */
  label: string;
  /** PDF page number (1-based, matching the chapter's pageRange and the Read tool's `pages` param) */
  page: number;
  /** the caption text following the label */
  caption: string;
}

// A real caption line, once left-trimmed, BEGINS with "Figure N(.M):" or
// "Table N(.M):". Requiring the colon excludes sentence-initial references such
// as "Figure 2.2 depicts the network…", and the start-anchor excludes mid-line
// references such as "the graph in Figure 2.1(a)…".
const CAPTION_RE = /^(Figure|Table)\s+(\d+(?:\.\d+)?)\s*:\s*(.*)$/;

/**
 * Parse `pdftotext -layout` output for one chapter into figure/table caption
 * locations. pdftotext separates pages with a form-feed (`\f`); the Nth page
 * block (0-based) corresponds to PDF page `startPage + N`. Deterministic and
 * pure — unit-tested without invoking pdftotext.
 */
export function parseFigures(pdftextOutput: string, startPage: number): FigureLoc[] {
  const pages = pdftextOutput.split('\f');
  const byLabel = new Map<string, FigureLoc>();
  pages.forEach((pageText, idx) => {
    const page = startPage + idx;
    for (const raw of pageText.split('\n')) {
      const m = CAPTION_RE.exec(raw.replace(/^\s+/, ''));
      if (!m) continue;
      const label = `${m[1]} ${m[2]}`;
      if (!byLabel.has(label)) {
        byLabel.set(label, { label, page, caption: m[3].trim() });
      }
    }
  });
  return [...byLabel.values()];
}

/**
 * Run `pdftotext` over a PDF page range and return the figure/table locations.
 * Throws a clear error if poppler's `pdftotext` is not installed.
 */
export async function figuresFromPdf(
  pdfPath: string,
  startPage: number,
  endPage: number,
): Promise<FigureLoc[]> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(
      'pdftotext',
      ['-f', String(startPage), '-l', String(endPage), '-layout', pdfPath, '-'],
      { maxBuffer: 64 * 1024 * 1024 },
    ));
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') {
      throw new Error(
        'pdftotext not found — install poppler (e.g. `brew install poppler`) to locate figures.',
      );
    }
    throw new Error(`pdftotext failed: ${e.message}`);
  }
  return parseFigures(stdout, startPage);
}
