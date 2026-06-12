// src/viz/allowlist.ts
// Pure helpers for the sim import allowlist (interactive-book/viz-allowlist.json).
// The list holds bare package NAMES; deep imports are reduced to their package.

/** '@scope/pkg/sub' -> '@scope/pkg'; 'pkg/sub' -> 'pkg'. */
export function packageName(spec: string): string {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Parse the `allowed` array out of viz-allowlist.json contents. */
export function parseAllowlist(json: string): string[] {
  const data = JSON.parse(json) as { allowed?: unknown };
  return Array.isArray(data.allowed) ? data.allowed.filter((x): x is string => typeof x === 'string') : [];
}

/** Return a new sorted, de-duplicated allowlist with `pkg` added. */
export function addToAllowlist(current: string[], pkg: string): string[] {
  return [...new Set([...current, pkg])].sort((a, b) => a.localeCompare(b));
}
