import React, {useCallback, useEffect, useRef, useState} from 'react';
import VizFrame from './VizFrame';

const EMPTY = -1;
const COLORS = ['#4f8cff', '#f0883e']; // type 0, type 1
const EMPTY_COLOR_LIGHT = '#eef1f5';
const EMPTY_COLOR_DARK = '#1c2128';

interface SchellingProps {
  gridSize?: number;
  threshold?: number;
  emptyFraction?: number;
}

interface Stats {
  round: number;
  satisfiedPct: number;
  similarityPct: number;
}

/**
 * Schelling's segregation model. Each agent wants at least `threshold` of its
 * occupied neighbors to share its type; unhappy agents relocate to random empty
 * cells. Even mild preferences drive near-total segregation — the chapter's
 * central, counter-intuitive result.
 */
export default function Schelling({
  gridSize = 45,
  threshold: initialThreshold = 3,
  emptyFraction = 0.1,
}: SchellingProps): React.ReactElement {
  const N = gridSize;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<Int8Array>(new Int8Array(N * N));
  const rafRef = useRef<number | null>(null);
  const lastStepRef = useRef<number>(0);

  const [threshold, setThreshold] = useState(initialThreshold);
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;

  const [running, setRunning] = useState(false);
  const runningRef = useRef(running);
  runningRef.current = running;

  const [stats, setStats] = useState<Stats>({round: 0, satisfiedPct: 0, similarityPct: 0});

  const seed = useCallback(() => {
    const g = gridRef.current;
    for (let i = 0; i < g.length; i++) {
      if (Math.random() < emptyFraction) g[i] = EMPTY;
      else g[i] = Math.random() < 0.5 ? 0 : 1;
    }
  }, [emptyFraction]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const px = canvas.width;
    const cell = px / N;
    const dark = document.documentElement.dataset.theme === 'dark';
    ctx.clearRect(0, 0, px, px);
    const g = gridRef.current;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = g[r * N + c];
        ctx.fillStyle = v === EMPTY ? (dark ? EMPTY_COLOR_DARK : EMPTY_COLOR_LIGHT) : COLORS[v];
        ctx.fillRect(c * cell, r * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  }, [N]);

  // Returns [satisfied?, sameNeighbors, occupiedNeighbors] for one cell.
  const evaluate = useCallback(
    (g: Int8Array, r: number, c: number): [boolean, number, number] => {
      const self = g[r * N + c];
      let same = 0;
      let occ = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
          const nv = g[nr * N + nc];
          if (nv === EMPTY) continue;
          occ++;
          if (nv === self) same++;
        }
      }
      const satisfied = occ === 0 || same >= thresholdRef.current;
      return [satisfied, same, occ];
    },
    [N],
  );

  const computeStats = useCallback(
    (round: number): Stats => {
      const g = gridRef.current;
      let occupied = 0;
      let satisfied = 0;
      let simSum = 0;
      let simCount = 0;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (g[r * N + c] === EMPTY) continue;
          occupied++;
          const [ok, same, occ] = evaluate(g, r, c);
          if (ok) satisfied++;
          if (occ > 0) {
            simSum += same / occ;
            simCount++;
          }
        }
      }
      return {
        round,
        satisfiedPct: occupied ? Math.round((satisfied / occupied) * 100) : 0,
        similarityPct: simCount ? Math.round((simSum / simCount) * 100) : 0,
      };
    },
    [N, evaluate],
  );

  const step = useCallback((): boolean => {
    const g = gridRef.current;
    const unhappy: number[] = [];
    const empties: number[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const idx = r * N + c;
        if (g[idx] === EMPTY) {
          empties.push(idx);
        } else if (!evaluate(g, r, c)[0]) {
          unhappy.push(idx);
        }
      }
    }
    // Move each unhappy agent to a random empty cell.
    for (let i = empties.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [empties[i], empties[j]] = [empties[j], empties[i]];
    }
    let ei = 0;
    for (const from of unhappy) {
      if (ei >= empties.length) break;
      const to = empties[ei++];
      g[to] = g[from];
      g[from] = EMPTY;
      empties.push(from); // the vacated cell becomes available
    }
    setStats((s) => computeStats(s.round + 1));
    draw();
    return unhappy.length > 0;
  }, [N, evaluate, computeStats, draw]);

  const reset = useCallback(() => {
    setRunning(false);
    seed();
    draw();
    setStats(computeStats(0));
  }, [seed, draw, computeStats]);

  // Init + responsive sizing.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const sizeCanvas = () => {
      const w = Math.max(200, Math.floor(container.clientWidth));
      canvas.width = w;
      canvas.height = w;
      draw();
    };
    seed();
    sizeCanvas();
    setStats(computeStats(0));
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(container);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run loop (throttled to ~8 steps/sec).
  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const loop = (t: number) => {
      if (t - lastStepRef.current > 120) {
        lastStepRef.current = t;
        const moved = step();
        if (!moved) {
          setRunning(false);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, step]);

  const controls = (
    <>
      <label className="viz__control">
        Threshold: <strong>{threshold}</strong> same-type neighbors
        <input
          type="range"
          min={1}
          max={8}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </label>
      <div className="viz__btns">
        <button type="button" className="viz__btn" onClick={() => step()} disabled={running}>
          Step
        </button>
        <button type="button" className="viz__btn viz__btn--primary" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Run'}
        </button>
        <button type="button" className="viz__btn" onClick={reset}>
          Reset
        </button>
      </div>
    </>
  );

  return (
    <VizFrame
      title="Schelling's Segregation Model"
      caption="Lower the threshold to a mild preference (say 3 of 8) and press Run — watch segregation emerge anyway."
      controls={controls}
      note={`Round ${stats.round} · ${stats.satisfiedPct}% of agents satisfied · ${stats.similarityPct}% average same-type neighbors`}>
      <div ref={containerRef} className="viz__canvas-wrap">
        <canvas ref={canvasRef} className="viz__canvas" aria-label="Schelling segregation grid" />
      </div>
    </VizFrame>
  );
}
