import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Question-Type Classifier Drill',
  concept: 'The Five Task 2 Question Types',
  caption:
    'Read each prompt, choose the question type, then reveal the signal phrase that tells you.',
  libs: [],
};

// ─── Drill data (grounded in lesson note, section C2) ───────────────────────

interface Prompt {
  text: string;
  /** The segment of text to highlight once revealed */
  signal: string;
  type: QuestionType;
  explanation: string;
}

type QuestionType =
  | 'Opinion'
  | 'Discussion'
  | 'Adv / Disadv'
  | 'Problem / Solution'
  | 'Two-Part';

const ALL_TYPES: QuestionType[] = [
  'Opinion',
  'Discussion',
  'Adv / Disadv',
  'Problem / Solution',
  'Two-Part',
];

const PROMPTS: Prompt[] = [
  {
    text:
      'Some people argue that all university education should be funded by the government. To what extent do you agree or disagree?',
    signal: 'To what extent do you agree or disagree?',
    type: 'Opinion',
    explanation:
      '"To what extent do you agree or disagree?" requires ONE clear position — agree, partially agree, or disagree — developed with reasons.',
  },
  {
    text:
      'Some believe that governments should spend money on high-speed rail networks. Others think the money should be invested in roads. Discuss both views and give your own opinion.',
    signal: 'Discuss both views and give your own opinion.',
    type: 'Discussion',
    explanation:
      '"Discuss both views and give your own opinion" demands two developed sides PLUS a clear personal position threaded through the essay.',
  },
  {
    text:
      'Many large companies now allow employees to work from home. What are the advantages and disadvantages of this trend for businesses?',
    signal: 'What are the advantages and disadvantages',
    type: 'Adv / Disadv',
    explanation:
      '"What are the advantages and disadvantages?" calls for one body paragraph on advantages and one on disadvantages — no personal opinion required unless the prompt adds "Do the advantages outweigh the disadvantages?"',
  },
  {
    text:
      'Traffic congestion in cities is increasing. What are the main causes of this problem, and what measures could be taken to reduce it?',
    signal: 'What are the main causes … and what measures could be taken to reduce it?',
    type: 'Problem / Solution',
    explanation:
      '"Causes … measures to reduce" signals Problem/Solution: Body 1 covers causes, Body 2 covers solutions. The key is that the second half explicitly asks for solutions, not effects.',
  },
  {
    text:
      'Many cities are experiencing rapid population growth. Why is this happening? What problems does it create?',
    signal: 'Why is this happening? What problems does it create?',
    type: 'Two-Part',
    explanation:
      'Two separate question sentences ("Why…?" "What problems…?") signal a Two-Part essay. Each question needs its own body paragraph. This is NOT Problem/Solution because the second question asks about problems, not solutions.',
  },
];

// ─── Styles (inline, dark-mode-aware via CSS vars) ───────────────────────────

const CARD_BASE: React.CSSProperties = {
  borderRadius: 8,
  padding: '16px 20px',
  marginBottom: 12,
  border: '1px solid var(--ifm-color-emphasis-300)',
  background: 'var(--ifm-background-surface-color)',
  transition: 'border-color 0.2s',
};

const TYPE_COLORS: Record<QuestionType, string> = {
  Opinion: '#4c8ef7',
  Discussion: '#e07b39',
  'Adv / Disadv': '#8b5cf6',
  'Problem / Solution': '#16a34a',
  'Two-Part': '#dc2626',
};

function highlight(text: string, signal: string): React.ReactNode {
  const idx = text.indexOf(signal);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: 'rgba(250, 204, 21, 0.45)',
          borderRadius: 3,
          padding: '0 2px',
          fontWeight: 700,
          color: 'inherit',
        }}
      >
        {signal}
      </mark>
      {text.slice(idx + signal.length)}
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type DrillState = 'unanswered' | 'correct' | 'wrong';

interface PromptState {
  chosen: QuestionType | null;
  state: DrillState;
  revealed: boolean;
}

function makeInitial(): PromptState[] {
  return PROMPTS.map(() => ({ chosen: null, state: 'unanswered', revealed: false }));
}

export default function Sim({ width }: SimProps) {
  const [states, setStates] = useState<PromptState[]>(makeInitial);
  const [current, setCurrent] = useState(0);

  const ps = states[current];
  const prompt = PROMPTS[current];

  const choose = useCallback(
    (type: QuestionType) => {
      if (ps.state !== 'unanswered') return;
      const correct = type === prompt.type;
      setStates((prev) => {
        const next = [...prev];
        next[current] = {
          ...next[current],
          chosen: type,
          state: correct ? 'correct' : 'wrong',
          revealed: true,
        };
        return next;
      });
    },
    [ps.state, prompt.type, current],
  );

  const reset = useCallback(() => {
    setStates(makeInitial());
    setCurrent(0);
  }, []);

  const totalAnswered = states.filter((s) => s.state !== 'unanswered').length;
  const totalCorrect = states.filter((s) => s.state === 'correct').length;

  const narrow = width < 480;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Progress bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {PROMPTS.map((p, i) => {
          const s = states[i];
          const bg =
            s.state === 'correct'
              ? '#16a34a'
              : s.state === 'wrong'
              ? '#dc2626'
              : i === current
              ? 'var(--ifm-color-primary)'
              : 'var(--ifm-color-emphasis-300)';
          return (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: bg,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
                opacity: i === current ? 1 : 0.75,
              }}
              aria-label={`Prompt ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
        <span
          style={{
            marginLeft: 8,
            fontSize: 13,
            color: 'var(--ifm-color-emphasis-700)',
          }}
        >
          {totalCorrect}/{PROMPTS.length} correct
        </span>
        <div style={{ flex: 1 }} />
        <ControlRow>
          <Button label="Reset" onClick={reset} />
        </ControlRow>
      </div>

      {/* Prompt card */}
      <div
        style={{
          ...CARD_BASE,
          borderColor:
            ps.state === 'correct'
              ? '#16a34a'
              : ps.state === 'wrong'
              ? '#dc2626'
              : 'var(--ifm-color-emphasis-300)',
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ifm-color-emphasis-600)',
          }}
        >
          Prompt {current + 1} of {PROMPTS.length}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: narrow ? 14 : 15,
            lineHeight: 1.6,
            color: 'var(--ifm-font-color-base)',
          }}
        >
          {ps.revealed ? highlight(prompt.text, prompt.signal) : prompt.text}
        </p>
      </div>

      {/* Answer buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {ALL_TYPES.map((type) => {
          const color = TYPE_COLORS[type];
          const isChosen = ps.chosen === type;
          const isCorrect = type === prompt.type;
          let bg = 'var(--ifm-background-surface-color)';
          let border = `2px solid ${color}`;
          let textColor = color;

          if (ps.state !== 'unanswered') {
            if (isCorrect) {
              bg = color;
              textColor = '#fff';
              border = `2px solid ${color}`;
            } else if (isChosen && !isCorrect) {
              bg = 'var(--ifm-color-emphasis-200)';
              border = '2px solid #dc2626';
              textColor = '#dc2626';
            } else {
              bg = 'var(--ifm-background-surface-color)';
              textColor = 'var(--ifm-color-emphasis-500)';
              border = `2px solid var(--ifm-color-emphasis-300)`;
            }
          }

          return (
            <button
              key={type}
              type="button"
              onClick={() => choose(type)}
              disabled={ps.state !== 'unanswered'}
              style={{
                padding: narrow ? '6px 10px' : '8px 16px',
                borderRadius: 20,
                background: bg,
                border,
                color: textColor,
                cursor: ps.state === 'unanswered' ? 'pointer' : 'default',
                fontWeight: 600,
                fontSize: narrow ? 12 : 13,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Feedback / explanation */}
      {ps.revealed && (
        <div
          style={{
            ...CARD_BASE,
            borderColor:
              ps.state === 'correct'
                ? '#16a34a'
                : '#dc2626',
            background:
              ps.state === 'correct'
                ? 'rgba(22, 163, 74, 0.08)'
                : 'rgba(220, 38, 38, 0.08)',
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontWeight: 700,
              fontSize: 13,
              color: ps.state === 'correct' ? '#16a34a' : '#dc2626',
            }}
          >
            {ps.state === 'correct'
              ? `Correct — ${prompt.type}`
              : `Not quite — this is ${prompt.type}`}
          </p>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 13,
              color: 'var(--ifm-font-color-base)',
              lineHeight: 1.55,
            }}
          >
            {prompt.explanation}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--ifm-color-emphasis-700)',
              fontStyle: 'italic',
            }}
          >
            Signal phrase highlighted above in yellow.
          </p>
          {/* Navigation */}
          {current < PROMPTS.length - 1 && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setCurrent((c) => c + 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  background: 'var(--ifm-color-primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Next prompt
              </button>
            </div>
          )}
          {current === PROMPTS.length - 1 && totalAnswered === PROMPTS.length && (
            <div style={{ marginTop: 10 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 14,
                  color:
                    totalCorrect === PROMPTS.length
                      ? '#16a34a'
                      : 'var(--ifm-color-primary)',
                }}
              >
                {totalCorrect === PROMPTS.length
                  ? 'All 5 correct — you can identify any Task 2 type in under 30 seconds.'
                  : `${totalCorrect}/5 correct. Press Reset to try again.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
