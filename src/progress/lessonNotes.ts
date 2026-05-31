// src/progress/lessonNotes.ts
export interface ParsedReviewItem {
  id: string;
  chapter: number;
  concept: string;
  question: string;
  answer: string;
}

/**
 * Parse the `## Review items` section of a lesson note. Each item line:
 *   `- id: c1-q1 | concept: C1 | Q: <question> | A: <answer>`
 */
export function parseReviewItems(markdown: string, chapter: number): ParsedReviewItem[] {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => /^##\s+review items/i.test(l.trim()));
  if (start === -1) return [];

  const items: ParsedReviewItem[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) break; // reached the next section
    if (!line.startsWith('-')) continue;

    const body = line.replace(/^-\s*/, '');
    const fields: Record<string, string> = {};
    for (const part of body.split('|')) {
      const idx = part.indexOf(':');
      if (idx === -1) continue;
      fields[part.slice(0, idx).trim().toLowerCase()] = part.slice(idx + 1).trim();
    }
    if (!fields.id || !fields.q) continue;
    items.push({
      id: fields.id,
      chapter,
      concept: fields.concept ?? '',
      question: fields.q,
      answer: fields.a ?? '',
    });
  }
  return items;
}
