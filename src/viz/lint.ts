// src/viz/lint.ts
// Deterministic safety lint for AI-authored sim components. Checks that every
// third-party import is on the allowlist, that no banned API is used, and that the
// `meta.libs` declaration matches the actual third-party imports. Scans a
// comment-stripped copy of the source (so APIs/imports named in comments don't
// trigger false positives) and covers static imports, dynamic `import()`, and
// `require()` so none can slip an off-allowlist package past the gate.
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

// Lookbehind `(?<![.\w])` keeps a member access (`api.fetch(`) or a longer
// identifier (`prefetch(`) from being mistaken for the global.
const BANNED: { pattern: RegExp; name: string }[] = [
  { pattern: /(?<![.\w])eval\s*\(/, name: 'eval' },
  { pattern: /\bnew\s+Function\s*\(/, name: 'new Function' },
  { pattern: /dangerouslySetInnerHTML/, name: 'dangerouslySetInnerHTML' },
  { pattern: /(?<![.\w])fetch\s*\(/, name: 'fetch' },
  { pattern: /(?<![.\w])XMLHttpRequest\b/, name: 'XMLHttpRequest' },
  { pattern: /(?<![.\w])WebSocket\s*\(/, name: 'WebSocket' },
];

// Static `import … from 'spec'`, bare side-effect `import 'spec'`, dynamic
// `import('spec')`, and `require('spec')`.
const FROM_IMPORT = /import\s[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g;
const SIDE_IMPORT = /import\s*['"]([^'"]+)['"]/g;
const IMPORT_CALL = /import\s*\(\s*['"]([^'"]+)['"]/g;
const REQUIRE_CALL = /(?<![.\w])require\s*\(\s*['"]([^'"]+)['"]/g;

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

/** Drop block and line comments so commented-out code doesn't trip the lint. The
 * `[^:]` guard before `//` avoids eating a `://` inside a string (e.g. a URL). */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

export function lintSimSource(file: string, source: string, allowlist: string[]): SimLintResult {
  const src = stripComments(source);
  const allow = new Set(allowlist);
  const imported = new Set<string>();
  const offendingImports: string[] = [];

  for (const re of [FROM_IMPORT, SIDE_IMPORT, IMPORT_CALL, REQUIRE_CALL]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      // Type-only imports are erased at compile time and ship no runtime code.
      if (/^import\s+type\b/.test(m[0])) continue;
      const spec = m[1];
      if (isAllowedSpecifier(spec)) continue;
      const pkg = packageName(spec);
      imported.add(pkg);
      if (!allow.has(pkg)) offendingImports.push(pkg);
    }
  }

  const bannedApis: string[] = [];
  for (const b of BANNED) if (b.pattern.test(src)) bannedApis.push(b.name);

  const libMismatch: string[] = [];
  const libsMatch = src.match(/libs\s*:\s*\[([^\]]*)\]/);
  if (libsMatch) {
    const declared = [...libsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
    for (const d of declared) if (!imported.has(d)) libMismatch.push(`declared but not imported: ${d}`);
    for (const i of imported) if (!declared.includes(i)) libMismatch.push(`imported but not declared: ${i}`);
  }

  const ok = offendingImports.length === 0 && bannedApis.length === 0 && libMismatch.length === 0;
  return { file, ok, offendingImports: [...new Set(offendingImports)], bannedApis, libMismatch };
}
