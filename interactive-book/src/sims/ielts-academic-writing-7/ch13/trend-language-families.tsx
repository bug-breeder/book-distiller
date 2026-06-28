import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SimProps, SimMeta } from '../../types';

export const meta: SimMeta = {
  title: 'Trend Language Matcher',
  concept: 'Trend Language Families',
  caption: 'Pick a chart shape — the matching verbs, adverbs, and noun forms light up. Intensity must match slope.',
  libs: ['recharts'],
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Preset {
  id: string;
  label: string;
  points: { t: number; v: number }[];
  /** verb tier: steep | moderate | gradual */
  intensity: 'steep' | 'moderate' | 'gradual';
  direction: 'up' | 'down' | 'flat' | 'mixed';
}

const PRESETS: Preset[] = [
  {
    id: 'sharp-rise',
    label: 'Sharp Rise',
    points: [
      { t: 0, v: 10 },
      { t: 1, v: 28 },
      { t: 2, v: 52 },
      { t: 3, v: 78 },
      { t: 4, v: 95 },
    ],
    intensity: 'steep',
    direction: 'up',
  },
  {
    id: 'gradual-rise',
    label: 'Gradual Rise',
    points: [
      { t: 0, v: 30 },
      { t: 1, v: 36 },
      { t: 2, v: 43 },
      { t: 3, v: 49 },
      { t: 4, v: 55 },
    ],
    intensity: 'gradual',
    direction: 'up',
  },
  {
    id: 'plateau',
    label: 'Plateau',
    points: [
      { t: 0, v: 60 },
      { t: 1, v: 61 },
      { t: 2, v: 60 },
      { t: 3, v: 61 },
      { t: 4, v: 60 },
    ],
    intensity: 'gradual',
    direction: 'flat',
  },
  {
    id: 'gradual-decline',
    label: 'Gradual Decline',
    points: [
      { t: 0, v: 70 },
      { t: 1, v: 63 },
      { t: 2, v: 57 },
      { t: 3, v: 51 },
      { t: 4, v: 46 },
    ],
    intensity: 'gradual',
    direction: 'down',
  },
  {
    id: 'sharp-decline',
    label: 'Sharp Decline',
    points: [
      { t: 0, v: 90 },
      { t: 1, v: 72 },
      { t: 2, v: 48 },
      { t: 3, v: 24 },
      { t: 4, v: 8 },
    ],
    intensity: 'steep',
    direction: 'down',
  },
  {
    id: 'fluctuation',
    label: 'Fluctuation',
    points: [
      { t: 0, v: 50 },
      { t: 1, v: 70 },
      { t: 2, v: 40 },
      { t: 3, v: 65 },
      { t: 4, v: 45 },
    ],
    intensity: 'moderate',
    direction: 'mixed',
  },
];

// ---------------------------------------------------------------------------
// Vocabulary families
// ---------------------------------------------------------------------------

interface VocabGroup {
  family: 'Verb' | 'Adverb' | 'Noun form';
  items: VocabItem[];
}

interface VocabItem {
  word: string;
  intensity: 'steep' | 'moderate' | 'gradual' | 'any';
  direction: ('up' | 'down' | 'flat' | 'mixed')[];
}

const VOCAB_GROUPS: VocabGroup[] = [
  {
    family: 'Verb',
    items: [
      { word: 'rocketed / soared', intensity: 'steep', direction: ['up'] },
      { word: 'surged', intensity: 'steep', direction: ['up'] },
      { word: 'climbed / rose', intensity: 'moderate', direction: ['up'] },
      { word: 'increased / grew', intensity: 'moderate', direction: ['up'] },
      { word: 'edged up', intensity: 'gradual', direction: ['up'] },
      { word: 'crept up', intensity: 'gradual', direction: ['up'] },
      { word: 'plummeted / plunged', intensity: 'steep', direction: ['down'] },
      { word: 'slumped', intensity: 'steep', direction: ['down'] },
      { word: 'fell / declined', intensity: 'moderate', direction: ['down'] },
      { word: 'decreased / dropped', intensity: 'moderate', direction: ['down'] },
      { word: 'dipped', intensity: 'gradual', direction: ['down'] },
      { word: 'levelled off', intensity: 'any', direction: ['flat'] },
      { word: 'remained stable', intensity: 'any', direction: ['flat'] },
      { word: 'fluctuated', intensity: 'any', direction: ['mixed'] },
      { word: 'varied', intensity: 'any', direction: ['mixed'] },
    ],
  },
  {
    family: 'Adverb',
    items: [
      { word: 'sharply / dramatically', intensity: 'steep', direction: ['up', 'down'] },
      { word: 'steeply', intensity: 'steep', direction: ['up', 'down'] },
      { word: 'steadily / consistently', intensity: 'moderate', direction: ['up', 'down'] },
      { word: 'moderately', intensity: 'moderate', direction: ['up', 'down'] },
      { word: 'gradually', intensity: 'gradual', direction: ['up', 'down', 'flat'] },
      { word: 'slightly / marginally', intensity: 'gradual', direction: ['up', 'down', 'flat'] },
      { word: 'erratically / irregularly', intensity: 'any', direction: ['mixed'] },
    ],
  },
  {
    family: 'Noun form',
    items: [
      { word: 'a sharp rise / a dramatic surge', intensity: 'steep', direction: ['up'] },
      { word: 'a steady increase / a consistent climb', intensity: 'moderate', direction: ['up'] },
      { word: 'a gradual rise / a marginal increase', intensity: 'gradual', direction: ['up'] },
      { word: 'a sharp decline / a dramatic fall', intensity: 'steep', direction: ['down'] },
      { word: 'a steady decline / a consistent drop', intensity: 'moderate', direction: ['down'] },
      { word: 'a gradual decline / a slight dip', intensity: 'gradual', direction: ['down'] },
      { word: 'a plateau / a period of stability', intensity: 'any', direction: ['flat'] },
      { word: 'a fluctuation / an erratic pattern', intensity: 'any', direction: ['mixed'] },
    ],
  },
];

function isActive(item: VocabItem, preset: Preset): boolean {
  const dirMatch = item.direction.includes(preset.direction);
  const intMatch = item.intensity === 'any' || item.intensity === preset.intensity;
  return dirMatch && intMatch;
}

// ---------------------------------------------------------------------------
// Intensity / direction labels
// ---------------------------------------------------------------------------

const INTENSITY_LABELS: Record<string, string> = {
  steep: 'Steep',
  moderate: 'Moderate',
  gradual: 'Gradual / Small',
};

const DIRECTION_LABELS: Record<string, string> = {
  up: 'Upward',
  down: 'Downward',
  flat: 'Flat',
  mixed: 'Fluctuating',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Sim({ width, isDark }: SimProps) {
  const [activeId, setActiveId] = useState<string>('sharp-rise');

  const preset = PRESETS.find(p => p.id === activeId) ?? PRESETS[0];

  const bg        = isDark ? '#1a202c' : '#f8f9fb';
  const cardBg    = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border    = isDark ? '#4a5568' : '#e2e8f0';
  const gridColor = isDark ? '#4a5568' : '#e2e8f0';

  // Active vocab highlight colours per family
  const activeVerbBg     = isDark ? '#2b6cb0' : '#bee3f8';
  const activeAdverbBg   = isDark ? '#276749' : '#c6f6d5';
  const activeNounBg     = isDark ? '#6b46c1' : '#e9d8fd';
  const inactiveBg       = isDark ? '#2d3748' : '#f7fafc';
  const activeVerbText   = isDark ? '#90cdf4' : '#2c5282';
  const activeAdverbText = isDark ? '#68d391' : '#276749';
  const activeNounText   = isDark ? '#d6bcfa' : '#553c9a';

  type FamilyKey = 'Verb' | 'Adverb' | 'Noun form';
  const familyColors: Record<FamilyKey, { activeBg: string; activeText: string }> = {
    'Verb':      { activeBg: activeVerbBg,   activeText: activeVerbText   },
    'Adverb':    { activeBg: activeAdverbBg, activeText: activeAdverbText },
    'Noun form': { activeBg: activeNounBg,   activeText: activeNounText   },
  };

  const chartH = Math.min(Math.round(width * 0.38), 220);

  // Line colour per direction
  const lineColor =
    preset.direction === 'up'   ? (isDark ? '#68d391' : '#276749') :
    preset.direction === 'down' ? (isDark ? '#fc8181' : '#c53030') :
    preset.direction === 'flat' ? (isDark ? '#90cdf4' : '#2b6cb0') :
                                   (isDark ? '#f6e05e' : '#975a16');

  const compact = width < 520;

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
      {/* Preset buttons */}
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}
        role="group"
        aria-label="Chart shape presets"
      >
        {PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActiveId(p.id)}
            style={{
              padding: compact ? '4px 9px' : '5px 13px',
              fontSize: compact ? 11 : 13,
              fontWeight: 600,
              borderRadius: 20,
              border: `2px solid ${p.id === activeId ? lineColor : border}`,
              background: p.id === activeId ? lineColor : cardBg,
              color: p.id === activeId ? (isDark ? '#1a202c' : '#fff') : textColor,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Shape metadata badge */}
      <div
        style={{
          marginBottom: 8,
          fontSize: 12,
          color: mutedText,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span>
          Direction: <strong style={{ color: lineColor }}>{DIRECTION_LABELS[preset.direction]}</strong>
        </span>
        <span>
          Intensity: <strong style={{ color: lineColor }}>{INTENSITY_LABELS[preset.intensity]}</strong>
        </span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          Highlighted words match both.
        </span>
      </div>

      {/* Chart */}
      <div
        style={{
          background: cardBg,
          borderRadius: 8,
          padding: '10px 4px 4px',
          marginBottom: 14,
          border: `1px solid ${border}`,
        }}
      >
        <ResponsiveContainer width="100%" height={chartH}>
          <LineChart
            data={preset.points}
            margin={{ top: 8, right: 20, bottom: 4, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="t"
              tick={{ fill: mutedText, fontSize: 11 }}
              tickFormatter={(v: number) => `Yr ${v + 1}`}
              stroke={gridColor}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: mutedText, fontSize: 11 }}
              stroke={gridColor}
            />
            <Tooltip
              contentStyle={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 6,
                color: textColor,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={lineColor}
              strokeWidth={3}
              dot={{ fill: lineColor, r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vocabulary families */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {VOCAB_GROUPS.map(group => {
          const colors = familyColors[group.family];
          return (
            <div
              key={group.family}
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '10px 10px 8px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: mutedText,
                  marginBottom: 8,
                }}
              >
                {group.family}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {group.items.map(item => {
                  const active = isActive(item, preset);
                  return (
                    <span
                      key={item.word}
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 5,
                        fontSize: compact ? 11 : 12,
                        fontWeight: active ? 700 : 400,
                        background: active ? colors.activeBg : inactiveBg,
                        color: active ? colors.activeText : mutedText,
                        opacity: active ? 1 : 0.45,
                        transition: 'all 0.2s',
                      }}
                    >
                      {item.word}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p
        style={{
          fontSize: 11,
          color: mutedText,
          marginTop: 10,
          marginBottom: 0,
          borderTop: `1px solid ${border}`,
          paddingTop: 8,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        Verbs set direction; adverbs set gradient. Calling a 4% rise over 20 years
        "dramatic" is a Task Achievement accuracy error, not just a vocabulary slip.
      </p>
    </div>
  );
}
