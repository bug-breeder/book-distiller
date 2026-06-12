import { describe, it, expect } from 'vitest';
import { addToAllowlist, parseAllowlist, packageName } from '../../src/viz/allowlist.js';

describe('packageName', () => {
  it('reduces a deep import to its package', () => {
    expect(packageName('d3-geo')).toBe('d3-geo');
    expect(packageName('three/examples/jsm/controls/OrbitControls')).toBe('three');
    expect(packageName('@visx/scale/lib/x')).toBe('@visx/scale');
  });
});

describe('parseAllowlist', () => {
  it('reads the allowed array', () => {
    expect(parseAllowlist('{"allowed":["d3","three"]}')).toEqual(['d3', 'three']);
  });
  it('tolerates a missing/empty file shape', () => {
    expect(parseAllowlist('{}')).toEqual([]);
  });
});

describe('addToAllowlist', () => {
  it('appends a new package and sorts, deduping', () => {
    expect(addToAllowlist(['three', 'd3'], 'animejs')).toEqual(['animejs', 'd3', 'three']);
  });
  it('is idempotent', () => {
    expect(addToAllowlist(['d3', 'three'], 'three')).toEqual(['d3', 'three']);
  });
});
