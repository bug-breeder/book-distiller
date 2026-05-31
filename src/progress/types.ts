// src/progress/types.ts
export type ChapterStatus = 'not_started' | 'in_progress' | 'mastered';

export interface ReviewItem {
  id: string;
  chapter: number;
  concept: string;
  question: string;
  answer: string;
  dueDate: string; // YYYY-MM-DD
  interval: number; // days until next review
  ease: number;
  lapses: number;
}

export interface ChapterProgress {
  status: ChapterStatus;
  lastSession: string; // YYYY-MM-DD of the last session touching this chapter
  gaps: string[];
}

export interface SessionLogEntry {
  date: string; // YYYY-MM-DD
  chapter: number;
  outcome: ChapterStatus;
  gaps: string[];
}

export interface Progress {
  slug: string;
  title: string;
  currentChapter: number;
  chapters: Record<string, ChapterProgress>;
  reviewQueue: ReviewItem[];
  sessionLog: SessionLogEntry[];
}
