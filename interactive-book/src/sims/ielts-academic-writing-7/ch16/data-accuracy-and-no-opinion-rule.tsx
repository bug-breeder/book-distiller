import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Slider } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Approximation Language Trainer',
  concept: 'Data Accuracy And No Opinion Rule',
  caption:
    'Drag the bar to any value. See when to hedge ("approximately 35%") vs. when to be precise ("exactly 25%") — and why adding a reason always breaks the No Opinion Rule.',
  libs: [],
};

// ---------------------------------------------------------------------------
// Approximation logic — mirrors the lesson's "confidence interval" metaphor
// ---------------------------------------------------------------------------

/** Gridline interval options */
const GRID_OPTIONS = [10, 25, 50] as const;
type GridInterval = (typeof GRID_OPTIONS)[number];

interface ApproxResult {
  onGridline: boolean;
  nearGridline: boolean;  // within 2 percentage points of a gridline
  nearestGridline: number;
  phrase: string;
  precision: 'exact' | 'close' | 'hedge';
}

function computeApprox(value: number, gridInterval: GridInterval): ApproxResult {
  const gridlines: number[] = [];
  for (let g = 0; g <= 100; g += gridInterval) {
    gridlines.push(g);
  }

  const nearest = gridlines.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
  const diff = Math.abs(value - nearest);
  const onGridline = diff === 0;
  const nearGridline = diff <= 2 && !onGridline;

  let phrase: string;
  let precision: 'exact' | 'close' | 'hedge';

  if (onGridline) {
    precision = 'exact';
    phrase = `exactly ${value}%`;
  } else if (nearGridline) {
    precision = 'close';
    const above = value > nearest;
    if (diff <= 1) {
      phrase = above
        ? `just over ${nearest}%`
        : `just under ${nearest}%`;
    } else {
      phrase = above
        ? `slightly above ${nearest}%`
        : `slightly below ${nearest}%`;
    }
  } else {
    precision = 'hedge';
    // Find the two bracketing gridlines
    const lower = gridlines.filter(g => g <= value).pop() ?? 0;
    const upper = gridlines.find(g => g > value) ?? 100;
    const mid = (lower + upper) / 2;
    const distFromLower = value - lower;
    const distFromUpper = upper - value;

    if (Math.abs(value - mid) <= 2) {
      // Halfway between — use "around X" where X is mid
      phrase = `around ${Math.round(mid)}%`;
    } else if (distFromLower < distFromUpper) {
      // Closer to lower gridline
      phrase = `just over ${lower}%`;
    } else {
      // Closer to upper gridline
      phrase = `just under ${upper}%`;
    }
  }

  return { onGridline, nearGridline, nearestGridline: nearest, phrase, precision };
}

// ---------------------------------------------------------------------------
// Chart drawing — pure React/SVG, no D3 needed
// ---------------------------------------------------------------------------

function BarChart({
  value,
  gridInterval,
  isDark,
  width,
}: {
  value: number;
  gridInterval: GridInterval;
  isDark: boolean;
  width: number;
}) {
  const height = Math.min(Math.round(width * 0.55), 260);
  const padLeft = 44;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const barFill = isDark ? '#63b3ed' : '#3182ce';
  const gridColor = isDark ? '#4a5568' : '#e2e8f0';
  const axisColor = isDark ? '#718096' : '#a0aec0';
  const labelColor = isDark ? '#cbd5e0' : '#4a5568';
  const textBg = isDark ? '#2d3748' : '#ffffff';

  const gridlines: number[] = [];
  for (let g = 0; g <= 100; g += gridInterval) {
    gridlines.push(g);
  }

  function pctToY(pct: number) {
    return padTop + chartH * (1 - pct / 100);
  }

  const barX = padLeft + chartW * 0.25;
  const barWidth = chartW * 0.5;
  const barTop = pctToY(value);
  const barBottom = pctToY(0);
  const barH = barBottom - barTop;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Gridlines */}
      {gridlines.map(g => {
        const y = pctToY(g);
        return (
          <g key={g}>
            <line
              x1={padLeft}
              y1={y}
              x2={padLeft + chartW}
              y2={y}
              stroke={gridColor}
              strokeWidth={g === 0 ? 1.5 : 1}
              strokeDasharray={g === 0 ? undefined : '4 3'}
            />
            <text
              x={padLeft - 6}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill={axisColor}
            >
              {g}%
            </text>
          </g>
        );
      })}

      {/* Bar */}
      <rect
        x={barX}
        y={barTop}
        width={barWidth}
        height={barH}
        fill={barFill}
        rx={3}
      />

      {/* Value label on top of bar */}
      <rect
        x={barX + barWidth / 2 - 22}
        y={barTop - 22}
        width={44}
        height={18}
        rx={4}
        fill={textBg}
        stroke={barFill}
        strokeWidth={1}
      />
      <text
        x={barX + barWidth / 2}
        y={barTop - 9}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill={barFill}
      >
        {value}%
      </text>

      {/* X-axis label */}
      <text
        x={barX + barWidth / 2}
        y={height - 4}
        textAnchor="middle"
        fontSize={11}
        fill={labelColor}
      >
        Country A
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Phrase display cards
// ---------------------------------------------------------------------------

function PhraseCard({
  label,
  text,
  variant,
  isDark,
  compact,
}: {
  label: string;
  text: string;
  variant: 'good' | 'warn' | 'bad';
  isDark: boolean;
  compact: boolean;
}) {
  const colors = {
    good: {
      bg: isDark ? '#1a3a4a' : '#ebf8ff',
      border: isDark ? '#2c7a7b' : '#90cdf4',
      label: isDark ? '#4fd1c5' : '#2c5282',
      text: isDark ? '#e2e8f0' : '#1a202c',
    },
    warn: {
      bg: isDark ? '#3d2a00' : '#fffbeb',
      border: isDark ? '#b7791f' : '#f6e05e',
      label: isDark ? '#f6e05e' : '#975a16',
      text: isDark ? '#e2e8f0' : '#1a202c',
    },
    bad: {
      bg: isDark ? '#3b1111' : '#fff5f5',
      border: isDark ? '#c53030' : '#feb2b2',
      label: isDark ? '#fc8181' : '#c53030',
      text: isDark ? '#e2e8f0' : '#1a202c',
    },
  };

  const c = colors[variant];

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: compact ? '8px 10px' : '10px 14px',
        marginBottom: 8,
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: c.label,
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: compact ? 12 : 13,
          color: c.text,
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Sim({ width, isDark }: SimProps) {
  const [value, setValue] = useState(37);
  const [gridInterval, setGridInterval] = useState<GridInterval>(10);
  const [showOpinion, setShowOpinion] = useState(false);

  const compact = width < 480;
  const approx = computeApprox(value, gridInterval);

  const bg = isDark ? '#1a202c' : '#f8f9fb';
  const cardBg = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedColor = isDark ? '#a0aec0' : '#718096';
  const borderColor = isDark ? '#4a5568' : '#e2e8f0';
  const accentBg = isDark ? '#2b4a6b' : '#ebf8ff';
  const accentText = isDark ? '#90cdf4' : '#2c5282';

  const precisionLabels: Record<string, string> = {
    exact: 'Bar lands on a gridline — no hedge needed',
    close: 'Bar is very close to a gridline — light hedge',
    hedge: 'Bar is between gridlines — hedge required',
  };

  const precisionColors: Record<string, string> = {
    exact: isDark ? '#68d391' : '#276749',
    close: isDark ? '#f6e05e' : '#975a16',
    hedge: isDark ? '#fc8181' : '#c53030',
  };

  // Build the false-precision sentence (what NOT to write)
  const falsePrecisionSentence =
    approx.precision === 'exact'
      ? null
      : `Country A had ${value}% of visitors.`;

  // Build the correct sentence
  const correctSentence = `Country A attracted ${approx.phrase} of visitors.`;

  // Opinion sentence shown when toggle is on
  const opinionSentence = `Country A attracted ${approx.phrase} of visitors, probably because of its attractive climate.`;

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: bg,
        borderRadius: 10,
        padding: compact ? 12 : 16,
        color: textColor,
      }}
    >
      {/* Controls */}
      <ControlRow>
        <Slider
          label="Bar value"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={setValue}
        />
      </ControlRow>

      <ControlRow>
        <span style={{ fontSize: 12, color: mutedColor, marginRight: 8 }}>
          Gridline spacing:
        </span>
        {GRID_OPTIONS.map(g => (
          <button
            key={g}
            type="button"
            onClick={() => setGridInterval(g)}
            style={{
              padding: compact ? '3px 10px' : '4px 14px',
              fontSize: compact ? 11 : 12,
              fontWeight: 600,
              borderRadius: 16,
              border: `2px solid ${g === gridInterval ? accentText : borderColor}`,
              background: g === gridInterval ? accentBg : cardBg,
              color: g === gridInterval ? accentText : textColor,
              cursor: 'pointer',
              marginRight: 6,
            }}
          >
            {g}%
          </button>
        ))}
      </ControlRow>

      {/* Chart */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '8px 4px 4px',
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <BarChart
          value={value}
          gridInterval={gridInterval}
          isDark={isDark}
          width={width - (compact ? 28 : 40)}
        />
      </div>

      {/* Precision indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          padding: '6px 10px',
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          fontSize: compact ? 11 : 12,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: precisionColors[approx.precision],
            flexShrink: 0,
          }}
        />
        <span style={{ color: precisionColors[approx.precision], fontWeight: 600 }}>
          {precisionLabels[approx.precision]}
        </span>
      </div>

      {/* False precision warning (only when not exact) */}
      {falsePrecisionSentence && (
        <PhraseCard
          label="False precision — avoid"
          text={falsePrecisionSentence}
          variant="bad"
          isDark={isDark}
          compact={compact}
        />
      )}

      {/* Correct phrasing */}
      <PhraseCard
        label={
          approx.precision === 'exact'
            ? 'Exact — no hedge needed'
            : 'Correct approximation phrase'
        }
        text={correctSentence}
        variant="good"
        isDark={isDark}
        compact={compact}
      />

      {/* No Opinion Rule toggle */}
      <div
        style={{
          marginTop: 6,
          borderTop: `1px solid ${borderColor}`,
          paddingTop: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: showOpinion ? 8 : 0,
          }}
        >
          <button
            type="button"
            onClick={() => setShowOpinion(v => !v)}
            style={{
              padding: compact ? '4px 10px' : '5px 14px',
              fontSize: compact ? 11 : 12,
              fontWeight: 600,
              borderRadius: 6,
              border: `1px solid ${borderColor}`,
              background: showOpinion ? (isDark ? '#3b1111' : '#fff5f5') : cardBg,
              color: showOpinion ? (isDark ? '#fc8181' : '#c53030') : textColor,
              cursor: 'pointer',
            }}
          >
            {showOpinion ? 'Hide opinion example' : 'Show opinion example'}
          </button>
          <span style={{ fontSize: compact ? 11 : 12, color: mutedColor }}>
            No Opinion Rule
          </span>
        </div>

        {showOpinion && (
          <PhraseCard
            label="Breaks the No Opinion Rule — delete the reason clause"
            text={opinionSentence}
            variant="warn"
            isDark={isDark}
            compact={compact}
          />
        )}
      </div>

      {/* Phrase reference */}
      <div
        style={{
          marginTop: 12,
          borderTop: `1px solid ${borderColor}`,
          paddingTop: 10,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            color: mutedColor,
            margin: '0 0 6px',
          }}
        >
          Approximation phrase toolkit
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
          {[
            'exactly X%',
            'just over X%',
            'just under X%',
            'approximately X%',
            'around X%',
            'roughly X%',
            'slightly above X%',
            'slightly below X%',
          ].map(ph => (
            <span
              key={ph}
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: compact ? 10 : 11,
                fontWeight: 600,
                background: accentBg,
                color: accentText,
                border: `1px solid ${accentText}`,
              }}
            >
              {ph}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
