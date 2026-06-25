export type Criterion = 'TR' | 'CC' | 'LR' | 'GRA';
export const CRITERIA: Criterion[] = ['TR', 'CC', 'LR', 'GRA'];

export interface CriterionScore {
  band: number;
  justification: string;
  descriptorQuote: string;
}
export interface InlineError {
  quote: string;
  type: 'grammar' | 'lexis' | 'cohesion' | 'task';
  issue: string;
  fix: string;
}
export interface Rewrite {
  original: string;
  improved: string;
  why: string;
}
export interface ScoreResult {
  overall: number;
  criteria: Record<Criterion, CriterionScore>;
  inlineErrors: InlineError[];
  rewrites: Rewrite[];
  recurringErrorTags: string[];
}

export interface PracticePrompt {
  id: string;
  task: 1 | 2;
  type: string;
  prompt: string;
  imageUrl?: string;
}
export interface PracticeBundle {
  slug: string;
  title: string;
  rubric: string;
  feedbackSpec: string;
  prompts: PracticePrompt[];
}

export interface Config {
  apiKey: string;
  baseURL: string;
  model: string;
}
export interface Attempt {
  id: string;
  ts: string;
  task: 1 | 2;
  promptId: string;
  wordCount: number;
  overall: number;
  criteria: Record<Criterion, number>;
  recurringErrorTags: string[];
}
export interface ReviewCard {
  id: string;
  concept: string;
  question: string;
  answer: string;
  dueDate: string;
  interval: number;
  ease: number;
  lapses: number;
}
