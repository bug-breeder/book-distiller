export const BLOOM_LEVELS = [
  'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create',
] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export interface ConceptRecord {
  id: number;
  label: string;
  dependencies: number[];
  taxonomyId: number;
  bloom: string; // validated against BLOOM_LEVELS in validateConceptDag
}

export interface OutlineModule {
  /** Zero-padded module number string, e.g. "01". */
  module: string;
  title: string;
  conceptIds: number[];
}

export interface CourseSpecFrontmatter {
  slug: string;
  title: string;
  author: string;
  language: string;
  type: 'skill' | 'knowledge';
}

export interface CourseValidationFinding {
  level: 'error' | 'warning';
  message: string;
}
