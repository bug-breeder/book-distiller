import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Band 6 → Band 7 Upgrade Walkthrough',
  concept: 'Upgrading Band 6 To Band 7 Sentences',
  caption:
    'Step through each upgrade move — Fix error first, then Combine, then Collocate — and see exactly what changes at each stage.',
  libs: [],
};

// ---------------------------------------------------------------------------
// Data — two examples directly from the lesson text
// ---------------------------------------------------------------------------

interface Token {
  text: string;
  /** which move introduced or modified this token (0 = original) */
  move?: 1 | 2 | 3;
  /** true when this token replaces something that was wrong/vague in the prior step */
  replaced?: boolean;
}

interface Step {
  moveLabel: string;
  moveName: string;
  moveColor: 'error' | 'combine' | 'colloc' | 'none';
  description: string;
  sentence: string;
  // pairs of [old fragment, new fragment] for highlight annotation
  changes: Array<{ old: string; next: string; type: 'error' | 'combine' | 'colloc' }>;
}

interface Example {
  id: string;
  topic: string;
  steps: Step[];
}

const EXAMPLES: Example[] = [
  {
    id: 'social-media',
    topic: 'Social Media',
    steps: [
      {
        moveLabel: 'Band 6',
        moveName: 'Start',
        moveColor: 'none',
        description:
          'Two flat simple sentences. "have" disagrees with the singular subject "Social media." "have a big effect on" and "too much" are vague Band 6 phrases.',
        sentence:
          'Social media have a big effect on young people. It make them spend too much time online.',
        changes: [],
      },
      {
        moveLabel: 'Move 3',
        moveName: 'Fix the one error',
        moveColor: 'error',
        description:
          '"Social media" is grammatically singular in academic English — fix "have" → "has" and "make" → "makes". Now both sentences are error-free simple sentences. Fixing errors before combining prevents carrying a broken structure into the complex sentence.',
        sentence:
          'Social media has a big effect on young people. It makes them spend too much time online.',
        changes: [
          { old: 'have', next: 'has', type: 'error' },
          { old: 'make', next: 'makes', type: 'error' },
        ],
      },
      {
        moveLabel: 'Move 1',
        moveName: 'Combine',
        moveColor: 'combine',
        description:
          'Merge the two simple sentences into one complex sentence using a present-participle clause ("encouraging them to …"). This directly addresses GRA band-7 requirement: "uses a variety of complex structures."',
        sentence:
          'Social media has a big effect on young people, encouraging them to spend too much time online.',
        changes: [
          {
            old: '. It makes them spend too much time online.',
            next: ', encouraging them to spend too much time online.',
            type: 'combine',
          },
        ],
      },
      {
        moveLabel: 'Move 2',
        moveName: 'Collocate',
        moveColor: 'colloc',
        description:
          'Replace vague high-frequency phrases with precise collocations. "has a big effect on" → "significantly affects" (verb collocation, more precise). "too much" → "excessive" (more formal, precise adjective). This addresses LR band-7: "less common lexical items used with some awareness of collocation."',
        sentence:
          'Social media significantly affects young people, encouraging them to spend excessive time online.',
        changes: [
          { old: 'has a big effect on', next: 'significantly affects', type: 'colloc' },
          { old: 'too much', next: 'excessive', type: 'colloc' },
        ],
      },
    ],
  },
  {
    id: 'online-learning',
    topic: 'Online Learning',
    steps: [
      {
        moveLabel: 'Band 6',
        moveName: 'Start',
        moveColor: 'none',
        description:
          'Two flat simple sentences. "have" and "give" disagree with "Online learning" (singular). "many benefit" is missing the plural -s. "a big chance" and "study at home" are vague Band 6 phrases.',
        sentence: 'Online learning have many benefit. It give students a big chance to study at home.',
        changes: [],
      },
      {
        moveLabel: 'Move 3',
        moveName: 'Fix the one error',
        moveColor: 'error',
        description:
          'Fix subject-verb agreement: "have" → "has", "give" → "gives". Fix noun: "benefit" → "benefits". Both sentences are now error-free. Notice that fixing errors first keeps the combine step clean.',
        sentence:
          'Online learning has many benefits. It gives students a big chance to study at home.',
        changes: [
          { old: 'have', next: 'has', type: 'error' },
          { old: 'benefit', next: 'benefits', type: 'error' },
          { old: 'give', next: 'gives', type: 'error' },
        ],
      },
      {
        moveLabel: 'Move 1',
        moveName: 'Combine',
        moveColor: 'combine',
        description:
          'Merge into one complex sentence with a present-participle clause: "giving students …". One well-formed complex structure per paragraph convincingly demonstrates GRA band-7 range.',
        sentence:
          'Online learning has many benefits, giving students a big chance to study at home.',
        changes: [
          {
            old: '. It gives students a big chance to study at home.',
            next: ', giving students a big chance to study at home.',
            type: 'combine',
          },
        ],
      },
      {
        moveLabel: 'Move 2',
        moveName: 'Collocate',
        moveColor: 'colloc',
        description:
          '"a big chance" → "the opportunity" (precise nominal collocation). "study at home" → "study from home" (the standard collocation for remote learning — "at home" is not wrong, but "from home" is the fixed phrase in academic writing about remote education).',
        sentence:
          'Online learning has many benefits, giving students the opportunity to study from home.',
        changes: [
          { old: 'a big chance', next: 'the opportunity', type: 'colloc' },
          { old: 'study at home', next: 'study from home', type: 'colloc' },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers — annotate which spans changed between two steps
// ---------------------------------------------------------------------------

/**
 * Produce annotated HTML-like segments for a sentence, highlighting
 * spans that are new/changed at this step.
 */
function annotateChanges(
  sentence: string,
  changes: Array<{ old: string; next: string; type: 'error' | 'combine' | 'colloc' }>,
  direction: 'incoming' | 'outgoing',
): Array<{ text: string; type: 'error' | 'combine' | 'colloc' | null }> {
  if (changes.length === 0) return [{ text: sentence, type: null }];

  let remaining = sentence;
  const segments: Array<{ text: string; type: 'error' | 'combine' | 'colloc' | null }> = [];

  for (const change of changes) {
    const target = direction === 'incoming' ? change.next : change.old;
    const idx = remaining.indexOf(target);
    if (idx === -1) continue;
    if (idx > 0) segments.push({ text: remaining.slice(0, idx), type: null });
    segments.push({ text: target, type: change.type });
    remaining = remaining.slice(idx + target.length);
  }
  if (remaining.length > 0) segments.push({ text: remaining, type: null });
  return segments;
}

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

const MOVE_COLORS = {
  error: {
    light: { bg: '#fff5f5', border: '#fc8181', text: '#c53030', tag: '#9b2c2c' },
    dark:  { bg: '#2d1515', border: '#e05252', text: '#feb2b2', tag: '#fc8181' },
  },
  combine: {
    light: { bg: '#ebf8ff', border: '#63b3ed', text: '#2b6cb0', tag: '#2c5282' },
    dark:  { bg: '#12263a', border: '#4299e1', text: '#90cdf4', tag: '#63b3ed' },
  },
  colloc: {
    light: { bg: '#f0fff4', border: '#68d391', text: '#276749', tag: '#22543d' },
    dark:  { bg: '#0f2318', border: '#48bb78', text: '#9ae6b4', tag: '#68d391' },
  },
  none: {
    light: { bg: '#fffbeb', border: '#f6ad55', text: '#744210', tag: '#975a16' },
    dark:  { bg: '#211608', border: '#d97706', text: '#fbbf24', tag: '#f59e0b' },
  },
} as const;

type MoveColor = keyof typeof MOVE_COLORS;

function palette(moveColor: MoveColor, isDark: boolean) {
  return MOVE_COLORS[moveColor][isDark ? 'dark' : 'light'];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Sim({ width, isDark }: SimProps) {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  const example = EXAMPLES[exampleIdx];
  const step = example.steps[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === example.steps.length - 1;

  const bg        = isDark ? '#1a202c' : '#f8f9fb';
  const cardBg    = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border    = isDark ? '#4a5568' : '#e2e8f0';
  const compact   = width < 480;
  const fs        = compact ? 13 : 15;

  // Annotated sentence segments for current step
  const segments = annotateChanges(step.sentence, step.changes, 'incoming');

  // Stepper circles
  const stepLabels = example.steps.map(s => s.moveLabel);

  function handleExampleSwitch(idx: number) {
    setExampleIdx(idx);
    setStepIdx(0);
  }

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: bg,
        borderRadius: 10,
        padding: compact ? 12 : 20,
        color: textColor,
        userSelect: 'none',
      }}
    >
      {/* Example selector */}
      <ControlRow>
        {EXAMPLES.map((ex, i) => {
          const active = i === exampleIdx;
          const pal = palette('combine', isDark);
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => handleExampleSwitch(i)}
              style={{
                padding: compact ? '5px 12px' : '6px 18px',
                fontSize: compact ? 12 : 13,
                fontWeight: 700,
                borderRadius: 20,
                border: `2px solid ${active ? pal.border : border}`,
                background: active ? pal.bg : cardBg,
                color: active ? pal.text : textColor,
                cursor: 'pointer',
                marginRight: 8,
              }}
            >
              {ex.topic}
            </button>
          );
        })}
      </ControlRow>

      {/* Progress stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 4 : 6,
          margin: '14px 0 10px',
          flexWrap: 'wrap',
        }}
      >
        {stepLabels.map((label, i) => {
          const s = example.steps[i];
          const isActive = i === stepIdx;
          const isDone = i < stepIdx;
          const pal = palette(s.moveColor, isDark);
          return (
            <React.Fragment key={label}>
              <button
                type="button"
                onClick={() => setStepIdx(i)}
                title={s.moveName}
                style={{
                  minWidth: compact ? 60 : 76,
                  padding: compact ? '4px 8px' : '5px 10px',
                  fontSize: compact ? 11 : 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: `2px solid ${isActive ? pal.border : isDone ? pal.border : border}`,
                  background: isActive ? pal.bg : isDone ? (isDark ? '#1a2a1a' : '#f0fff4') : cardBg,
                  color: isActive ? pal.text : isDone ? mutedText : mutedText,
                  cursor: 'pointer',
                  opacity: isDone ? 0.7 : 1,
                  textAlign: 'center',
                }}
              >
                {label}
              </button>
              {i < stepLabels.length - 1 && (
                <span style={{ color: mutedText, fontSize: compact ? 12 : 14, fontWeight: 700 }}>
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Move name badge */}
      <div style={{ marginBottom: 8 }}>
        <span
          style={{
            display: 'inline-block',
            padding: compact ? '3px 10px' : '4px 14px',
            borderRadius: 20,
            fontSize: compact ? 11 : 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: palette(step.moveColor, isDark).bg,
            color: palette(step.moveColor, isDark).tag,
            border: `1px solid ${palette(step.moveColor, isDark).border}`,
          }}
        >
          {step.moveLabel === 'Band 6' ? 'Band 6 — starting point' : `${step.moveLabel} — ${step.moveName}`}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: compact ? 12 : 13,
          color: mutedText,
          margin: '0 0 10px',
          lineHeight: 1.6,
        }}
      >
        {step.description}
      </p>

      {/* Annotated sentence */}
      <div
        style={{
          background: cardBg,
          border: `2px solid ${palette(step.moveColor, isDark).border}`,
          borderRadius: 8,
          padding: compact ? '10px 12px' : '14px 18px',
          fontSize: fs,
          lineHeight: 1.7,
          marginBottom: 12,
        }}
      >
        {segments.map((seg, i) => {
          if (!seg.type) {
            return (
              <span key={i} style={{ color: textColor }}>
                {seg.text}
              </span>
            );
          }
          const pal = palette(seg.type as MoveColor, isDark);
          return (
            <span
              key={i}
              style={{
                background: pal.bg,
                color: pal.text,
                borderRadius: 3,
                padding: '1px 3px',
                fontWeight: 700,
                border: `1px solid ${pal.border}`,
              }}
            >
              {seg.text}
            </span>
          );
        })}
      </div>

      {/* Change summary — what was swapped */}
      {step.changes.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {step.changes.map((c, i) => {
            const pal = palette(c.type as MoveColor, isDark);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  padding: compact ? '4px 8px' : '5px 10px',
                  fontSize: compact ? 11 : 12,
                }}
              >
                <span
                  style={{
                    color: isDark ? '#fc8181' : '#c53030',
                    textDecoration: 'line-through',
                    fontStyle: 'italic',
                  }}
                >
                  {c.old.length > 40 ? c.old.slice(0, 40) + '…' : c.old}
                </span>
                <span style={{ color: mutedText, fontWeight: 700 }}>→</span>
                <span
                  style={{
                    color: pal.text,
                    fontWeight: 700,
                  }}
                >
                  {c.next.length > 40 ? c.next.slice(0, 40) + '…' : c.next}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <ControlRow>
        <Button
          label="← Back"
          onClick={() => setStepIdx(s => Math.max(0, s - 1))}
        />
        <Button
          label="Next →"
          onClick={() => setStepIdx(s => Math.min(example.steps.length - 1, s + 1))}
        />
        <Button label="Reset" onClick={() => setStepIdx(0)} />
      </ControlRow>

      {/* Final band indicator */}
      {isLast && (
        <div
          style={{
            marginTop: 12,
            background: palette('colloc', isDark).bg,
            border: `2px solid ${palette('colloc', isDark).border}`,
            borderRadius: 8,
            padding: compact ? '8px 12px' : '10px 16px',
            fontSize: compact ? 12 : 13,
            color: palette('colloc', isDark).text,
            fontWeight: 600,
          }}
        >
          Band 7 achieved — one complex structure, no agreement/article error, precise collocation. One or two moves per sentence is enough; applying all three at once risks introducing new errors.
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          marginTop: 14,
          borderTop: `1px solid ${border}`,
          paddingTop: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: compact ? 6 : 8,
        }}
      >
        {(
          [
            { color: 'error' as MoveColor, label: 'Move 3 — Fix error (GRA accuracy)' },
            { color: 'combine' as MoveColor, label: 'Move 1 — Combine (GRA variety)' },
            { color: 'colloc' as MoveColor, label: 'Move 2 — Collocate (LR precision)' },
          ] as const
        ).map(({ color, label }) => {
          const pal = palette(color, isDark);
          return (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: compact ? 10 : 11,
                color: textColor,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: pal.bg,
                  border: `1px solid ${pal.border}`,
                }}
              />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
