import { describe, it, expect } from 'vitest';
import { lintSimSource } from '../../src/viz/lint.js';

const allow = ['d3', 'three'];

describe('lintSimSource', () => {
  it('passes a clean sim that imports only allowlisted + local + react', () => {
    const src = `
import React from 'react';
import * as d3 from 'd3';
import { useRng } from '@site/src/lib/useRng';
import type { SimProps } from '../types';
export const meta = { title: 'X', concept: 'Y', caption: 'Z', libs: ['d3'] } as const;
export default function Sim(props: SimProps) { return <div/>; }
`;
    const r = lintSimSource('a.tsx', src, allow);
    expect(r.ok).toBe(true);
  });

  it('flags an off-allowlist import', () => {
    const src = `import confetti from 'canvas-confetti';\nexport const meta={title:'',concept:'',caption:'',libs:['canvas-confetti']};`;
    const r = lintSimSource('a.tsx', src, allow);
    expect(r.ok).toBe(false);
    expect(r.offendingImports).toContain('canvas-confetti');
  });

  it('reduces a deep import to its package before checking', () => {
    const src = `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';\nexport const meta={title:'',concept:'',caption:'',libs:['three']};`;
    expect(lintSimSource('a.tsx', src, allow).ok).toBe(true);
  });

  it('bans dangerous APIs', () => {
    const src = `import * as d3 from 'd3';\nconst x = eval('1');\nexport const meta={title:'',concept:'',caption:'',libs:['d3']};`;
    const r = lintSimSource('a.tsx', src, allow);
    expect(r.ok).toBe(false);
    expect(r.bannedApis).toContain('eval');
  });

  it('flags meta.libs that disagree with actual imports', () => {
    const src = `import * as d3 from 'd3';\nexport const meta={title:'',concept:'',caption:'',libs:['three']};`;
    const r = lintSimSource('a.tsx', src, allow);
    expect(r.ok).toBe(false);
    expect(r.libMismatch.length).toBeGreaterThan(0);
  });
});
