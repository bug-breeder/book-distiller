import fs from 'fs-extra';
import path from 'node:path';
import type { BookMetadata } from '../parser/types.js';
import { parseCourseSpecFrontmatter, parseOutline, buildAuthoredMetadata } from './outline.js';

export async function runAuthorScaffold(slug: string): Promise<BookMetadata> {
  const dir = path.join('book-output', slug);
  const specPath = path.join(dir, 'course-spec.md');
  const outlinePath = path.join(dir, 'outline.md');
  if (!(await fs.pathExists(specPath))) throw new Error(`course-spec not found: ${specPath}`);
  if (!(await fs.pathExists(outlinePath))) throw new Error(`outline not found: ${outlinePath}`);

  const spec = parseCourseSpecFrontmatter(await fs.readFile(specPath, 'utf-8'));
  const modules = parseOutline(await fs.readFile(outlinePath, 'utf-8'));
  if (modules.length === 0) throw new Error(`no module lines found in ${outlinePath}`);

  const meta = buildAuthoredMetadata(spec, modules);
  await fs.writeJSON(path.join(dir, 'metadata.json'), meta, { spaces: 2 });
  return meta;
}
