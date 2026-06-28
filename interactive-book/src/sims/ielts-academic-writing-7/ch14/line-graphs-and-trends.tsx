import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Key Features: Line, Bar & Table',
  concept: 'Line Graphs And Trends',
  caption:
    'Toggle between chart types. Click "Highlight key features" to see which data points to select — and why the others can be safely omitted.',
  libs: ['recharts'],
};

// ─── Shared dataset ───────────────────────────────────────────────────────────
// Computer ownership (% of households) 2000–2010, from lesson C1 Dig deeper.

const LINE_DATA = [
  { year: 2000, UK: 30, Japan: 40, Brazil: 10 },
  { year: 2005, UK: 55, Japan: 60, Brazil: 20 },
  { year: 2010, UK: 75, Japan: 80, Brazil: 45 },
];

// Bar chart: 2022 internet speeds (Mbps) from lesson C3 Check.
const BAR_DATA = [
  { country: 'South Korea', speed: 200 },
  { country: 'USA', speed: 120 },
  { country: 'Germany', speed: 90 },
  { country: 'India', speed: 25 },
  { country: 'Nigeria', speed: 15 },
];

// Table: household device ownership (%) SE Asia 2022, from lesson C3 Practice.
const TABLE_DATA = [
  { country: 'Thailand', smartphone: 90, laptop: 55, tv: 48 },
  { country: 'Vietnam', smartphone: 85, laptop: 45, tv: 30 },
  { country: 'Philippines', smartphone: 82, laptop: 40, tv: 28 },
  { country: 'Indonesia', smartphone: 78, laptop: 35, tv: 22 },
];

// ─── Key-feature annotations ──────────────────────────────────────────────────

/** Which data points matter and why, per view */
const KEY_FEATURES = {
  line: [
    {
      label: 'Japan leads throughout',
      detail: 'Highest value in every year (40 → 60 → 80%) — state in overview.',
    },
    {
      label: 'Brazil: steepest relative rise',
      detail: 'Started lowest (10%), largest % gain (+35pp) — most dramatic increase.',
    },
    {
      label: 'All three rise steadily',
      detail: 'No dips or crossovers — one cross-cutting pattern covers all lines.',
    },
    {
      label: 'Gap narrows by 2010',
      detail: 'Brazil–Japan gap: 30pp in 2000, only 35pp in 2010 — but gap barely closed; Japan–UK gap: 10pp → 5pp (closes). Note the convergence at the top.',
    },
  ],
  bar: [
    {
      label: 'South Korea = extreme high (200 Mbps)',
      detail: 'Always report the single highest — it anchors the range.',
    },
    {
      label: 'Nigeria = extreme low (15 Mbps)',
      detail: 'Always report the single lowest — less than 1/10 of South Korea.',
    },
    {
      label: 'USA & Germany: mid-tier cluster',
      detail: 'Two bars close together (120, 90) — group them rather than list separately.',
    },
    {
      label: 'India & Nigeria: developing-country pattern',
      detail: 'Both below 30 Mbps — a cross-cutting pattern worth one sentence.',
    },
  ],
  table: [
    {
      label: 'Smartphone = highest device in every country',
      detail: 'A cross-cutting pattern — one sentence covers all four rows.',
    },
    {
      label: 'Thailand leads across all three devices',
      detail: 'A cross-cutting pattern about a single row — state in overview.',
    },
    {
      label: 'Smart TV = lowest device everywhere',
      detail: 'Another cross-cutting pattern — contrasts with smartphone dominance.',
    },
    {
      label: 'Mid-range figures (Vietnam/Philippines/Indonesia laptops)',
      detail: 'These are unremarkable. Safely omit — they add nothing beyond the pattern already stated.',
    },
  ],
};

// ─── Colours ──────────────────────────────────────────────────────────────────

const LINE_COLORS: Record<string, string> = {
  UK: '#2563eb',
  Japan: '#16a34a',
  Brazil: '#d97706',
};

const BAR_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#d97706', '#dc2626'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCard({
  feature,
  index,
  isDark,
  isLast,
}: {
  feature: { label: string; detail: string };
  index: number;
  isDark: boolean;
  isLast?: boolean;
}) {
  const omit = isLast && feature.label.toLowerCase().includes('omit');
  const bg = omit
    ? isDark
      ? 'rgba(239,68,68,0.12)'
      : 'rgba(239,68,68,0.07)'
    : isDark
    ? 'rgba(22,163,74,0.12)'
    : 'rgba(22,163,74,0.07)';
  const border = omit ? '#ef4444' : '#16a34a';

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        borderLeft: `3px solid ${border}`,
        background: bg,
        borderRadius: '0 6px 6px 0',
        marginBottom: 8,
      }}
    >
      <span
        style={{
          minWidth: 22,
          height: 22,
          borderRadius: '50%',
          background: border,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {omit ? 'X' : index + 1}
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: border, marginBottom: 2 }}>
          {feature.label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ifm-font-color-base)',
            lineHeight: 1.5,
            opacity: 0.85,
          }}
        >
          {feature.detail}
        </div>
      </div>
    </div>
  );
}

// ─── Line chart panel ─────────────────────────────────────────────────────────

function LinePanel({
  highlighted,
  isDark,
}: {
  highlighted: boolean;
  isDark: boolean;
}) {
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginBottom: 8, lineHeight: 1.4 }}>
        Percentage of households owning a computer, 2000–2010.
        {highlighted && (
          <span style={{ color: '#2563eb', fontWeight: 600 }}>
            {' '}Highlighted: the three key observations an examiner wants.
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={LINE_DATA} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: axisColor }} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12, fill: axisColor }}
            width={38}
          />
          <Tooltip
            formatter={(v, name) => [`${String(v ?? "")}%`, String(name ?? "")]}
            contentStyle={{
              background: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          {/* Peak annotation for Japan at 2010 */}
          {highlighted && (
            <ReferenceLine
              x={2010}
              stroke="#16a34a"
              strokeDasharray="5 3"
              label={{
                value: 'All peak',
                position: 'insideTopRight',
                fontSize: 11,
                fill: '#16a34a',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="Japan"
            stroke={LINE_COLORS.Japan}
            strokeWidth={highlighted ? 3 : 2}
            dot={{ r: highlighted ? 5 : 3, fill: LINE_COLORS.Japan }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="UK"
            stroke={LINE_COLORS.UK}
            strokeWidth={highlighted ? 3 : 2}
            dot={{ r: highlighted ? 5 : 3, fill: LINE_COLORS.UK }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Brazil"
            stroke={LINE_COLORS.Brazil}
            strokeWidth={highlighted ? 3 : 2}
            dot={{ r: highlighted ? 5 : 3, fill: LINE_COLORS.Brazil }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

// ─── Bar chart panel ──────────────────────────────────────────────────────────

function BarPanel({
  highlighted,
  isDark,
}: {
  highlighted: boolean;
  isDark: boolean;
}) {
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // sorted highest first (already sorted, but make explicit)
  const sorted = [...BAR_DATA].sort((a, b) => b.speed - a.speed);

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginBottom: 8, lineHeight: 1.4 }}>
        Average internet speed (Mbps) by country, 2022. Data already sorted highest→lowest.
        {highlighted && (
          <span style={{ color: '#2563eb', fontWeight: 600 }}>
            {' '}Highlighted: extremes + groupings — omit unremarkable middle values.
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={sorted}
          margin={{ top: 12, right: 16, left: 0, bottom: 20 }}
          layout="vertical"
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="4 4" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 220]}
            tickFormatter={(v: number) => `${v}`}
            tick={{ fontSize: 12, fill: axisColor }}
            label={{ value: 'Mbps', position: 'insideRight', offset: -4, fontSize: 11, fill: axisColor }}
          />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fontSize: 12, fill: axisColor }}
            width={90}
          />
          <Tooltip
            formatter={(v) => [`${String(v ?? "")} Mbps`]}
            contentStyle={{
              background: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              fontSize: 12,
            }}
          />
          <Bar dataKey="speed" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => {
              const isExtreme = highlighted && (index === 0 || index === sorted.length - 1);
              const isCluster = highlighted && (index === 1 || index === 2);
              const color = isExtreme
                ? '#16a34a'
                : isCluster
                ? '#7c3aed'
                : BAR_COLORS[index] ?? '#6b7280';
              return <Cell key={entry.country} fill={color} opacity={highlighted && !isExtreme && !isCluster ? 0.4 : 1} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

// ─── Table panel ──────────────────────────────────────────────────────────────

function TablePanel({
  highlighted,
  isDark,
}: {
  highlighted: boolean;
  isDark: boolean;
}) {
  const headerBg = isDark ? '#1e293b' : '#f1f5f9';
  const rowAlt = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  // Highlight rules: smartphone column (cross-cutting highest), Thailand row (leads throughout)
  const isHighSmartphone = (col: string) => highlighted && col === 'smartphone';
  const isHighThailand = (row: string) => highlighted && row === 'Thailand';
  const isHighTV = (col: string) => highlighted && col === 'tv';

  const highlightBg = isDark ? 'rgba(22,163,74,0.18)' : 'rgba(22,163,74,0.1)';
  const dimStyle = highlighted
    ? { opacity: 0.45, fontSize: 13 }
    : { fontSize: 13 };

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginBottom: 8, lineHeight: 1.4 }}>
        Household device ownership (%), SE Asia 2022.
        {highlighted && (
          <span style={{ color: '#2563eb', fontWeight: 600 }}>
            {' '}Green = key features to select. Dim = safely omit.
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <thead>
            <tr style={{ background: headerBg }}>
              {['Country', 'Smartphone', 'Laptop', 'Smart TV'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 12px',
                    textAlign: h === 'Country' ? 'left' : 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.04em',
                    color: 'var(--ifm-font-color-base)',
                    borderBottom: `2px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_DATA.map((row, i) => {
              const thRow = isHighThailand(row.country);
              const rowBg = thRow ? highlightBg : i % 2 === 1 ? rowAlt : 'transparent';
              return (
                <tr key={row.country} style={{ background: rowBg }}>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontWeight: thRow ? 700 : 500,
                      color: thRow ? '#16a34a' : 'var(--ifm-font-color-base)',
                      borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    }}
                  >
                    {row.country}
                  </td>
                  {(['smartphone', 'laptop', 'tv'] as const).map((col) => {
                    const isKey = isHighSmartphone(col) || isHighTV(col) || thRow;
                    const cellStyle = highlighted && !isKey ? dimStyle : { fontSize: 13 };
                    const bgCol = isHighSmartphone(col)
                      ? highlightBg
                      : isHighTV(col)
                      ? isDark
                        ? 'rgba(220,38,38,0.12)'
                        : 'rgba(220,38,38,0.07)'
                      : 'transparent';
                    return (
                      <td
                        key={col}
                        style={{
                          padding: '8px 12px',
                          textAlign: 'center',
                          background: bgCol,
                          ...cellStyle,
                          fontWeight: isKey ? 700 : 400,
                          color: isHighSmartphone(col)
                            ? '#16a34a'
                            : isHighTV(col)
                            ? '#dc2626'
                            : 'var(--ifm-font-color-base)',
                          borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                        }}
                      >
                        {row[col]}%
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {highlighted && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 8,
            flexWrap: 'wrap',
            fontSize: 11,
            color: 'var(--ifm-color-emphasis-700)',
          }}
        >
          <LegendSwatch color="#16a34a" label="Smartphone col: highest device everywhere" />
          <LegendSwatch color="#dc2626" label="Smart TV col: lowest device everywhere" />
          <span>Thailand row: leads in all 3 devices</span>
        </div>
      )}
    </>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = 'line' | 'bar' | 'table';

const VIEW_LABELS: Record<View, string> = {
  line: 'Line graph',
  bar: 'Bar chart',
  table: 'Table',
};

const VIEW_CONCEPTS: Record<View, string> = {
  line: 'C1 — Line Graphs And Trends',
  bar: 'C2 — Bar Charts And Comparison',
  table: 'C3 — Tables And Selecting Key Data',
};

export default function Sim({ width, isDark }: SimProps) {
  const [view, setView] = useState<View>('line');
  const [highlighted, setHighlighted] = useState(false);

  const narrow = width < 520;
  const features = KEY_FEATURES[view];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'inherit' }}>
      {/* View switcher */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['line', 'bar', 'table'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                setHighlighted(false);
              }}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                border: `2px solid ${view === v ? 'var(--ifm-color-primary)' : isDark ? '#334155' : '#cbd5e1'}`,
                background: view === v ? 'var(--ifm-color-primary)' : 'transparent',
                color: view === v ? '#fff' : 'var(--ifm-font-color-base)',
                fontWeight: view === v ? 700 : 400,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        <ControlRow>
          <Button
            label={highlighted ? 'Hide highlights' : 'Highlight key features'}
            onClick={() => setHighlighted((h) => !h)}
          />
        </ControlRow>
      </div>

      {/* Concept label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--ifm-color-primary)',
          marginBottom: 10,
        }}
      >
        {VIEW_CONCEPTS[view]}
      </div>

      {/* Chart area */}
      <div
        style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderRadius: 10,
          padding: narrow ? '12px 8px' : '16px 14px',
          marginBottom: 16,
          border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        }}
      >
        {view === 'line' && <LinePanel highlighted={highlighted} isDark={isDark} />}
        {view === 'bar' && <BarPanel highlighted={highlighted} isDark={isDark} />}
        {view === 'table' && <TablePanel highlighted={highlighted} isDark={isDark} />}
      </div>

      {/* Key features panel */}
      {highlighted && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--ifm-color-emphasis-600)',
              marginBottom: 10,
            }}
          >
            Key features to select
          </div>
          {features.map((f, i) => (
            <FeatureCard
              key={i}
              feature={f}
              index={i}
              isDark={isDark}
              isLast={i === features.length - 1}
            />
          ))}
        </div>
      )}

      {/* Tip when not highlighted */}
      {!highlighted && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--ifm-color-emphasis-600)',
            fontStyle: 'italic',
            borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            paddingTop: 10,
          }}
        >
          Switch between chart types to see how selection principles apply differently.
          Press "Highlight key features" to reveal what to pick — and what to safely omit.
        </div>
      )}
    </div>
  );
}
