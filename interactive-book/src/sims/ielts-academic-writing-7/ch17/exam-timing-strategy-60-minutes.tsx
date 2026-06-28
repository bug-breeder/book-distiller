import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Slider, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: '60-Minute Exam Timing Planner',
  concept: 'Exam Timing Strategy 60 Minutes',
  caption:
    'Allocate plan / write / check minutes across both tasks and see whether your split honours the 2/3 rule and word-count pace.',
  libs: [],
};

/* ── defaults from the lesson note ─────────────────────────────── */
const DEFAULTS = {
  t2Plan: 5,
  t2Write: 30,
  t2Check: 5,
  t1Plan: 3,
  t1Write: 14,
  t1Check: 3,
};

/** Words-per-minute at a realistic exam pace. */
const WPM = 8.5; // roughly 255 words in 30 min = 8.5 wpm

function totalFor(plan: number, write: number, check: number): number {
  return plan + write + check;
}

function statusColor(
  ok: boolean,
  warn: boolean,
  isDark: boolean
): string {
  if (ok) return isDark ? '#68d391' : '#276749';
  if (warn) return isDark ? '#f6e05e' : '#975a16';
  return isDark ? '#fc8181' : '#9b2c2c';
}

interface PhaseBarProps {
  label: string;
  minutes: number;
  total: number;
  color: string;
  barMaxPx: number;
}

function PhaseBar({ label, minutes, total, color, barMaxPx }: PhaseBarProps) {
  const w = total > 0 ? (minutes / total) * barMaxPx : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
      }}
    >
      <span
        style={{
          width: 46,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'right',
          flexShrink: 0,
          fontFamily: 'monospace',
        }}
      >
        {label}
      </span>
      <div
        style={{
          background: color,
          width: Math.max(w, 2),
          height: 18,
          borderRadius: 3,
          transition: 'width 0.18s ease',
          opacity: 0.85,
        }}
      />
      <span style={{ fontSize: 11, fontFamily: 'monospace', flexShrink: 0 }}>
        {minutes} min
      </span>
    </div>
  );
}

export default function Sim({ width, isDark }: SimProps) {
  const [t2Plan, setT2Plan] = useState(DEFAULTS.t2Plan);
  const [t2Write, setT2Write] = useState(DEFAULTS.t2Write);
  const [t2Check, setT2Check] = useState(DEFAULTS.t2Check);
  const [t1Plan, setT1Plan] = useState(DEFAULTS.t1Plan);
  const [t1Write, setT1Write] = useState(DEFAULTS.t1Write);
  const [t1Check, setT1Check] = useState(DEFAULTS.t1Check);

  function reset() {
    setT2Plan(DEFAULTS.t2Plan);
    setT2Write(DEFAULTS.t2Write);
    setT2Check(DEFAULTS.t2Check);
    setT1Plan(DEFAULTS.t1Plan);
    setT1Write(DEFAULTS.t1Write);
    setT1Check(DEFAULTS.t1Check);
  }

  const t2Total = totalFor(t2Plan, t2Write, t2Check);
  const t1Total = totalFor(t1Plan, t1Write, t1Check);
  const grandTotal = t2Total + t1Total;

  /* ── derived diagnostics ─────────────────────────────────────── */
  const grandOk = grandTotal === 60;
  const t2Ok = t2Total === 40;
  const t1Ok = t1Total === 20;
  const t2Fraction = grandTotal > 0 ? t2Total / grandTotal : 0;
  const ratioOk = t2Fraction >= 0.6 && t2Fraction <= 0.72; // ~2/3
  const t2Words = Math.round(t2Write * WPM);
  const t1Words = Math.round(t1Write * WPM);
  const t2WordOk = t2Words >= 250;
  const t1WordOk = t1Words >= 150;

  /* ── colours ─────────────────────────────────────────────────── */
  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const cardBg = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border = isDark ? '#4a5568' : '#e2e8f0';

  const t2Color = isDark ? '#90cdf4' : '#2b6cb0'; // blue
  const t1Color = isDark ? '#f6ad55' : '#c05621'; // orange

  const planColor = isDark ? '#9ae6b4' : '#276749';
  const writeColor = isDark ? '#63b3ed' : '#2b6cb0';
  const checkColor = isDark ? '#fbd38d' : '#975a16';

  /* ── timeline bar ────────────────────────────────────────────── */
  const tlWidth = Math.min(width - 32, 560);
  const tlH = 36;
  const pxPerMin = grandTotal > 0 ? tlWidth / grandTotal : tlWidth / 60;

  type Segment = { label: string; min: number; color: string };
  const segments: Segment[] = [
    { label: `Plan T2 ${t2Plan}m`, min: t2Plan, color: planColor },
    { label: `Write T2 ${t2Write}m`, min: t2Write, color: writeColor },
    { label: `Check T2 ${t2Check}m`, min: t2Check, color: checkColor },
    { label: `Plan T1 ${t1Plan}m`, min: t1Plan, color: planColor },
    { label: `Write T1 ${t1Write}m`, min: t1Write, color: writeColor },
    { label: `Check T1 ${t1Check}m`, min: t1Check, color: checkColor },
  ];

  let cursor = 0;
  const segRects = segments.map((s) => {
    const x = cursor * pxPerMin;
    const w = s.min * pxPerMin;
    cursor += s.min;
    return { ...s, x, w };
  });

  /* hard-stop marker at minute 40 */
  const hardStopX = Math.min(40 * pxPerMin, tlWidth);

  /* ── status rows ─────────────────────────────────────────────── */
  type Check = { label: string; pass: boolean; warn?: boolean; note: string };
  const checks: Check[] = [
    {
      label: 'Total = 60 min',
      pass: grandOk,
      note: `${grandTotal} min used`,
    },
    {
      label: 'Task 2 = 40 min',
      pass: t2Ok,
      warn: !t2Ok && t2Total >= 35 && t2Total <= 44,
      note: `${t2Total} min`,
    },
    {
      label: 'Task 1 = 20 min',
      pass: t1Ok,
      warn: !t1Ok && t1Total >= 17 && t1Total <= 23,
      note: `${t1Total} min`,
    },
    {
      label: 'T2 gets ≥ 2/3 of time',
      pass: ratioOk,
      note: `${Math.round(t2Fraction * 100)}% of total`,
    },
    {
      label: 'T2 writing pace ≥ 250 w',
      pass: t2WordOk,
      note: `~${t2Words} words at ${WPM} wpm`,
    },
    {
      label: 'T1 writing pace ≥ 150 w',
      pass: t1WordOk,
      note: `~${t1Words} words at ${WPM} wpm`,
    },
  ];

  const allPass = checks.every((c) => c.pass);

  /* ── bar chart max width ─────────────────────────────────────── */
  const barMaxPx = Math.min(width - 32, 340);

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        background: bg,
        borderRadius: 10,
        padding: 16,
        color: textColor,
        userSelect: 'none',
      }}
    >
      {/* ── Section: Task 2 sliders ───────────────────────────── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: t2Color,
            marginBottom: 6,
          }}
        >
          Task 2 — {t2Total} min
          {t2Ok ? '' : t2Total > 40 ? ' (over budget)' : ' (under budget)'}
        </div>
        <ControlRow>
          <Slider
            label="Plan T2"
            min={0}
            max={15}
            value={t2Plan}
            onChange={setT2Plan}
          />
        </ControlRow>
        <ControlRow>
          <Slider
            label="Write T2"
            min={10}
            max={40}
            value={t2Write}
            onChange={setT2Write}
          />
        </ControlRow>
        <ControlRow>
          <Slider
            label="Check T2"
            min={0}
            max={10}
            value={t2Check}
            onChange={setT2Check}
          />
        </ControlRow>
        {/* Phase breakdown bars */}
        <div style={{ marginTop: 8 }}>
          <PhaseBar label="Plan" minutes={t2Plan} total={t2Total} color={planColor} barMaxPx={barMaxPx} />
          <PhaseBar label="Write" minutes={t2Write} total={t2Total} color={writeColor} barMaxPx={barMaxPx} />
          <PhaseBar label="Check" minutes={t2Check} total={t2Total} color={checkColor} barMaxPx={barMaxPx} />
        </div>
      </div>

      {/* ── Section: Task 1 sliders ───────────────────────────── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: t1Color,
            marginBottom: 6,
          }}
        >
          Task 1 — {t1Total} min
          {t1Ok ? '' : t1Total > 20 ? ' (over budget)' : ' (under budget)'}
        </div>
        <ControlRow>
          <Slider
            label="Plan T1"
            min={0}
            max={10}
            value={t1Plan}
            onChange={setT1Plan}
          />
        </ControlRow>
        <ControlRow>
          <Slider
            label="Write T1"
            min={5}
            max={25}
            value={t1Write}
            onChange={setT1Write}
          />
        </ControlRow>
        <ControlRow>
          <Slider
            label="Check T1"
            min={0}
            max={8}
            value={t1Check}
            onChange={setT1Check}
          />
        </ControlRow>
        {/* Phase breakdown bars */}
        <div style={{ marginTop: 8 }}>
          <PhaseBar label="Plan" minutes={t1Plan} total={t1Total} color={planColor} barMaxPx={barMaxPx} />
          <PhaseBar label="Write" minutes={t1Write} total={t1Total} color={writeColor} barMaxPx={barMaxPx} />
          <PhaseBar label="Check" minutes={t1Check} total={t1Total} color={checkColor} barMaxPx={barMaxPx} />
        </div>
      </div>

      {/* ── Timeline bar ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: mutedText, marginBottom: 4 }}>
          Timeline (0 – {grandTotal} min)
        </div>
        <svg
          width={tlWidth}
          height={tlH + 18}
          style={{ display: 'block', overflow: 'visible' }}
          aria-label="60-minute timeline"
        >
          {/* background track */}
          <rect x={0} y={0} width={tlWidth} height={tlH} rx={5} fill={isDark ? '#4a5568' : '#e2e8f0'} />
          {/* segments */}
          {segRects.map((s, i) => (
            <g key={i}>
              <rect
                x={s.x}
                y={0}
                width={Math.max(s.w, 0)}
                height={tlH}
                rx={i === 0 ? 5 : i === segRects.length - 1 ? 5 : 0}
                fill={s.color}
                opacity={0.8}
              />
            </g>
          ))}
          {/* Hard stop line at minute 40 */}
          <line
            x1={hardStopX}
            y1={-6}
            x2={hardStopX}
            y2={tlH + 2}
            stroke={isDark ? '#fc8181' : '#e53e3e'}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          <text
            x={hardStopX + 3}
            y={-1}
            fontSize={10}
            fontWeight={700}
            fill={isDark ? '#fc8181' : '#e53e3e'}
            fontFamily="monospace"
          >
            HARD STOP min 40
          </text>
          {/* Minute tick labels */}
          {[0, 10, 20, 30, 40, 50, 60].map((m) => {
            const tx = m * pxPerMin;
            if (tx > tlWidth + 1) return null;
            return (
              <text
                key={m}
                x={tx}
                y={tlH + 14}
                fontSize={10}
                textAnchor="middle"
                fill={mutedText}
                fontFamily="monospace"
              >
                {m}
              </text>
            );
          })}
        </svg>
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 6,
            flexWrap: 'wrap',
            fontSize: 11,
            color: mutedText,
          }}
        >
          {[
            { color: planColor, label: 'Plan' },
            { color: writeColor, label: 'Write' },
            { color: checkColor, label: 'Check' },
          ].map((item) => (
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
      </div>

      {/* ── Checklist ────────────────────────────────────────────── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: textColor }}>
          Strategy checks
        </div>
        {checks.map((c, i) => {
          const color = statusColor(c.pass, !!c.warn, isDark);
          const icon = c.pass ? '✓' : c.warn ? '~' : '✗';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 5,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color,
                  width: 14,
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span style={{ color: mutedText, fontFamily: 'monospace', fontSize: 11 }}>
                {c.note}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Overall verdict ──────────────────────────────────────── */}
      <div
        style={{
          background: allPass
            ? isDark
              ? '#1c4532'
              : '#f0fff4'
            : isDark
            ? '#2d1515'
            : '#fff5f5',
          border: `2px solid ${statusColor(allPass, false, isDark)}`,
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          fontWeight: 700,
          color: statusColor(allPass, false, isDark),
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        {allPass
          ? 'Band 7 allocation — all checks pass. Task 2 protected.'
          : 'Adjust the sliders until all checks pass to reach a Band 7 allocation.'}
      </div>

      {/* ── Reset button ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button label="Reset to Band 7 defaults" onClick={reset} />
      </div>

      <p
        style={{
          fontSize: 11,
          color: mutedText,
          marginTop: 10,
          marginBottom: 0,
          borderTop: `1px solid ${border}`,
          paddingTop: 8,
        }}
      >
        Word pace assumes ~8.5 words/min under exam conditions. The dashed red line marks the
        non-negotiable Task 2 hard stop at minute 40.
      </p>
    </div>
  );
}
