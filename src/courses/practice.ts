import fs from 'fs-extra';
import path from 'node:path';

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

/** Parse a prompts.md file: one prompt per `### <id>` heading, with `- task:`,
 *  `- type:`, optional `- image:` metadata lines, then free prompt text. */
export function parsePrompts(md: string): PracticePrompt[] {
  const blocks = md.split(/^###\s+/m).map((b) => b.trim()).filter(Boolean);
  const prompts: PracticePrompt[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const id = lines[0].trim();
    let task: 1 | 2 = 2;
    let type = '';
    let imageUrl: string | undefined;
    const textLines: string[] = [];
    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (!line) continue;
      const meta = line.match(/^-\s*(task|type|image)\s*:\s*(.+)$/i);
      if (meta) {
        const key = meta[1].toLowerCase();
        const val = meta[2].trim();
        if (key === 'task') task = val === '1' ? 1 : 2;
        else if (key === 'type') type = val;
        else if (key === 'image') imageUrl = val;
        continue;
      }
      textLines.push(line);
    }
    const prompt = textLines.join(' ').trim();
    prompts.push(imageUrl ? { id, task, type, prompt, imageUrl } : { id, task, type, prompt });
  }
  return prompts;
}

export function buildPracticeBundle(
  slug: string,
  title: string,
  rubricMd: string,
  feedbackSpecMd: string,
  promptsMd: string,
): PracticeBundle {
  return {
    slug,
    title,
    rubric: rubricMd.trim(),
    feedbackSpec: feedbackSpecMd.trim(),
    prompts: parsePrompts(promptsMd),
  };
}

/** The practice page MDX. Imports the co-located bundle and mounts the three
 *  globally-registered components (no per-file component imports needed). */
export function renderPracticeMdx(slug: string, title: string): string {
  return [
    '---',
    `title: "Practice & Feedback — ${title}"`,
    'sidebar_position: 999',
    '---',
    '',
    "import practice from './practice.json';",
    '',
    `# Practice & Feedback`,
    '',
    'Write a full essay against a prompt below and get an estimated band score against the four IELTS criteria. You supply your own OpenAI-compatible API key — it is stored only in this browser and sent only to the provider you configure.',
    '',
    '<PracticeScorer bundle={practice} />',
    '',
    '## Your band trajectory',
    '',
    `<BandTrajectory slug="${slug}" />`,
    '',
    '## Review drills',
    '',
    `<ReviewDrills slug="${slug}" />`,
    '',
  ].join('\n');
}

/** Read the three skill assets from book-output/<slug>/. Returns null if any is absent. */
export async function readPracticeAssets(
  slug: string,
): Promise<{ rubric: string; feedbackSpec: string; prompts: string } | null> {
  const dir = path.join('book-output', slug);
  const files = {
    rubric: path.join(dir, 'rubric.md'),
    feedbackSpec: path.join(dir, 'feedback-spec.md'),
    prompts: path.join(dir, 'prompts.md'),
  };
  for (const p of Object.values(files)) {
    if (!(await fs.pathExists(p))) return null;
  }
  return {
    rubric: await fs.readFile(files.rubric, 'utf-8'),
    feedbackSpec: await fs.readFile(files.feedbackSpec, 'utf-8'),
    prompts: await fs.readFile(files.prompts, 'utf-8'),
  };
}
