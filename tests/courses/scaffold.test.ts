import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import { runAuthorScaffold } from '../../src/courses/scaffold.js';

const SLUG = '__test-scaffold__';
const dir = path.join('book-output', SLUG);

beforeAll(async () => {
  await fs.ensureDir(dir);
  await fs.writeFile(path.join(dir, 'course-spec.md'), `---
slug: ${SLUG}
title: Tiny Test Course
author: Study Mate
language: en
type: skill
---
# spec`);
  await fs.writeFile(path.join(dir, 'outline.md'), `# Outline
- module: 01 | title: First Module | concepts: 1
- module: 02 | title: Second Module | concepts: 2,3
`);
});
afterAll(async () => {
  await fs.remove(dir);
});

describe('runAuthorScaffold', () => {
  it('writes metadata.json with one chapter per module', async () => {
    const meta = await runAuthorScaffold(SLUG);
    expect(meta.chapterCount).toBe(2);
    expect(meta.sourceType).toBe('authored');
    const onDisk = await fs.readJson(path.join(dir, 'metadata.json'));
    expect(onDisk.chapters[1].file).toBe('module-02.md');
  });

  it('throws when course-spec.md is missing', async () => {
    await expect(runAuthorScaffold('__nope__')).rejects.toThrow(/course-spec/);
  });
});
