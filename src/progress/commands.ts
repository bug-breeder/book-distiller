// src/progress/commands.ts
import path from 'path';
import fs from 'fs-extra';
import type { ChapterStatus, Progress, ReviewItem } from './types.js';
import { loadProgress, saveProgress } from './store.js';
import { applyResult, dueItems, seedItem } from './schedule.js';
import { parseReviewItems } from './lessonNotes.js';

export async function cmdDue(slug: string, today: string, baseDir = 'book-output'): Promise<ReviewItem[]> {
  const p = await loadProgress(slug, baseDir);
  return dueItems(p.reviewQueue, today);
}

export async function cmdRecord(
  slug: string, id: string, result: 'pass' | 'fail', today: string, baseDir = 'book-output',
): Promise<Progress> {
  const p = await loadProgress(slug, baseDir);
  const idx = p.reviewQueue.findIndex((it) => it.id === id);
  if (idx === -1) throw new Error(`Review item not found: ${id}`);
  p.reviewQueue[idx] = applyResult(p.reviewQueue[idx], result, today);
  await saveProgress(p, baseDir);
  return p;
}

export async function cmdAdvance(
  slug: string, chapter: number, status: ChapterStatus, gaps: string[], today: string, baseDir = 'book-output',
): Promise<Progress> {
  const p = await loadProgress(slug, baseDir);
  p.chapters[String(chapter)] = { status, lastSession: today, gaps };
  p.sessionLog.push({ date: today, chapter, outcome: status, gaps });

  const noteFile = path.join(baseDir, slug, 'lessons', `chapter-${String(chapter).padStart(2, '0')}-lesson.md`);
  if (await fs.pathExists(noteFile)) {
    const md = await fs.readFile(noteFile, 'utf-8');
    const existing = new Set(p.reviewQueue.map((it) => it.id));
    for (const item of parseReviewItems(md, chapter)) {
      if (existing.has(item.id)) continue;
      const isGap = gaps.some((g) => g && item.concept && g.toLowerCase().includes(item.concept.toLowerCase()));
      p.reviewQueue.push(seedItem(item, today, isGap ? 1 : 3));
    }
  }
  p.currentChapter = chapter + 1;
  await saveProgress(p, baseDir);
  return p;
}

export async function cmdShow(
  slug: string, today = new Date().toISOString().slice(0, 10), baseDir = 'book-output',
): Promise<string> {
  const p = await loadProgress(slug, baseDir);
  const meta = (await fs.readJSON(path.join(baseDir, slug, 'metadata.json'))) as { chapterCount: number };
  const mastered = Object.values(p.chapters).filter((c) => c.status === 'mastered').length;
  const due = dueItems(p.reviewQueue, today).length;
  return [
    p.title,
    `  mastered: ${mastered}/${meta.chapterCount}`,
    `  current: chapter ${p.currentChapter}`,
    `  reviews due: ${due}`,
  ].join('\n');
}
