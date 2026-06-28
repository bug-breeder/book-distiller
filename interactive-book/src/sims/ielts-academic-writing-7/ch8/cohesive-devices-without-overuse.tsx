import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Slider } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Linker Density Sweet Spot',
  concept: 'Cohesive Devices Without Overuse',
  caption:
    'Slide the linker count from 0 to 6 and watch the paragraph change — too few leaves ideas unconnected; too many reads as mechanical padding.',
  libs: [],
};

// ---------------------------------------------------------------------------
// Paragraph variants grounded in the lesson's urban farming example (C3).
// Each variant is an array of segments: {text, kind}
// kind: 'prose' | 'linker' | 'needed-linker'
//   prose         — normal sentence text
//   needed-linker — a connective that genuinely earns its place (at most 2)
//   linker        — a mechanical/redundant connective (can be toggled on/off)
// ---------------------------------------------------------------------------

type SegKind = 'prose' | 'needed-linker' | 'linker';

interface Segment {
  text: string;
  kind: SegKind;
  level: number; // which linker "layer" this belongs to (1-based); 0 = always shown
}

// The full paragraph with 6 linkers inserted (maximum density).
// Linkers are inserted progressively: level 1 = first linker added, etc.
// At linker count N, segments with level <= N are shown; level 0 always shown.
// "needed-linker" are the two that genuinely help (while, at the community level).
const SEGMENTS: Segment[] = [
  // Sentence 1
  { text: 'Firstly, ', kind: 'linker', level: 1 },
  { text: 'urban farming delivers environmental and social returns simultaneously.', kind: 'prose', level: 0 },
  // Sentence 2
  { text: ' Secondly, ', kind: 'linker', level: 2 },
  { text: 'shorter supply chains cut transport emissions, ', kind: 'prose', level: 0 },
  { text: 'while ', kind: 'needed-linker', level: 3 },
  { text: 'the plots themselves act as green corridors that reduce the urban heat island.', kind: 'prose', level: 0 },
  // Sentence 3
  { text: ' Moreover, ', kind: 'linker', level: 4 },
  { text: 'at the community level, ', kind: 'needed-linker', level: 3 },
  { text: 'shared growing spaces generate social ties ', kind: 'prose', level: 0 },
  { text: 'and in addition ', kind: 'linker', level: 5 },
  { text: 'give children direct exposure to food production', kind: 'prose', level: 0 },
  { text: ' — furthermore, benefits ', kind: 'linker', level: 6 },
  { text: 'that no supermarket can replicate.', kind: 'prose', level: 0 },
];

// ---------------------------------------------------------------------------
// Band score model grounded in the rubric:
//   0 linkers → ideas feel unconnected (Band ~5)
//   1–2       → minimal but still sparse (Band ~6)
//   2–3       → sweet spot with the two needed linkers (Band ~7)
//   4–6       → mechanical overuse drops band (Band 6 → 5)
// The "needed" linkers (while, at the community level) appear at level 3.
// ---------------------------------------------------------------------------
const BAND_FOR_COUNT: Record<number, number> = {
  0: 5.0,
  1: 5.5,
  2: 6.0,
  3: 7.0, // sweet spot: the two needed-linkers are on, no spam yet
  4: 6.5,
  5: 6.0,
  6: 5.5,
};

function bandLabel(band: number): string {
  if (band >= 7) return 'Band 7 — appropriate range';
  if (band >= 6.5) return 'Band 6.5 — slight overuse';
  if (band >= 6) return 'Band 6 — mechanical feel';
  return 'Band 5.5 — sparse / padding';
}

function bandColor(band: number, isDark: boolean): string {
  if (band >= 7) return isDark ? '#68d391' : '#276749';
  if (band >= 6.5) return isDark ? '#90cdf4' : '#2b6cb0';
  if (band >= 6) return isDark ? '#f6e05e' : '#975a16';
  return isDark ? '#fc8181' : '#9b2c2c';
}

function linkerColor(kind: SegKind, isDark: boolean): string {
  if (kind === 'needed-linker') return isDark ? '#90cdf4' : '#2b6cb0'; // blue = helpful
  if (kind === 'linker') return isDark ? '#fc8181' : '#c53030';        // red = mechanical
  return 'inherit';
}

function linkerBg(kind: SegKind, isDark: boolean): string {
  if (kind === 'needed-linker') return isDark ? 'rgba(144,205,244,0.18)' : 'rgba(43,108,176,0.10)';
  if (kind === 'linker') return isDark ? 'rgba(252,129,129,0.18)' : 'rgba(197,48,48,0.10)';
  return 'transparent';
}

// Build the visible paragraph as React nodes
function buildParagraph(linkerCount: number, isDark: boolean): React.ReactNode[] {
  return SEGMENTS.map((seg, i) => {
    // Always show prose (level 0) and linkers whose level <= linkerCount
    const visible = seg.level === 0 || seg.level <= linkerCount;
    if (!visible) return null;

    if (seg.kind === 'prose') {
      return <span key={i}>{seg.text}</span>;
    }

    return (
      <span
        key={i}
        style={{
          color: linkerColor(seg.kind, isDark),
          background: linkerBg(seg.kind, isDark),
          borderRadius: 3,
          padding: '0 2px',
          fontWeight: 600,
        }}
        title={seg.kind === 'needed-linker' ? 'Genuine cohesive link' : 'Mechanical connective'}
      >
        {seg.text}
      </span>
    );
  });
}

// ---------------------------------------------------------------------------
// Mini curve: shows band score vs linker count as a sparkline bar chart
// ---------------------------------------------------------------------------
function CurveChart({
  current,
  isDark,
  width,
}: {
  current: number;
  isDark: boolean;
  width: number;
}) {
  const counts = [0, 1, 2, 3, 4, 5, 6];
  const chartW = Math.min(width - 32, 440);
  const chartH = 80;
  const padL = 28;
  const padR = 12;
  const padT = 8;
  const padB = 20;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const minBand = 4.5;
  const maxBand = 7.5;

  const xOf = (n: number) => padL + (n / 6) * innerW;
  const yOf = (b: number) =>
    padT + innerH - ((b - minBand) / (maxBand - minBand)) * innerH;

  const mutedLine = isDark ? '#4a5568' : '#e2e8f0';
  const textFill = isDark ? '#a0aec0' : '#718096';

  // Y gridlines at 5, 6, 7
  const gridBands = [5, 6, 7];

  return (
    <svg
      width={chartW}
      height={chartH}
      style={{ display: 'block', margin: '0 auto' }}
      aria-label="CC band score vs linker count"
    >
      {/* Grid */}
      {gridBands.map(b => (
        <g key={b}>
          <line
            x1={padL}
            x2={padL + innerW}
            y1={yOf(b)}
            y2={yOf(b)}
            stroke={mutedLine}
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <text
            x={padL - 4}
            y={yOf(b) + 4}
            textAnchor="end"
            fontSize={9}
            fill={textFill}
          >
            {b}
          </text>
        </g>
      ))}

      {/* Bars */}
      {counts.map(n => {
        const band = BAND_FOR_COUNT[n];
        const isCurrent = n === current;
        const barW = (innerW / 7) * 0.6;
        const x = xOf(n) - barW / 2;
        const barH = yOf(minBand) - yOf(band);
        const y = yOf(band);
        const col = bandColor(band, isDark);
        return (
          <g key={n}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={col}
              opacity={isCurrent ? 1 : 0.35}
            />
            {isCurrent && (
              <rect
                x={x - 2}
                y={y - 2}
                width={barW + 4}
                height={barH + 2}
                rx={3}
                fill="none"
                stroke={col}
                strokeWidth={2}
              />
            )}
            <text
              x={xOf(n)}
              y={yOf(minBand) + 13}
              textAnchor="middle"
              fontSize={9}
              fill={isCurrent ? col : textFill}
              fontWeight={isCurrent ? 700 : 400}
            >
              {n}
            </text>
          </g>
        );
      })}

      {/* X-axis label */}
      <text
        x={padL + innerW / 2}
        y={chartH - 1}
        textAnchor="middle"
        fontSize={9}
        fill={textFill}
      >
        connective count
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Sim({ width, isDark }: SimProps) {
  const [linkerCount, setLinkerCount] = useState(3);

  const band = BAND_FOR_COUNT[linkerCount];
  const color = bandColor(band, isDark);

  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const cardBg = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border = isDark ? '#4a5568' : '#e2e8f0';

  // Count how many mechanical linkers are currently active
  const mechanicalOn = SEGMENTS.filter(
    s => s.kind === 'linker' && s.level > 0 && s.level <= linkerCount,
  ).length;
  const neededOn = SEGMENTS.filter(
    s => s.kind === 'needed-linker' && s.level <= linkerCount,
  ).length;

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        background: bg,
        borderRadius: 10,
        padding: 16,
        userSelect: 'none',
        color: textColor,
      }}
    >
      <ControlRow>
        <Slider
          label="Linkers"
          min={0}
          max={6}
          step={1}
          value={linkerCount}
          onChange={v => setLinkerCount(v)}
        />
      </ControlRow>

      {/* Live paragraph */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 14,
          lineHeight: 1.7,
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0 }}>{buildParagraph(linkerCount, isDark)}</p>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          fontSize: 11,
          color: mutedText,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: isDark ? '#90cdf4' : '#2b6cb0',
            }}
          />
          genuine link ({neededOn} active)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: isDark ? '#fc8181' : '#c53030',
            }}
          />
          mechanical connective ({mechanicalOn} active)
        </span>
      </div>

      {/* Band indicator */}
      <div
        style={{
          background: cardBg,
          border: `2px solid ${color}`,
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, color: mutedText }}>{bandLabel(band)}</span>
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color,
            fontFamily: 'monospace',
            lineHeight: 1,
          }}
        >
          {band.toFixed(1)}
        </span>
      </div>

      {/* Sparkline chart */}
      <CurveChart current={linkerCount} isDark={isDark} width={width} />

      {/* Explanation note */}
      <p
        style={{
          fontSize: 11,
          color: mutedText,
          margin: '10px 0 0',
          textAlign: 'center',
          borderTop: `1px solid ${border}`,
          paddingTop: 8,
        }}
      >
        Sweet spot: 2–3 connectives using a genuine adversative ("while") and a
        locative frame ("at the community level") — not additive stacking.
        Band scores reflect the C&C rubric; red highlights = mechanical padding.
      </p>
    </div>
  );
}
