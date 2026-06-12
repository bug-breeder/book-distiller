// interactive-book/src/sims/types.ts
// The fixed contract every AI-authored sim satisfies. SimHost supplies these props.

export interface SimProps {
  /** Pixel width of the container (responsive), supplied by SimHost. */
  width: number;
  /** Deterministic RNG seed (hashed from the sim title) so initial state is stable. */
  seed: number;
  /** True when the Docusaurus dark theme is active. Sims may also read CSS vars. */
  isDark: boolean;
}

/** Metadata exported by every sim alongside its default component export. */
export interface SimMeta {
  title: string;
  /** Exact concept name this sim illustrates (matches a `### Cn — <name>` heading). */
  concept: string;
  caption: string;
  /** Third-party packages the sim imports (must all be on viz-allowlist.json). */
  libs: string[];
}
