import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Slider } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Band Score Calculator',
  concept: 'The Four Marking Criteria',
  caption: 'Drag each criterion band to see how the mean rounds to your overall Writing band.',
  libs: [],
};

/** Round to the nearest 0.5 band, per IELTS convention. */
function roundToHalf(x: number): number {
  return Math.round(x * 2) / 2;
}

/** Return a colour for a band value (0–9). */
function bandColor(band: number, isDark: boolean): string {
  if (band >= 7.5) return isDark ? '#68d391' : '#276749';
  if (band >= 6.5) return isDark ? '#90cdf4' : '#2b6cb0';
  if (band >= 5.5) return isDark ? '#f6e05e' : '#975a16';
  return isDark ? '#fc8181' : '#9b2c2c';
}

const CRITERIA: { key: string; label: string; abbr: string }[] = [
  { key: 'tr',  label: 'Task Response',               abbr: 'TR'  },
  { key: 'cc',  label: 'Coherence & Cohesion',         abbr: 'CC'  },
  { key: 'lr',  label: 'Lexical Resource',             abbr: 'LR'  },
  { key: 'gra', label: 'Grammatical Range & Accuracy', abbr: 'GRA' },
];

export default function Sim({ width, isDark }: SimProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    tr: 6,
    cc: 7,
    lr: 6,
    gra: 7,
  });

  function setScore(key: string, val: number) {
    setScores(prev => ({ ...prev, [key]: val }));
  }

  const sum = CRITERIA.reduce((acc, c) => acc + scores[c.key], 0);
  const rawMean = sum / 4;
  const overall = roundToHalf(rawMean);

  const bg        = isDark ? '#1e1e2e' : '#f8f9fb';
  const cardBg    = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border    = isDark ? '#4a5568' : '#e2e8f0';

  const overallColor = bandColor(overall, isDark);

  // Bar chart: each criterion occupies equal vertical space
  const barAreaWidth = Math.min(width - 32, 560);
  const BAR_MAX = barAreaWidth * 0.55; // max bar pixel length for band 9
  const barHeight = 22;
  const rowGap = 10;
  const leftColW = 46; // label width
  const svgH = CRITERIA.length * (barHeight + rowGap) + 8;

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
      {/* Sliders */}
      <div style={{ marginBottom: 16 }}>
        {CRITERIA.map(c => (
          <ControlRow key={c.key}>
            <Slider
              label={`${c.abbr}`}
              min={0}
              max={9}
              step={0.5}
              value={scores[c.key]}
              onChange={v => setScore(c.key, v)}
            />
          </ControlRow>
        ))}
      </div>

      {/* Bar visualisation */}
      <svg
        width={barAreaWidth}
        height={svgH}
        style={{ display: 'block', margin: '0 auto 16px' }}
        aria-label="Criterion band score bars"
      >
        {CRITERIA.map((c, i) => {
          const y = i * (barHeight + rowGap) + 4;
          const barW = (scores[c.key] / 9) * BAR_MAX;
          const color = bandColor(scores[c.key], isDark);
          return (
            <g key={c.key}>
              {/* Label */}
              <text
                x={leftColW - 4}
                y={y + barHeight / 2 + 5}
                textAnchor="end"
                fontSize={12}
                fontWeight={600}
                fill={textColor}
                fontFamily="monospace"
              >
                {c.abbr}
              </text>
              {/* Background track */}
              <rect
                x={leftColW}
                y={y}
                width={BAR_MAX}
                height={barHeight}
                rx={4}
                fill={isDark ? '#4a5568' : '#e2e8f0'}
              />
              {/* Filled bar */}
              <rect
                x={leftColW}
                y={y}
                width={Math.max(barW, 0)}
                height={barHeight}
                rx={4}
                fill={color}
                opacity={0.85}
              />
              {/* Band value label */}
              <text
                x={leftColW + BAR_MAX + 8}
                y={y + barHeight / 2 + 5}
                fontSize={13}
                fontWeight={700}
                fill={color}
                fontFamily="monospace"
              >
                {scores[c.key].toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Overall band result card */}
      <div
        style={{
          background: cardBg,
          border: `2px solid ${overallColor}`,
          borderRadius: 10,
          padding: '14px 20px',
          maxWidth: barAreaWidth,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: mutedText, marginBottom: 2 }}>
            Mean ({CRITERIA.map(c => scores[c.key].toFixed(1)).join(' + ')}) ÷ 4
          </div>
          <div style={{ fontSize: 13, color: mutedText }}>
            = {rawMean.toFixed(2)} &rarr; rounds to nearest 0.5
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: mutedText, marginBottom: 2 }}>
            Overall Writing Band
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: overallColor,
              lineHeight: 1,
              fontFamily: 'monospace',
            }}
          >
            {overall.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          marginTop: 12,
          flexWrap: 'wrap',
          fontSize: 11,
          color: mutedText,
        }}
      >
        {[
          { range: '7.5 – 9', label: 'Band 8+', color: bandColor(8, isDark) },
          { range: '6.5 – 7', label: 'Band 7',  color: bandColor(7, isDark) },
          { range: '5.5 – 6', label: 'Band 6',  color: bandColor(6, isDark) },
          { range: '0 – 5',   label: 'Band ≤5', color: bandColor(5, isDark) },
        ].map(item => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                background: item.color,
                opacity: 0.85,
              }}
            />
            {item.label}
          </span>
        ))}
      </div>

      {/* Rounding note */}
      <p
        style={{
          fontSize: 11,
          color: mutedText,
          textAlign: 'center',
          marginTop: 10,
          marginBottom: 0,
          borderTop: `1px solid ${border}`,
          paddingTop: 8,
        }}
      >
        IELTS rounding: .25 rounds up to .5; .75 rounds up to the next whole band.
        All four criteria carry exactly equal weight (25% each).
      </p>
    </div>
  );
}
