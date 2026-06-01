// src/figures/fix.ts
import type { FigureLoc } from './extract.js';

export interface FigureFix {
  label: string;
  from: number;
  to: number;
}
export interface CorrectionResult {
  /** the note text with corrected page citations */
  text: string;
  /** citations whose page number was changed */
  fixes: FigureFix[];
  /** labels whose page was already correct but whose `around p.X` hedge was dropped */
  normalized: string[];
  /** cited labels not present in the extraction (left untouched) */
  unverified: string[];
}

// A figure/table page citation on a note line, e.g.
//   - **Figure 2.2** — p. 38 — "..."
//   - **Table 3.1** — around p. 97 — "..."
// Captures: 1 = label ("Figure 2.2"), 2 = cited page number. Tolerates "around ".
const CITATION_RE =
  /\*\*((?:Figure|Table)\s+\d+(?:\.\d+)?)\*\*\s*—\s*(?:around\s+)?p\.\s*(\d+)/g;
// The "— [around ]p. N" tail inside a single matched citation (for rewriting).
const TAIL_RE = /—\s*(?:around\s+)?p\.\s*\d+/;

/**
 * Rewrite each `**Figure/Table N.M** — p. X` (or `around p. X`) citation whose
 * label appears in `figs` so its page equals the authoritative page; a correct
 * but hedged `around p. X` is normalized to exact `p. X`. Citations whose label
 * is not in `figs` are left untouched and reported in `unverified`. Pure.
 */
export function correctFigurePages(noteText: string, figs: FigureLoc[]): CorrectionResult {
  const authByLabel = new Map<string, number>();
  for (const f of figs) authByLabel.set(f.label, f.page);

  const fixes: FigureFix[] = [];
  const normalized = new Set<string>();
  const unverified = new Set<string>();

  const text = noteText.replace(CITATION_RE, (match: string, label: string, pageStr: string) => {
    const auth = authByLabel.get(label);
    if (auth === undefined) {
      unverified.add(label);
      return match; // can't verify -> leave untouched
    }
    const cited = Number(pageStr);
    const hedged = /around\s+p\./i.test(match);
    if (cited === auth && !hedged) return match; // already exact, no hedge
    if (cited !== auth) fixes.push({ label, from: cited, to: auth });
    else normalized.add(label); // page already right, just drop the hedge
    return match.replace(TAIL_RE, `— p. ${auth}`);
  });

  return { text, fixes, normalized: [...normalized], unverified: [...unverified] };
}
