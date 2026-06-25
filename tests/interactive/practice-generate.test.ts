// tests/interactive/practice-generate.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { generateInteractiveBook } from '../../src/interactive/generate.js';

const SLUG = 'test-skill-course';
let cwd: string;

beforeAll(async () => {
  cwd = process.cwd();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'phase2-gen-'));
  process.chdir(tmp);
  // Minimal book-output for a skill course (one module, no lesson note needed for this assertion).
  await fs.outputJson(path.join('book-output', SLUG, 'metadata.json'), {
    slug: SLUG,
    title: 'Test Skill Course',
    author: 'x',
    language: 'en',
    sourceFile: '',
    parsedAt: new Date().toISOString(),
    chapterCount: 0,
    chapters: [],
    sourceType: 'authored',
    courseType: 'skill',
  });
  await fs.outputFile(path.join('book-output', SLUG, 'rubric.md'), 'RUBRIC BODY');
  await fs.outputFile(path.join('book-output', SLUG, 'feedback-spec.md'), 'SPEC BODY');
  await fs.outputFile(
    path.join('book-output', SLUG, 'prompts.md'),
    '### p1\n- task: 2\n- type: opinion\nDo you agree?\n',
  );
  // interactive-book/docs must exist (generator writes under it).
  await fs.ensureDir(path.join('interactive-book', 'docs'));
});

afterAll(async () => {
  const tmp = process.cwd();
  process.chdir(cwd);
  await fs.remove(tmp);
});

describe('generateInteractiveBook — skill course', () => {
  it('emits practice.json and practice.mdx mounting PracticeScorer', async () => {
    const result = await generateInteractiveBook(SLUG);
    const docs = path.join('interactive-book', 'docs', SLUG);

    const bundle = await fs.readJson(path.join(docs, 'practice.json'));
    expect(bundle).toMatchObject({ slug: SLUG, rubric: 'RUBRIC BODY', feedbackSpec: 'SPEC BODY' });
    expect(bundle.prompts).toHaveLength(1);

    const mdx = await fs.readFile(path.join(docs, 'practice.mdx'), 'utf-8');
    expect(mdx).toContain('<PracticeScorer bundle={practice} />');
    expect(result.written.some((p) => p.endsWith('practice.mdx'))).toBe(true);
  });
});
