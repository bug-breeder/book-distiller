// tests/progress/commands.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { cmdDue, cmdRecord, cmdAdvance, cmdShow } from '../../src/progress/commands.js';
import { loadProgress } from '../../src/progress/store.js';

let baseDir: string;
const lessonsDir = (slug: string) => path.join(baseDir, slug, 'lessons');

beforeEach(async () => {
  baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bd-cmd-'));
  await fs.ensureDir(lessonsDir('demo'));
  await fs.writeJSON(path.join(baseDir, 'demo', 'metadata.json'), { title: 'Demo', chapterCount: 3 });
  await fs.writeFile(
    path.join(lessonsDir('demo'), 'chapter-01-lesson.md'),
    `## Review items
- id: c1-q1 | concept: C1 | Q: q1 | A: a1
- id: c2-q1 | concept: C2 | Q: q2 | A: a2
`,
  );
});
afterEach(async () => { await fs.remove(baseDir); });

describe('cmdAdvance', () => {
  it('records mastery, logs the session, enqueues review items, bumps chapter', async () => {
    await cmdAdvance('demo', 1, 'mastered', ['C2 was fuzzy'], '2026-01-01', baseDir);
    const p = await loadProgress('demo', baseDir);
    expect(p.chapters['1'].status).toBe('mastered');
    expect(p.currentChapter).toBe(2);
    expect(p.sessionLog).toHaveLength(1);
    expect(p.reviewQueue.map((i) => i.id).sort()).toEqual(['c1-q1', 'c2-q1']);
    // gap concept C2 is due tomorrow; non-gap C1 in 3 days
    const c1 = p.reviewQueue.find((i) => i.id === 'c1-q1')!;
    const c2 = p.reviewQueue.find((i) => i.id === 'c2-q1')!;
    expect(c1.dueDate).toBe('2026-01-04');
    expect(c2.dueDate).toBe('2026-01-02');
  });
  it('does not enqueue duplicate ids on re-advance', async () => {
    await cmdAdvance('demo', 1, 'mastered', [], '2026-01-01', baseDir);
    await cmdAdvance('demo', 1, 'mastered', [], '2026-01-05', baseDir);
    const p = await loadProgress('demo', baseDir);
    expect(p.reviewQueue).toHaveLength(2);
  });
});

describe('cmdDue + cmdRecord', () => {
  it('lists due items then reschedules a passed item out', async () => {
    await cmdAdvance('demo', 1, 'mastered', [], '2026-01-01', baseDir); // both due 2026-01-04
    expect((await cmdDue('demo', '2026-01-04', baseDir)).map((i) => i.id).sort()).toEqual(['c1-q1', 'c2-q1']);
    await cmdRecord('demo', 'c1-q1', 'pass', '2026-01-04', baseDir);
    expect((await cmdDue('demo', '2026-01-04', baseDir)).map((i) => i.id)).toEqual(['c2-q1']);
  });
  it('throws on unknown review id', async () => {
    await expect(cmdRecord('demo', 'nope', 'pass', '2026-01-04', baseDir)).rejects.toThrow(/not found/);
  });
});

describe('cmdShow', () => {
  it('reports mastered/total and current chapter', async () => {
    await cmdAdvance('demo', 1, 'mastered', [], '2026-01-01', baseDir);
    const text = await cmdShow('demo', '2026-01-01', baseDir);
    expect(text).toContain('1/3');
    expect(text).toContain('chapter 2');
  });
});
