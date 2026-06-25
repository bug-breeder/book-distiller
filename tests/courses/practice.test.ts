import { describe, it, expect } from 'vitest';
import { parsePrompts, buildPracticeBundle, renderPracticeMdx } from '../../src/courses/practice.js';

const PROMPTS = `### opinion-tech-replaces-teachers
- task: 2
- type: opinion
Some people believe technology will replace teachers.
To what extent do you agree?

### line-chart-energy
- task: 1
- type: line-chart
- image: /practice-assets/ielts/energy.png
The line graph shows energy consumption between 2000 and 2020.
`;

describe('parsePrompts', () => {
  const prompts = parsePrompts(PROMPTS);

  it('parses each ### block into a structured prompt', () => {
    expect(prompts).toHaveLength(2);
  });

  it('uses the heading as id and reads task/type', () => {
    expect(prompts[0]).toMatchObject({ id: 'opinion-tech-replaces-teachers', task: 2, type: 'opinion' });
  });

  it('joins multi-line prompt text with spaces', () => {
    expect(prompts[0].prompt).toBe('Some people believe technology will replace teachers. To what extent do you agree?');
  });

  it('captures the optional image for Task 1', () => {
    expect(prompts[1].imageUrl).toBe('/practice-assets/ielts/energy.png');
    expect(prompts[0].imageUrl).toBeUndefined();
  });
});

describe('buildPracticeBundle', () => {
  it('ships rubric + feedback-spec verbatim and parsed prompts', () => {
    const bundle = buildPracticeBundle('ielts', 'IELTS', 'RUBRIC TEXT', 'SPEC TEXT', PROMPTS);
    expect(bundle).toMatchObject({ slug: 'ielts', title: 'IELTS', rubric: 'RUBRIC TEXT', feedbackSpec: 'SPEC TEXT' });
    expect(bundle.prompts).toHaveLength(2);
  });
});

describe('renderPracticeMdx', () => {
  const mdx = renderPracticeMdx('ielts', 'IELTS Academic Writing 7.0');

  it('imports the co-located practice.json', () => {
    expect(mdx).toContain("import practice from './practice.json';");
  });

  it('mounts PracticeScorer, BandTrajectory and ReviewDrills with the bundle', () => {
    expect(mdx).toContain('<PracticeScorer bundle={practice} />');
    expect(mdx).toContain('<BandTrajectory slug="ielts" />');
    expect(mdx).toContain('<ReviewDrills slug="ielts" />');
  });
});
