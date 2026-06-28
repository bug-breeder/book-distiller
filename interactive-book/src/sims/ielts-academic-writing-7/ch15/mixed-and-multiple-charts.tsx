import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Mixed Charts — Link Sentence Builder',
  concept: 'Mixed And Multiple Charts',
  caption:
    'See how a line graph and a pie chart share one overview. Click "Reveal link sentence" to see the Band 7 move that connects the two visuals.',
  libs: ['recharts'],
};

// ---------------------------------------------------------------------------
// Data — from the lesson's Dig deeper worked example (coffee consumption)
// ---------------------------------------------------------------------------

const LINE_DATA = [
  { year: 2000, bags: 120 },
  { year: 2004, bags: 130 },
  { year: 2008, bags: 140 },
  { year: 2012, bags: 152 },
  { year: 2016, bags: 163 },
  { year: 2020, bags: 175 },
];

const PIE_DATA = [
  { name: 'Europe',  value: 44 },
  { name: 'USA',     value: 24 },
  { name: 'Asia',    value: 20 },
  { name: 'Other',   value: 12 },
];

// ---------------------------------------------------------------------------
// Writing panels — overview, two detail paragraphs, link sentence
// ---------------------------------------------------------------------------

const OVERVIEW =
  'Overall, global coffee consumption rose substantially over the two decades, with Europe accounting for the largest regional share by 2020.';

const DETAIL_LINE =
  'The line graph shows that total consumption increased steadily from 120 million bags in 2000 to 175 million bags in 2020, a rise of approximately 46%.';

const DETAIL_PIE =
  'Europe dominated consumption, accounting for 44% of the 2020 total, followed by the USA at 24% and Asia at 20%. Other regions made up the remaining 12%.';

const LINK_SENTENCE =
  "Asia's 20% share suggests it contributed significantly to the overall growth trend shown in the line graph, as its market has expanded rapidly in recent years.";

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

const PIE_COLORS_LIGHT = ['#4299e1', '#ed8936', '#48bb78', '#9f7aea'];
const PIE_COLORS_DARK  = ['#63b3ed', '#f6ad55', '#68d391', '#b794f4'];

// ---------------------------------------------------------------------------
// Writing paragraph component
// ---------------------------------------------------------------------------

interface ParagraphCardProps {
  label: string;
  labelColor: string;
  text: string;
  highlighted?: boolean;
  highlightColor?: string;
  bg: string;
  border: string;
  textColor: string;
  compact: boolean;
}

function ParagraphCard({
  label,
  labelColor,
  text,
  highlighted,
  highlightColor,
  bg,
  border,
  textColor,
  compact,
}: ParagraphCardProps) {
  return (
    <div
      style={{
        background: highlighted ? (highlightColor ?? bg) : bg,
        border: `1.5px solid ${highlighted ? labelColor : border}`,
        borderRadius: 8,
        padding: compact ? '8px 10px' : '10px 14px',
        marginBottom: 8,
        transition: 'all 0.2s',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: labelColor,
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: compact ? 12 : 13,
          color: textColor,
          lineHeight: 1.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Sim({ width, isDark }: SimProps) {
  const [showOverview, setShowOverview] = useState(false);
  const [showDetail, setShowDetail]     = useState(false);
  const [showLink, setShowLink]         = useState(false);
  const [highlighted, setHighlighted]   = useState<'none' | 'pie' | 'line' | 'link'>('none');

  const bg        = isDark ? '#1a202c' : '#f8f9fb';
  const cardBg    = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border    = isDark ? '#4a5568' : '#e2e8f0';
  const gridColor = isDark ? '#4a5568' : '#e8edf2';

  // Accent colours per section
  const overviewColor  = isDark ? '#90cdf4' : '#2b6cb0';
  const overviewBg     = isDark ? '#2a4a7f' : '#ebf8ff';
  const lineColor2     = isDark ? '#68d391' : '#276749';
  const lineBg         = isDark ? '#1c4532' : '#f0fff4';
  const pieColor       = isDark ? '#f6ad55' : '#975a16';
  const pieBg          = isDark ? '#7b341e' : '#fffaf0';
  const linkColor      = isDark ? '#f687b3' : '#97266d';
  const linkBg         = isDark ? '#521b41' : '#fff5f7';

  const pieColors = isDark ? PIE_COLORS_DARK : PIE_COLORS_LIGHT;

  const compact  = width < 480;
  const stacked  = width < 640;

  // Chart dimensions
  const totalPad  = compact ? 24 : 48;
  const chartW    = stacked ? width - totalPad : Math.floor((width - totalPad - 16) / 2);
  const chartH    = Math.min(Math.round(chartW * 0.62), 220);
  const pieR      = Math.round(Math.min(chartW * 0.35, 90));

  function handleReset() {
    setShowOverview(false);
    setShowDetail(false);
    setShowLink(false);
    setHighlighted('none');
  }

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
      {/* Title row */}
      <p
        style={{
          fontSize: 12,
          color: mutedText,
          margin: '0 0 10px',
          lineHeight: 1.5,
        }}
      >
        Two visuals, one response. Reveal each writing section in order — then see
        the Band 7 link sentence that connects them.
      </p>

      {/* Chart pair */}
      <div
        style={{
          display: 'flex',
          flexDirection: stacked ? 'column' : 'row',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* Line chart */}
        <div
          style={{
            flex: '1 1 auto',
            background: cardBg,
            border: `1.5px solid ${highlighted === 'line' ? lineColor2 : border}`,
            borderRadius: 8,
            padding: '10px 4px 4px',
            transition: 'border-color 0.2s',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: lineColor2,
              margin: '0 8px 6px',
            }}
          >
            Line graph — total consumption
          </p>
          <ResponsiveContainer width="100%" height={chartH}>
            <LineChart data={LINE_DATA} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="year"
                tick={{ fill: mutedText, fontSize: 10 }}
                stroke={gridColor}
              />
              <YAxis
                domain={[100, 190]}
                tick={{ fill: mutedText, fontSize: 10 }}
                stroke={gridColor}
                tickFormatter={(v: number) => `${v}m`}
              />
              <Tooltip
                contentStyle={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  color: textColor,
                  fontSize: 11,
                }}
                formatter={(value) => {
                  const v = Number(value ?? 0);
                  return [`${v}m bags`, 'Consumption'] as [string, string];
                }}
              />
              <Line
                type="monotone"
                dataKey="bags"
                stroke={lineColor2}
                strokeWidth={2.5}
                dot={{ fill: lineColor2, r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div
          style={{
            flex: '1 1 auto',
            background: cardBg,
            border: `1.5px solid ${highlighted === 'pie' ? pieColor : border}`,
            borderRadius: 8,
            padding: '10px 4px 4px',
            transition: 'border-color 0.2s',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: pieColor,
              margin: '0 8px 6px',
            }}
          >
            Pie chart — 2020 regional share
          </p>
          <ResponsiveContainer width="100%" height={chartH}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="44%"
                outerRadius={pieR}
                innerRadius={Math.round(pieR * 0.45)}
                dataKey="value"
                isAnimationActive={false}
              >
                {PIE_DATA.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  color: textColor,
                  fontSize: 11,
                }}
                formatter={(value) => {
                  const v = Number(value ?? 0);
                  return [`${v}%`, 'Share'] as [string, string];
                }}
              />
              <Legend
                iconType="circle"
                iconSize={9}
                wrapperStyle={{ fontSize: compact ? 10 : 11, color: textColor }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Step buttons */}
      <ControlRow>
        <button
          type="button"
          onClick={() => {
            setShowOverview(true);
            setHighlighted('none');
          }}
          disabled={showOverview}
          style={{
            padding: compact ? '4px 10px' : '5px 14px',
            fontSize: compact ? 11 : 12,
            fontWeight: 600,
            borderRadius: 6,
            border: `1px solid ${showOverview ? overviewColor : border}`,
            background: showOverview ? overviewBg : cardBg,
            color: showOverview ? overviewColor : textColor,
            cursor: showOverview ? 'default' : 'pointer',
            opacity: showOverview ? 0.8 : 1,
            marginRight: 6,
          }}
        >
          1 Overview
        </button>
        <button
          type="button"
          onClick={() => {
            setShowDetail(true);
            setHighlighted('line');
            setTimeout(() => setHighlighted('pie'), 1000);
          }}
          disabled={!showOverview || showDetail}
          style={{
            padding: compact ? '4px 10px' : '5px 14px',
            fontSize: compact ? 11 : 12,
            fontWeight: 600,
            borderRadius: 6,
            border: `1px solid ${showDetail ? lineColor2 : border}`,
            background: showDetail ? lineBg : cardBg,
            color: showDetail ? lineColor2 : textColor,
            cursor: !showOverview || showDetail ? 'default' : 'pointer',
            opacity: !showOverview ? 0.4 : showDetail ? 0.8 : 1,
            marginRight: 6,
          }}
        >
          2 Detail paragraphs
        </button>
        <button
          type="button"
          onClick={() => {
            setShowLink(true);
            setHighlighted('link');
          }}
          disabled={!showDetail || showLink}
          style={{
            padding: compact ? '4px 10px' : '5px 14px',
            fontSize: compact ? 11 : 12,
            fontWeight: 600,
            borderRadius: 6,
            border: `1px solid ${showLink ? linkColor : border}`,
            background: showLink ? linkBg : cardBg,
            color: showLink ? linkColor : textColor,
            cursor: !showDetail || showLink ? 'default' : 'pointer',
            opacity: !showDetail ? 0.4 : showLink ? 0.8 : 1,
            marginRight: 6,
          }}
        >
          3 Link sentence (Band 7)
        </button>
        <Button label="Reset" onClick={handleReset} />
      </ControlRow>

      {/* Writing sections */}
      <div style={{ marginTop: 10 }}>
        {showOverview && (
          <ParagraphCard
            label="Overview — covers both visuals"
            labelColor={overviewColor}
            text={OVERVIEW}
            highlighted={highlighted === 'none' || highlighted === 'link'}
            highlightColor={overviewBg}
            bg={cardBg}
            border={border}
            textColor={textColor}
            compact={compact}
          />
        )}

        {showDetail && (
          <>
            <ParagraphCard
              label="Detail paragraph 1 — line graph"
              labelColor={lineColor2}
              text={DETAIL_LINE}
              highlighted={highlighted === 'line'}
              highlightColor={lineBg}
              bg={cardBg}
              border={border}
              textColor={textColor}
              compact={compact}
            />
            <ParagraphCard
              label="Detail paragraph 2 — pie chart"
              labelColor={pieColor}
              text={DETAIL_PIE}
              highlighted={highlighted === 'pie'}
              highlightColor={pieBg}
              bg={cardBg}
              border={border}
              textColor={textColor}
              compact={compact}
            />
          </>
        )}

        {showLink && (
          <div
            style={{
              background: linkBg,
              border: `2px solid ${linkColor}`,
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
                color: linkColor,
                marginBottom: 4,
              }}
            >
              Band 7 link sentence — connects both charts
            </span>
            <span
              style={{
                fontSize: compact ? 12 : 13,
                color: textColor,
                lineHeight: 1.6,
              }}
            >
              {LINK_SENTENCE}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 11,
                color: mutedText,
                marginTop: 6,
                fontStyle: 'italic',
              }}
            >
              This sentence uses the pie chart figure (Asia 20%) to explain the
              trend in the line graph — the cross-visual synthesis move that
              separates Band 7 from Band 6.
            </span>
          </div>
        )}
      </div>

      {/* Penalty reminder */}
      {!showOverview && !showDetail && !showLink && (
        <p
          style={{
            fontSize: 12,
            color: mutedText,
            marginTop: 6,
            borderTop: `1px solid ${border}`,
            paddingTop: 8,
            lineHeight: 1.5,
          }}
        >
          Describing only one of two visuals = major Task Achievement penalty.
          One overview must cover both charts.
        </p>
      )}
    </div>
  );
}
