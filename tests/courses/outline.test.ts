import { describe, it, expect } from 'vitest';
import { parseOutline, parseCourseSpecFrontmatter, buildAuthoredMetadata } from '../../src/courses/outline.js';

const OUTLINE = `# Outline

Some prose the parser ignores.

- module: 01 | title: Test Format & Band Descriptors | concepts: 1,2
- module: 02 | title: Complex Sentence Structures | concepts: 3
`;

const SPEC = `---
slug: ielts-academic-writing-7
title: IELTS Academic Writing 7.0
author: Study Mate
language: en
type: skill
---

# Course Spec
narrative...`;

describe('parseOutline', () => {
  it('parses only the machine-readable module lines', () => {
    const mods = parseOutline(OUTLINE);
    expect(mods).toHaveLength(2);
    expect(mods[0]).toEqual({ module: '01', title: 'Test Format & Band Descriptors', conceptIds: [1, 2] });
    expect(mods[1].conceptIds).toEqual([3]);
  });
});

describe('parseCourseSpecFrontmatter', () => {
  it('reads the frontmatter fields', () => {
    expect(parseCourseSpecFrontmatter(SPEC)).toEqual({
      slug: 'ielts-academic-writing-7',
      title: 'IELTS Academic Writing 7.0',
      author: 'Study Mate',
      language: 'en',
      type: 'skill',
    });
  });
});

describe('buildAuthoredMetadata', () => {
  it('builds one chapter per module with authored source', () => {
    const spec = parseCourseSpecFrontmatter(SPEC);
    const meta = buildAuthoredMetadata(spec, parseOutline(OUTLINE));
    expect(meta.sourceType).toBe('authored');
    expect(meta.courseType).toBe('skill');
    expect(meta.chapterCount).toBe(2);
    expect(meta.chapters[0]).toMatchObject({ chapterNumber: 1, chapterTitle: 'Test Format & Band Descriptors', file: 'module-01.md', wordCount: 0 });
    expect(meta.chapters[1].file).toBe('module-02.md');
  });
});
