export interface Chapter {
  chapterNumber: number;
  chapterTitle: string;
  content: string;
  wordCount: number;
  pageRange?: { start: number; end: number };
}

export interface RawBookInfo {
  title: string;
  author: string;
  language: string;
  sourceFile: string;
}

export interface ParseResult {
  info: RawBookInfo;
  chapters: Chapter[];
}

export interface ChapterIndex {
  chapterNumber: number;
  chapterTitle: string;
  wordCount: number;
  file: string;
  pageRange?: { start: number; end: number };
}

export interface BookMetadata {
  slug: string;
  title: string;
  author: string;
  language: string;
  sourceFile: string;
  parsedAt: string;
  chapterCount: number;
  chapters: ChapterIndex[];
  /** Present for courses authored from a topic (no parsed source book). */
  sourceType?: 'authored';
  /** Skill-type courses additionally get the practice→feedback loop (Phase 2). */
  courseType?: 'skill' | 'knowledge';
}
