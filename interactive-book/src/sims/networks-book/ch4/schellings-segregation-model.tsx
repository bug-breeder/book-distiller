import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Slider, Button } from '@site/src/widgets/VizControls';
import { mulberry32 } from '@site/src/lib/rng';

export const meta: SimMeta = {
  title: "Schelling's Segregation Model",
  concept: "Schelling's Segregation Model",
  caption:
    'Drag the threshold slider and press Run — watch mild individual preference cascade into neighbourhood-scale segregation.',
  libs: [],
};

// ── Grid parameters ─────────────────────────────────────────────────────────
const COLS = 40;
const ROWS = 30;
const TOTAL_CELLS = COLS * ROWS;
const EMPTY_COUNT = Math.round(TOTAL_CELLS * 0.10); // 10 % empty
const AGENT_COUNT = TOTAL_CELLS - EMPTY_COUNT;

// Cell states: 0 = empty, 1 = type X, 2 = type O
type Grid = Uint8Array; // length TOTAL_CELLS

function makeRng(seed: number): () => number {
  return mulberry32(seed);
}

function buildGrid(rand: () => number): Grid {
  const grid = new Uint8Array(TOTAL_CELLS);
  // Collect and shuffle all cell indices (Fisher-Yates)
  const indices = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
  for (let i = TOTAL_CELLS - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  const half = Math.floor(AGENT_COUNT / 2);
  for (let k = 0; k < half; k++) grid[indices[k]] = 1;
  for (let k = half; k < AGENT_COUNT; k++) grid[indices[k]] = 2;
  return grid;
}

function cellIdx(col: number, row: number): number {
  return row * COLS + col;
}

function neighbourStats(
  grid: Grid,
  col: number,
  row: number,
  type: number,
): { sameCount: number; totalCount: number } {
  let sameCount = 0;
  let totalCount = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const v = grid[cellIdx(nc, nr)];
      if (v !== 0) {
        totalCount++;
        if (v === type) sameCount++;
      }
    }
  }
  return { sameCount, totalCount };
}

/**
 * One Schelling round: collect unsatisfied agents, shuffle, attempt to move
 * each to a random empty cell that satisfies its threshold.
 */
function stepGrid(grid: Grid, threshold: number, rand: () => number): Grid {
  const next = grid.slice() as Grid;

  // Collect unsatisfied agents
  const unsatisfied: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = cellIdx(c, r);
      const type = next[i];
      if (type === 0) continue;
      const { sameCount, totalCount } = neighbourStats(next, c, r, type);
      if (totalCount > 0 && sameCount < threshold) {
        unsatisfied.push(i);
      }
    }
  }

  // Shuffle unsatisfied list
  for (let i = unsatisfied.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = unsatisfied[i];
    unsatisfied[i] = unsatisfied[j];
    unsatisfied[j] = tmp;
  }

  // Build list of empty cells
  const empty: number[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (next[i] === 0) empty.push(i);
  }

  // Attempt to relocate each unsatisfied agent
  for (const agentIdx of unsatisfied) {
    if (next[agentIdx] === 0) continue; // already vacated this round
    const type = next[agentIdx];
    const tries = Math.min(empty.length, 25);
    let moved = false;
    for (let t = 0; t < tries; t++) {
      const pick = Math.floor(rand() * empty.length);
      const targetIdx = empty[pick];
      if (next[targetIdx] !== 0) {
        empty.splice(pick, 1);
        continue;
      }
      const tc = targetIdx % COLS;
      const tr = Math.floor(targetIdx / COLS);
      const { sameCount: sc, totalCount: tot } = neighbourStats(next, tc, tr, type);
      if (tot === 0 || sc >= threshold) {
        next[agentIdx] = 0;
        next[targetIdx] = type;
        empty.splice(pick, 1);
        empty.push(agentIdx);
        moved = true;
        break;
      }
    }
    if (!moved) {
      // Agent stays put this round
    }
  }
  return next;
}

function segregationIndex(grid: Grid): number {
  let totalSame = 0;
  let totalNeighbours = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const type = grid[cellIdx(c, r)];
      if (type === 0) continue;
      const { sameCount, totalCount } = neighbourStats(grid, c, r, type);
      totalSame += sameCount;
      totalNeighbours += totalCount;
    }
  }
  return totalNeighbours === 0 ? 0 : totalSame / totalNeighbours;
}

// ── Canvas sub-component ────────────────────────────────────────────────────

interface GridCanvasProps {
  grid: Grid;
  cellSize: number;
  emptyColor: string;
  typeXColor: string;
  typeOColor: string;
}

function GridCanvas({ grid, cellSize, emptyColor, typeXColor, typeOColor }: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridW = cellSize * COLS;
  const gridH = cellSize * ROWS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid[cellIdx(c, r)];
        ctx.fillStyle = v === 1 ? typeXColor : v === 2 ? typeOColor : emptyColor;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }, [grid, cellSize, emptyColor, typeXColor, typeOColor]);

  return (
    <canvas
      ref={canvasRef}
      width={gridW}
      height={gridH}
      style={{ display: 'block', marginTop: 6, borderRadius: 4 }}
      aria-label="Schelling segregation grid"
    />
  );
}

function Swatch({ color, label, textColor }: { color: string; label: string; textColor: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: textColor }}>
      <span
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          background: color,
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ── Main sim ────────────────────────────────────────────────────────────────

export default function Sim({ width, seed, isDark }: SimProps) {
  const [threshold, setThreshold] = useState(3);
  const [grid, setGrid] = useState<Grid>(() => buildGrid(makeRng(seed)));
  const [round, setRound] = useState(0);
  const [running, setRunning] = useState(false);

  // Mutable RNG ref so step() continues the same sequence
  const randRef = useRef<(() => number)>(makeRng(seed));

  const doReset = useCallback(() => {
    setRunning(false);
    const r = makeRng(seed);
    randRef.current = r;
    setGrid(buildGrid(r));
    setRound(0);
  }, [seed]);

  const doStep = useCallback(() => {
    const r = randRef.current;
    setGrid(prev => stepGrid(prev, threshold, r));
    setRound(n => n + 1);
  }, [threshold]);

  const toggleRun = useCallback(() => setRunning(r => !r), []);

  // Animation interval
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const r = randRef.current;
      setGrid(prev => stepGrid(prev, threshold, r));
      setRound(n => n + 1);
    }, 100);
    return () => clearInterval(id);
  }, [running, threshold]);

  // ── Responsive sizing ──────────────────────────────────────────────────────
  const cellSize = Math.max(3, Math.floor(width / COLS));

  // ── Colors ─────────────────────────────────────────────────────────────────
  const bg         = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor  = isDark ? '#e2e8f0' : '#1a202c';
  const emptyColor = isDark ? '#2d3748' : '#e2e8f0';
  const typeXColor = '#3b82f6'; // blue
  const typeOColor = '#f97316'; // orange

  const segIdx = Math.round(segregationIndex(grid) * 100);
  const segColor = segIdx > 75 ? '#e53e3e' : segIdx > 55 ? '#dd6b20' : '#38a169';

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        background: bg,
        borderRadius: 8,
        padding: 8,
        userSelect: 'none',
        color: textColor,
      }}
    >
      <ControlRow>
        <Slider
          label="Threshold"
          min={1}
          max={8}
          step={1}
          value={threshold}
          onChange={v => setThreshold(v)}
        />
        <Button label="Step" onClick={doStep} />
        <Button label={running ? 'Stop' : 'Run'} onClick={toggleRun} />
        <Button label="Reset" onClick={doReset} />
      </ControlRow>

      <GridCanvas
        grid={grid}
        cellSize={cellSize}
        emptyColor={emptyColor}
        typeXColor={typeXColor}
        typeOColor={typeOColor}
      />

      <div
        style={{
          display: 'flex',
          gap: 20,
          padding: '6px 4px 2px',
          flexWrap: 'wrap',
          fontSize: 12,
          color: textColor,
        }}
      >
        <span>
          <strong>Round:</strong> {round}
        </span>
        <span>
          <strong>Same-neighbour %:</strong>{' '}
          <span style={{ color: segColor, fontWeight: 700 }}>{segIdx}%</span>
        </span>
        <span style={{ opacity: 0.7 }}>
          Threshold {threshold}: each agent wants ≥{threshold} same-type neighbours
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          padding: '4px 4px 0',
          flexWrap: 'wrap',
          alignItems: 'center',
          fontSize: 11,
        }}
      >
        <Swatch color={typeXColor} label="Type X" textColor={textColor} />
        <Swatch color={typeOColor} label="Type O" textColor={textColor} />
        <Swatch color={emptyColor} label="Empty" textColor={textColor} />
      </div>
    </div>
  );
}
