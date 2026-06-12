// src/viz/lint.ts
// Deterministic safety lint for AI-authored sim components. Checks that every
// third-party import is on the allowlist, that no banned API is used, and that the
// `meta.libs` declaration matches the actual third-party imports.
import { packageName } from './allowlist.js';

export interface SimLintResult {
  file: string;
  ok: boolean;
  /** Imported third-party packages not on the allowlist. */
  offendingImports: string[];
  /** Banned API names found in the source. */
  bannedApis: string[];
  /** Disagreements between meta.libs and actual imports. */
  libMismatch: string[];
}

const BANNED: { pattern: RegExp; name: string }[] = [
  { pattern: /\beval\s*\(/, name: 'eval' },
  { pattern: /\bnew\s+Function\s*\(/, name: 'new Function' },
  { pattern: /dangerouslySetInnerHTML/, name: 'dangerouslySetInnerHTML' },
  { pattern: /\bfetch\s*\(/, name: 'fetch' },
  { pattern: /\bXMLHttpRequest\b/, name: 'XMLHttpRequest' },
  { pattern: /\bnew\s+WebSocket\s*\(/, name: 'WebSocket' },
];

// `import ... from 'spec'` and bare side-effect `import 'spec'`.
const FROM_IMPORT = /import\s[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g;
const SIDE_IMPORT = /import\s*['"]([^'"]+)['"]/g;

/** Specifiers that are always allowed (framework + first-party). */
function isAllowedSpecifier(spec: string): boolean {
  return (
    spec.startsWith('.') ||
    spec.startsWith('@site') ||
    spec.startsWith('@theme') ||
    spec.startsWith('@docusaurus') ||
    spec === 'react' ||
    spec.startsWith('react/') ||
    spec === 'react-dom' ||
    spec.startsWith('react-dom/')
  );
}

export function lintSimSource(file: string, source: string, allowlist: string[]): SimLintResult {
  const allow = new Set(allowlist);
  const imported = new Set<string>();
  const offendingImports: string[] = [];

  for (const re of [FROM_IMPORT, SIDE_IMPORT]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source))) {
      const spec = m[1];
      if (isAllowedSpecifier(spec)) continue;
      const pkg = packageName(spec);
      imported.add(pkg);
      if (!allow.has(pkg)) offendingImports.push(pkg);
    }
  }

  const bannedApis: string[] = [];
  for (const b of BANNED) if (b.pattern.test(source)) bannedApis.push(b.name);

  const libMismatch: string[] = [];
  const libsMatch = source.match(/libs\s*:\s*\[([^\]]*)\]/);
  if (libsMatch) {
    const declared = [...libsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
    for (const d of declared) if (!imported.has(d)) libMismatch.push(`declared but not imported: ${d}`);
    for (const i of imported) if (!declared.includes(i)) libMismatch.push(`imported but not declared: ${i}`);
  }

  const ok = offendingImports.length === 0 && bannedApis.length === 0 && libMismatch.length === 0;
  return { file, ok, offendingImports: [...new Set(offendingImports)], bannedApis, libMismatch };
}
