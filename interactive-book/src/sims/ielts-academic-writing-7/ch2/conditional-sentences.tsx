import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Conditional Tense Patterns',
  concept: 'Conditional Sentences',
  caption: 'Toggle between zero, first, and second conditionals to see how the tense shift signals epistemic distance.',
  libs: [],
};

// ─────────────────────────────────────────────────────────────────
// Three IELTS example sentences, one per conditional type.
// Each token is tagged: 'if'|'if-verb'|'result-verb'|'text'|'connector'
// ─────────────────────────────────────────────────────────────────

type TokenKind = 'if-keyword' | 'if-verb' | 'result-verb' | 'connector' | 'text';

interface Token {
  text: string;
  kind: TokenKind;
}

interface ConditionalType {
  label: string;
  name: string;
  ifTense: string;
  resultTense: string;
  distance: number; // 0 | 1 | 2
  plausibility: string;
  usage: string;
  tokens: Token[];
  formula: string;
}

const CONDITIONALS: ConditionalType[] = [
  {
    label: 'Zero',
    name: 'Zero conditional',
    ifTense: 'present simple',
    resultTense: 'present simple',
    distance: 0,
    plausibility: 'Universal truth — always happens',
    usage: 'State established tendencies and general laws',
    formula: 'if + present simple → present simple',
    tokens: [
      { text: 'If', kind: 'if-keyword' },
      { text: ' carbon emissions ', kind: 'text' },
      { text: 'increase', kind: 'if-verb' },
      { text: ', global temperatures ', kind: 'text' },
      { text: 'rise', kind: 'result-verb' },
      { text: '.', kind: 'text' },
    ],
  },
  {
    label: 'First',
    name: 'First conditional',
    ifTense: 'present simple',
    resultTense: 'will + infinitive',
    distance: 1,
    plausibility: 'Real, likely future scenario',
    usage: 'Argue for realistic policy consequences',
    formula: 'if + present simple → will + infinitive',
    tokens: [
      { text: 'If', kind: 'if-keyword' },
      { text: ' governments ', kind: 'text' },
      { text: 'invest', kind: 'if-verb' },
      { text: ' in renewables, they ', kind: 'text' },
      { text: 'will reduce', kind: 'result-verb' },
      { text: ' dependence on fossil fuels.', kind: 'text' },
    ],
  },
  {
    label: 'Second',
    name: 'Second conditional',
    ifTense: 'past simple',
    resultTense: 'would + infinitive',
    distance: 2,
    plausibility: 'Hypothetical or unlikely scenario',
    usage: 'Introduce nuanced hypotheticals without asserting certainty',
    formula: 'if + past simple → would + infinitive',
    tokens: [
      { text: 'If', kind: 'if-keyword' },
      { text: ' every country ', kind: 'text' },
      { text: 'adopted', kind: 'if-verb' },
      { text: ' nuclear energy, carbon emissions ', kind: 'text' },
      { text: 'would fall', kind: 'result-verb' },
      { text: ' dramatically.', kind: 'text' },
    ],
  },
];

const STEPS = [
  { label: '0 tense steps', sub: 'Maximum certainty' },
  { label: '1 tense step', sub: 'Realistic prospect' },
  { label: '2 tense steps', sub: 'Hypothetical' },
];

export default function Sim({ width, isDark }: SimProps) {
  const [idx, setIdx] = useState(0);
  const cond = CONDITIONALS[idx];

  // Colours
  const bg         = isDark ? '#1e1e2e' : '#f8f9fb';
  const cardBg     = isDark ? '#2d3748' : '#ffffff';
  const textColor  = isDark ? '#e2e8f0' : '#1a202c';
  const mutedColor = isDark ? '#a0aec0' : '#718096';
  const ifColor    = isDark ? '#f6ad55' : '#c05621';   // orange for if-clause
  const resColor   = isDark ? '#68d391' : '#276749';   // green for result-clause
  const kwColor    = isDark ? '#fc8181' : '#c53030';   // red for "If" keyword
  const stepActive = isDark ? '#63b3ed' : '#2b6cb0';
  const stepDim    = isDark ? '#4a5568' : '#e2e8f0';
  const stepDimText = isDark ? '#718096' : '#a0aec0';

  const h = Math.min(Math.round(width * 0.72), 480);

  // SVG tense-distance diagram dimensions
  const svgW = Math.min(width - 32, 480);
  const svgH = 72;
  const stepW = svgW / 3;

  function next() { setIdx((i) => (i + 1) % 3); }
  function prev() { setIdx((i) => (i + 2) % 3); }

  return (
    <div style={{
      fontFamily: 'var(--ifm-font-family-base, sans-serif)',
      background: bg,
      borderRadius: 10,
      padding: '12px 16px',
      color: textColor,
      minHeight: h,
      boxSizing: 'border-box',
    }}>
      {/* Controls */}
      <ControlRow>
        <Button label="Previous" onClick={prev} />
        <span style={{ margin: '0 12px', fontWeight: 700, fontSize: 15, color: textColor }}>
          {cond.name}
        </span>
        <Button label="Next" onClick={next} />
      </ControlRow>

      {/* Type selector pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CONDITIONALS.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setIdx(i)}
            style={{
              padding: '4px 14px',
              borderRadius: 20,
              border: i === idx
                ? `2px solid ${stepActive}`
                : `2px solid ${isDark ? '#4a5568' : '#cbd5e0'}`,
              background: i === idx
                ? (isDark ? '#2a4365' : '#ebf8ff')
                : 'transparent',
              color: i === idx ? stepActive : mutedColor,
              fontWeight: i === idx ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Example sentence card */}
      <div style={{
        background: cardBg,
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 14,
        lineHeight: 1.9,
        fontSize: Math.max(13, Math.min(16, width * 0.035)),
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
        border: isDark ? '1px solid #4a5568' : '1px solid #e2e8f0',
      }}>
        {cond.tokens.map((tok, i) => {
          let color = textColor;
          let fontWeight: React.CSSProperties['fontWeight'] = 'normal';
          let borderBottom: string | undefined;
          let title: string | undefined;

          if (tok.kind === 'if-keyword') {
            color = kwColor;
            fontWeight = 'bold';
            title = 'Subordinating conjunction — starts the dependent clause';
          } else if (tok.kind === 'if-verb') {
            color = ifColor;
            fontWeight = 'bold';
            borderBottom = `2px solid ${ifColor}`;
            title = `If-clause verb tense: ${cond.ifTense}`;
          } else if (tok.kind === 'result-verb') {
            color = resColor;
            fontWeight = 'bold';
            borderBottom = `2px solid ${resColor}`;
            title = `Result-clause verb tense: ${cond.resultTense}`;
          }

          return (
            <span
              key={i}
              style={{ color, fontWeight, borderBottom, fontStyle: 'italic' }}
              title={title}
            >
              {tok.text}
            </span>
          );
        })}
      </div>

      {/* Colour legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', fontSize: 12 }}>
        <span style={{ color: kwColor, fontWeight: 700 }}>"if" — subordinator</span>
        <span>
          <span style={{ color: ifColor, fontWeight: 700, borderBottom: `2px solid ${ifColor}` }}>
            if-verb
          </span>
          {' '}— {cond.ifTense}
        </span>
        <span>
          <span style={{ color: resColor, fontWeight: 700, borderBottom: `2px solid ${resColor}` }}>
            result-verb
          </span>
          {' '}— {cond.resultTense}
        </span>
      </div>

      {/* Formula */}
      <div style={{
        background: isDark ? '#1a202c' : '#edf2f7',
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 14,
        fontFamily: 'var(--ifm-font-family-monospace, monospace)',
        fontSize: 13,
        color: textColor,
        letterSpacing: 0.2,
      }}>
        {cond.formula}
      </div>

      {/* Epistemic distance diagram */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: mutedColor, marginBottom: 6 }}>
          Epistemic distance (tense steps from present reality):
        </div>
        <svg width={svgW} height={svgH} style={{ display: 'block', overflow: 'visible' }}>
          {STEPS.map((step, i) => {
            const active = i <= cond.distance;
            const cx = stepW * i + stepW / 2;
            const cy = 26;
            const r = 14;
            return (
              <g key={i}>
                {/* connector line between circles */}
                {i < 2 && (
                  <line
                    x1={cx + r}
                    y1={cy}
                    x2={cx + stepW - r}
                    y2={cy}
                    stroke={i < cond.distance ? stepActive : stepDim}
                    strokeWidth={3}
                    strokeDasharray={i < cond.distance ? 'none' : '4 3'}
                  />
                )}
                {/* circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={active ? stepActive : stepDim}
                  stroke={active ? stepActive : (isDark ? '#718096' : '#cbd5e0')}
                  strokeWidth={2}
                />
                <text
                  x={cx}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="bold"
                  fill={active ? '#ffffff' : stepDimText}
                >
                  {i}
                </text>
                {/* label below */}
                <text
                  x={cx}
                  y={cy + r + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill={active ? textColor : mutedColor}
                >
                  {step.label}
                </text>
                <text
                  x={cx}
                  y={cy + r + 26}
                  textAnchor="middle"
                  fontSize={10}
                  fill={active ? mutedColor : stepDimText}
                >
                  {step.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Plausibility + usage note */}
      <div style={{
        background: isDark ? '#2d3748' : '#f0fff4',
        border: `1px solid ${resColor}`,
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 13,
        color: textColor,
      }}>
        <strong style={{ color: resColor }}>Plausibility: </strong>{cond.plausibility}
        <br />
        <strong>IELTS use: </strong><span style={{ color: mutedColor }}>{cond.usage}</span>
      </div>

      {/* Misconception warning (only on first conditional) */}
      {idx === 1 && (
        <div style={{
          marginTop: 10,
          background: isDark ? '#2d2020' : '#fff5f5',
          border: `1px solid ${isDark ? '#fc8181' : '#feb2b2'}`,
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 12,
          color: isDark ? '#fc8181' : '#c53030',
        }}>
          Common error: do NOT write "If the government <em>would invest</em>…" — "would" must never appear in the if-clause of a first conditional.
        </div>
      )}
    </div>
  );
}
