import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Pie Proportion Language',
  concept: 'Pie Charts And Proportion Language',
  caption:
    'Click a slice to see how to describe its share using Band 7 proportion phrases — not "the percentage of X is …".',
  libs: ['recharts'],
};

// ---------------------------------------------------------------------------
// Data — two pie-chart snapshots from the lesson's worked example
// (household spending 1990 vs 2020, from the Practice section)
// ---------------------------------------------------------------------------

interface Slice {
  name: string;
  value: number;
}

const DATA_1990: Slice[] = [
  { name: 'Housing', value: 35 },
  { name: 'Food', value: 28 },
  { name: 'Transport', value: 15 },
  { name: 'Clothing', value: 12 },
  { name: 'Other', value: 10 },
];

const DATA_2020: Slice[] = [
  { name: 'Housing', value: 42 },
  { name: 'Food', value: 20 },
  { name: 'Transport', value: 18 },
  { name: 'Clothing', value: 8 },
  { name: 'Other', value: 12 },
];

// ---------------------------------------------------------------------------
// Proportion phrases — the core Band 7 toolkit from the lesson
// ---------------------------------------------------------------------------

/** Return an approximate fractional phrase for a percentage value. */
function fractionPhrase(pct: number): string {
  if (pct >= 50) return 'over half';
  if (pct >= 45) return 'nearly half';
  if (pct >= 40) return 'approximately two fifths';
  if (pct >= 33) return 'roughly a third';
  if (pct >= 28) return 'just over a quarter';
  if (pct >= 25) return 'a quarter';
  if (pct >= 20) return 'approximately a fifth';
  if (pct >= 15) return 'about one in six';
  if (pct >= 10) return 'roughly a tenth';
  return 'a small fraction';
}

/** Cycle through the four Band 7 proportion verbs so we model variety. */
const PROP_VERBS = ['accounted for', 'made up', 'represented', 'comprised'];

function propVerb(sliceIndex: number): string {
  return PROP_VERBS[sliceIndex % PROP_VERBS.length];
}

/** Generate a Band 7 sentence for a clicked slice. */
function buildSentence(
  slice: Slice,
  sliceIndex: number,
  year: number,
  allSlices: Slice[],
): string {
  const verb = propVerb(sliceIndex);
  const fraction = fractionPhrase(slice.value);
  const rank = [...allSlices]
    .sort((a, b) => b.value - a.value)
    .findIndex(s => s.name === slice.name);

  const rankLabel =
    rank === 0
      ? 'the largest share'
      : rank === 1
      ? 'the second largest share'
      : rank === allSlices.length - 1
      ? 'the smallest share'
      : 'a moderate share';

  return `In ${year}, ${slice.name.toLowerCase()} ${verb} ${rankLabel} of household spending at ${slice.value}% — ${fraction} of total expenditure.`;
}

/** Build the "bundle the tail" sentence for the two smallest slices. */
function buildBundleSentence(slices: Slice[], year: number): string {
  const sorted = [...slices].sort((a, b) => a.value - b.value);
  const tail = sorted.slice(0, 2);
  const combined = tail[0].value + tail[1].value;
  return `The remaining categories (${tail[0].name.toLowerCase()} and ${tail[1].name.toLowerCase()}) together made up ${combined}% of spending in ${year}.`;
}

/** Overview sentence covering both pies. */
function buildOverview(data1990: Slice[], data2020: Slice[]): string {
  const top90 = [...data1990].sort((a, b) => b.value - a.value)[0];
  const biggestGainer = data2020
    .map(s => {
      const old = data1990.find(o => o.name === s.name)!;
      return { name: s.name, change: s.value - old.value };
    })
    .sort((a, b) => b.change - a.change)[0];
  return `Overall, ${top90.name.toLowerCase()} dominated household spending in both years, while ${biggestGainer.name.toLowerCase()} saw the most significant increase — rising from ${data1990.find(s => s.name === biggestGainer.name)!.value}% to ${data2020.find(s => s.name === biggestGainer.name)!.value}%.`;
}

// ---------------------------------------------------------------------------
// Colours — accessible hues that work in light and dark
// ---------------------------------------------------------------------------

const SLICE_COLORS_LIGHT = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f687b3'];
const SLICE_COLORS_DARK  = ['#63b3ed', '#68d391', '#f6ad55', '#b794f4', '#fbb6ce'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Sim({ width, isDark }: SimProps) {
  const [year, setYear] = useState<1990 | 2020>(1990);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showBundle, setShowBundle] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  const data = year === 1990 ? DATA_1990 : DATA_2020;
  const colors = isDark ? SLICE_COLORS_DARK : SLICE_COLORS_LIGHT;

  const bg        = isDark ? '#1a202c' : '#f8f9fb';
  const cardBg    = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border    = isDark ? '#4a5568' : '#e2e8f0';
  const accentBg  = isDark ? '#2b6cb0' : '#ebf8ff';
  const accentText= isDark ? '#90cdf4' : '#2c5282';
  const warnBg    = isDark ? '#744210' : '#fefcbf';
  const warnText  = isDark ? '#f6e05e' : '#975a16';

  const compact   = width < 480;
  const chartSize = Math.min(width - (compact ? 24 : 48), 340);
  const outerR    = Math.round(chartSize / 2 * 0.88);
  const innerR    = Math.round(outerR * 0.45);

  const activeSentence =
    activeIndex !== null
      ? buildSentence(data[activeIndex], activeIndex, year, data)
      : null;

  const bundleSentence = buildBundleSentence(data, year);
  const overviewSentence = buildOverview(DATA_1990, DATA_2020);

  function handleReset() {
    setActiveIndex(null);
    setShowBundle(false);
    setShowOverview(false);
  }

  // Custom label — typed with PieLabelRenderProps; all fields are optional so guard them
  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const cx         = Number(props.cx         ?? 0);
    const cy         = Number(props.cy         ?? 0);
    const midAngle   = Number(props.midAngle   ?? 0);
    const innerRadius = Number(props.innerRadius ?? 0);
    const outerRadius = Number(props.outerRadius ?? 0);
    const percent    = Number(props.percent    ?? 0);

    if (percent < 0.08) return null; // skip tiny labels
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={isDark ? '#1a202c' : '#fff'}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={compact ? 10 : 12}
        fontWeight={700}
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: bg,
        borderRadius: 10,
        padding: compact ? 12 : 16,
        color: textColor,
        userSelect: 'none',
      }}
    >
      {/* Year toggle */}
      <ControlRow>
        {([1990, 2020] as const).map(y => (
          <button
            key={y}
            type="button"
            onClick={() => { setYear(y); setActiveIndex(null); setShowBundle(false); }}
            style={{
              padding: compact ? '5px 14px' : '6px 20px',
              fontSize: compact ? 12 : 14,
              fontWeight: 700,
              borderRadius: 20,
              border: `2px solid ${y === year ? accentText : border}`,
              background: y === year ? accentBg : cardBg,
              color: y === year ? accentText : textColor,
              cursor: 'pointer',
              marginRight: 8,
            }}
          >
            {y}
          </button>
        ))}
        <Button label="Reset" onClick={handleReset} />
      </ControlRow>

      {/* Instruction */}
      <p
        style={{
          fontSize: 12,
          color: mutedText,
          margin: '8px 0',
          lineHeight: 1.5,
        }}
      >
        Click a slice to see a Band 7 sentence describing its share.
      </p>

      {/* Pie chart */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          background: cardBg,
          borderRadius: 8,
          border: `1px solid ${border}`,
          padding: '12px 0',
          marginBottom: 12,
        }}
      >
        <ResponsiveContainer width={chartSize} height={chartSize * 0.7 + 40}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={outerR}
              innerRadius={innerR}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              onClick={(_data: unknown, index: number) => {
                setActiveIndex(index === activeIndex ? null : index);
              }}
              style={{ cursor: 'pointer' }}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={colors[index % colors.length]}
                  opacity={
                    activeIndex === null || activeIndex === index ? 1 : 0.35
                  }
                  stroke={activeIndex === index ? textColor : 'none'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 6,
                color: textColor,
                fontSize: 12,
              }}
              formatter={(value) => {
                const v = Number(value ?? 0);
                return [`${v}%`, 'Share'] as [string, string];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: compact ? 11 : 12, color: textColor }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Band 5 vs Band 7 callout for active slice */}
      {activeIndex !== null && activeSentence && (
        <div style={{ marginBottom: 10 }}>
          {/* Band 5 */}
          <div
            style={{
              background: warnBg,
              border: `1px solid ${warnText}`,
              borderRadius: 7,
              padding: '8px 12px',
              marginBottom: 6,
              fontSize: compact ? 12 : 13,
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: warnText,
                marginBottom: 3,
              }}
            >
              Band 5 (avoid)
            </span>
            <span style={{ color: warnText }}>
              The percentage of {data[activeIndex].name.toLowerCase()} was{' '}
              {data[activeIndex].value}%.
            </span>
          </div>

          {/* Band 7 */}
          <div
            style={{
              background: accentBg,
              border: `1px solid ${accentText}`,
              borderRadius: 7,
              padding: '8px 12px',
              fontSize: compact ? 12 : 13,
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: accentText,
                marginBottom: 3,
              }}
            >
              Band 7 — using "{propVerb(activeIndex)}"
            </span>
            <span style={{ color: accentText }}>{activeSentence}</span>
          </div>
        </div>
      )}

      {/* Bundle / Overview buttons */}
      <ControlRow>
        <button
          type="button"
          onClick={() => setShowBundle(!showBundle)}
          style={{
            padding: compact ? '4px 10px' : '5px 14px',
            fontSize: compact ? 11 : 12,
            fontWeight: 600,
            borderRadius: 6,
            border: `1px solid ${border}`,
            background: showBundle ? accentBg : cardBg,
            color: showBundle ? accentText : textColor,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          Show bundle sentence
        </button>
        <button
          type="button"
          onClick={() => setShowOverview(!showOverview)}
          style={{
            padding: compact ? '4px 10px' : '5px 14px',
            fontSize: compact ? 11 : 12,
            fontWeight: 600,
            borderRadius: 6,
            border: `1px solid ${border}`,
            background: showOverview ? accentBg : cardBg,
            color: showOverview ? accentText : textColor,
            cursor: 'pointer',
          }}
        >
          Show overview sentence
        </button>
      </ControlRow>

      {/* Bundle sentence */}
      {showBundle && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 7,
            padding: '8px 12px',
            marginTop: 8,
            fontSize: compact ? 12 : 13,
            color: textColor,
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: mutedText,
              marginBottom: 3,
            }}
          >
            Bundle the tail (Band 7 move)
          </span>
          {bundleSentence}
        </div>
      )}

      {/* Overview sentence */}
      {showOverview && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 7,
            padding: '8px 12px',
            marginTop: 8,
            fontSize: compact ? 12 : 13,
            color: textColor,
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: mutedText,
              marginBottom: 3,
            }}
          >
            Overview (covers both years)
          </span>
          {overviewSentence}
        </div>
      )}

      {/* Verb cheat-sheet */}
      <div
        style={{
          marginTop: 14,
          borderTop: `1px solid ${border}`,
          paddingTop: 10,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: mutedText,
            margin: '0 0 6px',
          }}
        >
          Proportion verbs — cycle these, never repeat
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['accounts for', 'makes up', 'represents', 'comprises', 'constitutes', 'is responsible for'].map(v => (
            <span
              key={v}
              style={{
                padding: '3px 9px',
                borderRadius: 5,
                fontSize: compact ? 11 : 12,
                fontWeight: 600,
                background: accentBg,
                color: accentText,
                border: `1px solid ${accentText}`,
              }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
