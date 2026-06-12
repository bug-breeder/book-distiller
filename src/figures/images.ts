// src/figures/images.ts
// Extract REAL figure images from a PDF (cropping the rendered page) so lessons can
// embed un-redrawable figures — large/real networks like the karate club, charts,
// photos, maps — inline, instead of citing a page. The geometry (vector-aware crop
// boxes) is done by scripts/extract_figures.py via PyMuPDF; this module just resolves
// a Python interpreter, drives the script, and parses its JSON manifest.
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';

const execFileAsync = promisify(execFile);
const SCRIPT = path.join('scripts', 'extract_figures.py');

export interface FigureToExtract {
  label: string;
  /** 1-based physical PDF page (as produced by `study-mate figures`). */
  page: number;
  caption: string;
}

export type FigureImage =
  | { label: string; page: number; image: string; bbox: number[]; w: number; h: number; ok: true }
  | { label: string; ok: false; reason: string };

/**
 * Find a Python that can `import fitz` (PyMuPDF). Honors $STUDY_MATE_PYTHON, then
 * tries the usual names/locations. Returns null if none works (extraction is optional).
 */
export function resolvePython(): string | null {
  const candidates = [
    process.env.STUDY_MATE_PYTHON,
    'python3',
    'python',
    '/opt/anaconda3/bin/python',
    '/usr/local/bin/python3',
    '/opt/homebrew/bin/python3',
  ].filter((c): c is string => Boolean(c));
  for (const py of candidates) {
    try {
      execFileSync(py, ['-c', 'import fitz'], { stdio: 'ignore' });
      return py;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Extract the given figures from `pdfPath` into `outDir` as PNGs. Returns the manifest
 * (one entry per figure, ok or not). Throws only if Python/PyMuPDF is unavailable.
 */
export async function extractFigureImages(
  pdfPath: string,
  outDir: string,
  figures: FigureToExtract[],
): Promise<FigureImage[]> {
  if (figures.length === 0) return [];
  const py = resolvePython();
  if (!py) {
    throw new Error(
      'no Python with PyMuPDF found — install with `pip install pymupdf`, or set $STUDY_MATE_PYTHON to a Python that can `import fitz`',
    );
  }
  await fs.ensureDir(outDir);
  const tmpJson = path.join(os.tmpdir(), `study-mate-figs-${process.pid}-${Date.now()}.json`);
  await fs.writeJson(tmpJson, figures);
  try {
    const { stdout } = await execFileAsync(py, [SCRIPT, pdfPath, outDir, tmpJson], {
      maxBuffer: 16 * 1024 * 1024,
    });
    const parsed: unknown = JSON.parse(stdout);
    if (!Array.isArray(parsed)) {
      const err = (parsed as { error?: string })?.error ?? 'unexpected output';
      throw new Error(`extract_figures.py failed: ${err}`);
    }
    return parsed as FigureImage[];
  } finally {
    await fs.remove(tmpJson);
  }
}
