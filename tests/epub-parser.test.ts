import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { parseEpub } from '../src/parser/epub-parser.js';

const FIXTURE = fileURLToPath(
  new URL('./fixtures/metamorphosis.epub', import.meta.url)
);

describe('parseEpub', () => {
  it('extracts a non-empty title from metadata', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.info.title.length).toBeGreaterThan(0);
  });

  it('extracts a non-empty author from metadata', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.info.author.length).toBeGreaterThan(0);
  });

  it('extracts at least one chapter', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.chapters.length).toBeGreaterThan(0);
  });

  it('all chapters have non-empty content (skips nav/toc pages)', async () => {
    const result = await parseEpub(FIXTURE);
    for (const ch of result.chapters) {
      expect(ch.content.trim().length).toBeGreaterThan(100);
    }
  });

  it('all chapters have a positive word count', async () => {
    const result = await parseEpub(FIXTURE);
    for (const ch of result.chapters) {
      expect(ch.wordCount).toBeGreaterThan(0);
    }
  });

  it('chapter numbers are sequential starting at 1', async () => {
    const result = await parseEpub(FIXTURE);
    result.chapters.forEach((ch, i) => {
      expect(ch.chapterNumber).toBe(i + 1);
    });
  });

  it('sets sourceFile to the input path', async () => {
    const result = await parseEpub(FIXTURE);
    expect(result.info.sourceFile).toBe(FIXTURE);
  });
});
