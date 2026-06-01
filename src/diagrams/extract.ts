// src/diagrams/extract.ts

/** Return the inner content of every fenced ```mermaid block in a markdown string. */
export function extractMermaidBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /```mermaid[ \t]*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    blocks.push(m[1].replace(/\s+$/, ''));
  }
  return blocks;
}
