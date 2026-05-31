// src/progress/store.ts
import path from 'path';
import fs from 'fs-extra';
import type { Progress } from './types.js';

export function progressPath(slug: string, baseDir = 'book-output'): string {
  return path.join(baseDir, slug, 'progress.json');
}

export async function loadProgress(slug: string, baseDir = 'book-output'): Promise<Progress> {
  const p = progressPath(slug, baseDir);
  if (await fs.pathExists(p)) {
    return (await fs.readJSON(p)) as Progress;
  }
  const meta = (await fs.readJSON(path.join(baseDir, slug, 'metadata.json'))) as { title: string };
  return { slug, title: meta.title, currentChapter: 1, chapters: {}, reviewQueue: [], sessionLog: [] };
}

export async function saveProgress(p: Progress, baseDir = 'book-output'): Promise<void> {
  await fs.ensureDir(path.dirname(progressPath(p.slug, baseDir)));
  await fs.writeJSON(progressPath(p.slug, baseDir), p, { spaces: 2 });
}
