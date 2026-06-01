import { describe, it, expect } from 'vitest';
import { correctFigurePages } from '../../src/figures/fix.js';
import type { FigureLoc } from '../../src/figures/extract.js';

const figs: FigureLoc[] = [
  { label: 'Figure 2.1', page: 38, caption: 'two graphs' },
  { label: 'Figure 2.2', page: 39, caption: 'arpanet map' },
  { label: 'Table 3.1', page: 40, caption: 'payoff matrix' },
];

describe('correctFigurePages', () => {
  it('rewrites a drifted page to the authoritative page', () => {
    const note = '- **Figure 2.2** — p. 38 — "the arpanet"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe('- **Figure 2.2** — p. 39 — "the arpanet"');
    expect(r.fixes).toEqual([{ label: 'Figure 2.2', from: 38, to: 39 }]);
    expect(r.normalized).toEqual([]);
    expect(r.unverified).toEqual([]);
  });

  it('leaves an already-correct citation unchanged', () => {
    const note = '- **Figure 2.1** — p. 38 — "two graphs"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe(note);
    expect(r.fixes).toEqual([]);
    expect(r.normalized).toEqual([]);
  });

  it('normalizes a correct-but-hedged "around p. X" to exact', () => {
    const note = '- **Table 3.1** — around p. 40 — "payoff matrix"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe('- **Table 3.1** — p. 40 — "payoff matrix"');
    expect(r.fixes).toEqual([]);
    expect(r.normalized).toEqual(['Table 3.1']);
  });

  it('leaves a label not in the extraction untouched and reports it unverified', () => {
    const note = '- **Figure 9.9** — p. 99 — "nonexistent"';
    const r = correctFigurePages(note, figs);
    expect(r.text).toBe(note);
    expect(r.fixes).toEqual([]);
    expect(r.unverified).toEqual(['Figure 9.9']);
  });

  it('is idempotent: a second pass makes no further changes', () => {
    const note = '- **Figure 2.2** — p. 38 — "x"\n- **Table 3.1** — around p. 40 — "y"';
    const once = correctFigurePages(note, figs);
    const twice = correctFigurePages(once.text, figs);
    expect(twice.text).toBe(once.text);
    expect(twice.fixes).toEqual([]);
    expect(twice.normalized).toEqual([]);
  });
});
