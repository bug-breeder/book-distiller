import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import { runValidateConcepts } from '../../src/courses/concepts.js';

const SLUG = '__test-validate-concepts__';
const dir = path.join('book-output', SLUG);

beforeAll(async () => {
  await fs.ensureDir(dir);
});
afterAll(async () => {
  await fs.remove(dir);
});

describe('runValidateConcepts', () => {
  it('returns no error findings for a valid concepts.csv', async () => {
    await fs.copy('tests/fixtures/authored/good-concepts.csv', path.join(dir, 'concepts.csv'));
    const { findings } = await runValidateConcepts(SLUG);
    expect(findings.filter((f) => f.level === 'error')).toEqual([]);
  });

  it('returns error findings for an invalid concepts.csv', async () => {
    await fs.copy('tests/fixtures/authored/bad-concepts.csv', path.join(dir, 'concepts.csv'));
    const { findings } = await runValidateConcepts(SLUG);
    expect(findings.some((f) => f.level === 'error')).toBe(true);
  });
});
