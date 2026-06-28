import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Punctuation For Complex Sentences',
  concept: 'Punctuation For Complex Sentences',
  caption:
    'Cycle through punctuation variants for each sentence and see whether the result is correct or a named error.',
  libs: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Data — three sentences, each exercising one punctuation rule.
// Each variant has a label, the rendered sentence (with a mark span), and a
// verdict: 'correct' | 'error'.  The error key names the specific mistake.
// ─────────────────────────────────────────────────────────────────────────────

interface Variant {
  mark: string;       // the punctuation mark (or lack) shown highlighted
  before: string;     // sentence text before the mark
  after: string;      // sentence text after the mark
  verdict: 'correct' | 'error';
  errorName: string;  // '' when correct
  explanation: string;
}

interface Exercise {
  rule: string;
  ruleDesc: string;
  variants: Variant[];
}

const EXERCISES: Exercise[] = [
  {
    rule: 'Rule 1',
    ruleDesc: 'Fronted subordinate clause → comma before the main clause',
    variants: [
      {
        mark: ',',
        before: 'Although the government invested heavily in infrastructure',
        after: 'the results were disappointing.',
        verdict: 'correct',
        errorName: '',
        explanation:
          'A comma after the fronted "Although…" clause correctly signals where the main clause starts.',
      },
      {
        mark: '',
        before: 'Although the government invested heavily in infrastructure',
        after: 'the results were disappointing.',
        verdict: 'error',
        errorName: 'Missing comma',
        explanation:
          'Without a comma after the fronted subordinate clause the reader must re-parse the boundary between the subordinate and main clause — a punctuation error the examiner notes.',
      },
      {
        mark: ';',
        before: 'Although the government invested heavily in infrastructure',
        after: 'the results were disappointing.',
        verdict: 'error',
        errorName: 'Wrong punctuation',
        explanation:
          'A semicolon joins two independent clauses. "Although the government invested…" is a subordinate (dependent) clause, not an independent one, so a semicolon here is incorrect.',
      },
    ],
  },
  {
    rule: 'Rule 2',
    ruleDesc: 'No comma splice — two independent clauses need more than a comma',
    variants: [
      {
        mark: ', so',
        before: 'The economy grew rapidly',
        after: 'unemployment fell.',
        verdict: 'correct',
        errorName: '',
        explanation:
          'A comma followed by the coordinating conjunction "so" (FANBOYS) correctly joins two independent clauses.',
      },
      {
        mark: ',',
        before: 'The economy grew rapidly',
        after: 'unemployment fell.',
        verdict: 'error',
        errorName: 'Comma splice',
        explanation:
          'Two independent clauses joined only by a comma is a comma splice — a formal grammatical error in academic writing. Fix with a semicolon, a conjunction, or two sentences.',
      },
      {
        mark: ';',
        before: 'The economy grew rapidly',
        after: 'unemployment fell.',
        verdict: 'correct',
        errorName: '',
        explanation:
          'A semicolon joins two closely related independent clauses. Note the lowercase "unemployment" after the semicolon — correct unless a proper noun follows.',
      },
      {
        mark: '.',
        before: 'The economy grew rapidly',
        after: 'Unemployment fell.',
        verdict: 'correct',
        errorName: '',
        explanation:
          'Two separate sentences is always safe. The second sentence begins with a capital letter. This is correct, though it loses the sense of close connection a semicolon would convey.',
      },
    ],
  },
  {
    rule: 'Rule 3',
    ruleDesc: 'Semicolon — joins two independent clauses; lower-case follows',
    variants: [
      {
        mark: '; consequently,',
        before: 'Urban migration increases pressure on public services',
        after: 'governments must invest in infrastructure.',
        verdict: 'correct',
        errorName: '',
        explanation:
          'The semicolon ends the first independent clause; the conjunctive adverb "consequently" (lower-case, followed by its own comma) opens the second. This is the standard academic pattern.',
      },
      {
        mark: '; Consequently,',
        before: 'Urban migration increases pressure on public services',
        after: 'governments must invest in infrastructure.',
        verdict: 'error',
        errorName: 'Capital after semicolon',
        explanation:
          'A word after a semicolon is lower-case unless it is a proper noun. "Consequently" is not a proper noun, so capitalising it is an error.',
      },
      {
        mark: ', consequently,',
        before: 'Urban migration increases pressure on public services',
        after: 'governments must invest in infrastructure.',
        verdict: 'error',
        errorName: 'Comma splice',
        explanation:
          'A conjunctive adverb such as "consequently" is not a coordinating conjunction. Placing only a comma before it still creates a comma splice between two independent clauses.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Sim({ width, isDark }: SimProps) {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);

  const exercise = EXERCISES[exerciseIdx];
  const variant = exercise.variants[variantIdx];
  const isCorrect = variant.verdict === 'correct';

  function nextVariant() {
    setVariantIdx((v) => (v + 1) % exercise.variants.length);
  }
  function prevVariant() {
    setVariantIdx((v) => (v - 1 + exercise.variants.length) % exercise.variants.length);
  }
  function selectExercise(i: number) {
    setExerciseIdx(i);
    setVariantIdx(0);
  }

  // Colors
  const bg = isDark ? '#1e1e2e' : '#f8f9fb';
  const cardBg = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedColor = isDark ? '#a0aec0' : '#718096';
  const borderColor = isDark ? '#4a5568' : '#e2e8f0';
  const correctBg = isDark ? '#22543d' : '#f0fff4';
  const correctBorder = isDark ? '#48bb78' : '#38a169';
  const errorBg = isDark ? '#742a2a' : '#fff5f5';
  const errorBorder = isDark ? '#fc8181' : '#e53e3e';
  const markCorrect = isDark ? '#68d391' : '#276749';
  const markError = isDark ? '#fc8181' : '#c53030';
  const tabActiveBg = isDark ? '#4f86c6' : '#2b6cb0';

  const isNarrow = width < 480;

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: bg,
        borderRadius: 10,
        padding: isNarrow ? 12 : 16,
        userSelect: 'none',
        color: textColor,
      }}
    >
      {/* Rule tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        {EXERCISES.map((ex, i) => (
          <button
            key={ex.rule}
            type="button"
            onClick={() => selectExercise(i)}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: i === exerciseIdx ? tabActiveBg : (isDark ? '#4a5568' : '#e2e8f0'),
              color: i === exerciseIdx ? '#fff' : textColor,
              transition: 'background 0.15s',
            }}
          >
            {ex.rule}
          </button>
        ))}
      </div>

      {/* Rule description */}
      <div
        style={{
          fontSize: 13,
          color: mutedColor,
          marginBottom: 14,
          lineHeight: 1.5,
          borderLeft: `3px solid ${isDark ? '#4f86c6' : '#2b6cb0'}`,
          paddingLeft: 10,
        }}
      >
        {exercise.ruleDesc}
      </div>

      {/* Sentence display */}
      <div
        style={{
          background: cardBg,
          border: `1.5px solid ${isCorrect ? correctBorder : errorBorder}`,
          borderRadius: 8,
          padding: isNarrow ? '14px 12px' : '16px 18px',
          marginBottom: 14,
          transition: 'border-color 0.2s',
        }}
      >
        <div
          style={{
            fontSize: isNarrow ? 15 : 17,
            lineHeight: 1.7,
            letterSpacing: '0.01em',
          }}
        >
          <span style={{ color: textColor }}>{variant.before}</span>
          <span
            style={{
              fontWeight: 700,
              color: isCorrect ? markCorrect : markError,
              background: isCorrect
                ? (isDark ? 'rgba(104,211,145,0.15)' : 'rgba(56,161,105,0.12)')
                : (isDark ? 'rgba(252,129,129,0.18)' : 'rgba(229,62,62,0.1)'),
              borderRadius: 3,
              padding: '0 3px',
              transition: 'color 0.2s',
            }}
          >
            {variant.mark === '' ? ' [no punctuation] ' : variant.mark}
          </span>
          <span style={{ color: textColor }}> {variant.after}</span>
        </div>
      </div>

      {/* Verdict badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: isCorrect ? correctBg : errorBg,
          border: `1.5px solid ${isCorrect ? correctBorder : errorBorder}`,
          borderRadius: 6,
          padding: '6px 14px',
          marginBottom: 12,
          fontSize: 13,
          fontWeight: 600,
          color: isCorrect ? (isDark ? '#9ae6b4' : '#276749') : (isDark ? '#feb2b2' : '#c53030'),
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 16 }}>{isCorrect ? '✓' : '✗'}</span>
        <span>
          {isCorrect ? 'Correct' : `Error: ${variant.errorName}`}
        </span>
      </div>

      {/* Explanation */}
      <div
        style={{
          fontSize: 13,
          color: mutedColor,
          lineHeight: 1.6,
          background: isDark ? '#1a202c' : '#f7fafc',
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 16,
        }}
      >
        {variant.explanation}
      </div>

      {/* Navigation controls */}
      <ControlRow>
        <Button label="Previous variant" onClick={prevVariant} />
        <span
          style={{
            fontSize: 13,
            color: mutedColor,
            margin: '0 12px',
            alignSelf: 'center',
          }}
        >
          Variant {variantIdx + 1} of {exercise.variants.length}
        </span>
        <Button label="Next variant" onClick={nextVariant} />
      </ControlRow>
    </div>
  );
}
