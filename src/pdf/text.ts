// src/pdf/text.ts
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/** Run `pdftotext -layout` over a PDF page range and return its raw stdout. */
export async function pdfPageText(
  pdfPath: string,
  startPage: number,
  endPage: number,
): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      'pdftotext',
      ['-f', String(startPage), '-l', String(endPage), '-layout', pdfPath, '-'],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    return stdout;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') {
      throw new Error(
        'pdftotext not found — install poppler (e.g. `brew install poppler`).',
      );
    }
    throw new Error(`pdftotext failed: ${e.message}`);
  }
}
