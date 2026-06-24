import type { OutlineModule, CourseSpecFrontmatter } from './types.js';
import type { BookMetadata, ChapterIndex } from '../parser/types.js';

const MODULE_LINE = /^-\s*module:\s*(\S+)\s*\|\s*title:\s*(.+?)\s*\|\s*concepts:\s*(.*)$/;

export function parseOutline(text: string): OutlineModule[] {
  const modules: OutlineModule[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(MODULE_LINE);
    if (!m) continue;
    const conceptIds = m[3].trim() === ''
      ? []
      : m[3].split(',').map((c) => Number(c.trim()));
    modules.push({ module: m[1].trim(), title: m[2].trim(), conceptIds });
  }
  return modules;
}

function frontmatterField(block: string, key: string): string {
  const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!m) throw new Error(`course-spec frontmatter missing "${key}:"`);
  return m[1].trim();
}

export function parseCourseSpecFrontmatter(text: string): CourseSpecFrontmatter {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error('course-spec.md must start with a --- frontmatter block');
  const block = m[1];
  const type = frontmatterField(block, 'type');
  if (type !== 'skill' && type !== 'knowledge') {
    throw new Error(`course-spec "type" must be "skill" or "knowledge" (got "${type}")`);
  }
  return {
    slug: frontmatterField(block, 'slug'),
    title: frontmatterField(block, 'title'),
    author: frontmatterField(block, 'author'),
    language: frontmatterField(block, 'language'),
    type,
  };
}

export function buildAuthoredMetadata(
  spec: CourseSpecFrontmatter,
  modules: OutlineModule[],
): BookMetadata {
  const chapters: ChapterIndex[] = modules.map((mod) => ({
    chapterNumber: Number(mod.module),
    chapterTitle: mod.title,
    wordCount: 0,
    file: `module-${mod.module}.md`,
  }));
  return {
    slug: spec.slug,
    title: spec.title,
    author: spec.author,
    language: spec.language,
    sourceFile: '',
    parsedAt: new Date().toISOString(),
    chapterCount: chapters.length,
    chapters,
    sourceType: 'authored',
    courseType: spec.type,
  };
}
