import epub from 'epub2';
import type { ParseResult, Chapter } from './types.js';
import { countWords } from './chapter-splitter.js';

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getChapterContent(book: any, id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    book.getChapterRaw(id, (err: Error | null, text: string | null) => {
      if (err) reject(err);
      else resolve(text ?? '');
    });
  });
}

export async function parseEpub(filePath: string): Promise<ParseResult> {
  const book = await epub.createAsync(filePath);

  const title = (book.metadata.title as string) || 'Unknown Title';
  const author = (book.metadata.creator as string) || 'Unknown Author';
  const language = (book.metadata.language as string) || 'en';

  const chapters: Chapter[] = [];
  let chapterNum = 1;

  for (const item of book.flow as Array<{ id: string; title?: string }>) {
    if (!item.id) continue;
    try {
      const html = await getChapterContent(book, item.id);
      const text = stripHtml(html);
      if (text.length < 100) continue; // skip nav/toc/cover pages
      chapters.push({
        chapterNumber: chapterNum++,
        chapterTitle: item.title ?? `Chapter ${chapterNum - 1}`,
        content: text,
        wordCount: countWords(text),
      });
    } catch {
      // skip chapters that fail to load
    }
  }

  return {
    info: { title, author, language, sourceFile: filePath },
    chapters,
  };
}
