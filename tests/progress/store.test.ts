// tests/progress/store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { loadProgress, saveProgress, progressPath } from '../../src/progress/store.js';

let baseDir: string;

beforeEach(async () => {
  baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bd-store-'));
  await fs.ensureDir(path.join(baseDir, 'demo'));
  await fs.writeJSON(path.join(baseDir, 'demo', 'metadata.json'), { title: 'Demo Book', chapterCount: 5 });
});
afterEach(async () => { await fs.remove(baseDir); });

describe('loadProgress', () => {
  it('initializes from metadata when progress.json is absent', async () => {
    const p = await loadProgress('demo', baseDir);
    expect(p).toEqual({
      slug: 'demo', title: 'Demo Book', currentChapter: 1,
      chapters: {}, reviewQueue: [], sessionLog: [],
    });
  });
  it('round-trips through save', async () => {
    const p = await loadProgress('demo', baseDir);
    p.currentChapter = 3;
    await saveProgress(p, baseDir);
    expect(await fs.pathExists(progressPath('demo', baseDir))).toBe(true);
    const reloaded = await loadProgress('demo', baseDir);
    expect(reloaded.currentChapter).toBe(3);
  });
});
