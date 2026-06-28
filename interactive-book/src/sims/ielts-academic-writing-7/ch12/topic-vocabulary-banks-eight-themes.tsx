import React, { useState, useCallback, useMemo } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';
import { useRng } from '@site/src/lib/useRng';

export const meta: SimMeta = {
  title: 'Theme Vocabulary Quiz',
  concept: 'Topic Vocabulary Banks Eight Themes',
  caption:
    'Choose a theme, then complete each collocation — covers all eight high-frequency IELTS topics.',
  libs: [],
};

// ─── Data (grounded directly in the lesson note C2 banks) ────────────────────

interface Collocation {
  /** The first word(s) shown as the stem */
  stem: string;
  /** The completing word(s) — the correct answer */
  completion: string;
}

const THEMES: { name: string; items: Collocation[] }[] = [
  {
    name: 'Education',
    items: [
      { stem: 'access to quality', completion: 'education' },
      { stem: 'impose', completion: 'tuition fees' },
      { stem: 'invest in early childhood', completion: 'education' },
      { stem: 'raise academic', completion: 'standards' },
      { stem: 'foster critical', completion: 'thinking' },
      { stem: 'a shortage of qualified', completion: 'teachers' },
      { stem: 'gain a competitive', completion: 'edge' },
    ],
  },
  {
    name: 'Environment',
    items: [
      { stem: 'reduce carbon', completion: 'emissions' },
      { stem: 'tackle climate', completion: 'change' },
      { stem: 'shift to renewable energy', completion: 'sources' },
      { stem: 'deplete natural', completion: 'resources' },
      { stem: 'impose a carbon', completion: 'tax' },
      { stem: 'achieve net-zero', completion: 'emissions' },
      { stem: 'raise public awareness of environmental', completion: 'issues' },
    ],
  },
  {
    name: 'Technology',
    items: [
      { stem: 'rapid technological', completion: 'advancement' },
      { stem: 'bridge the digital', completion: 'divide' },
      { stem: 'raise concerns about data', completion: 'privacy' },
      { stem: 'automate routine', completion: 'tasks' },
      { stem: 'harness the potential of artificial', completion: 'intelligence' },
      { stem: 'increase reliance on', completion: 'technology' },
      { stem: 'pose a threat to', completion: 'cybersecurity' },
    ],
  },
  {
    name: 'Health',
    items: [
      { stem: 'adopt a healthy', completion: 'lifestyle' },
      { stem: 'tackle the obesity', completion: 'epidemic' },
      { stem: 'invest in preventive', completion: 'healthcare' },
      { stem: 'a growing ageing', completion: 'population' },
      { stem: 'address mental health', completion: 'issues' },
      { stem: 'the rising cost of', completion: 'healthcare' },
      { stem: 'strain on public health', completion: 'services' },
    ],
  },
  {
    name: 'Crime / Law',
    items: [
      { stem: 'commit a', completion: 'crime' },
      { stem: 'impose harsher', completion: 'penalties' },
      { stem: 'tackle the root causes of', completion: 'crime' },
      { stem: 'rehabilitate', completion: 'offenders' },
      { stem: 'enforce the', completion: 'law' },
      { stem: 'a rise in violent', completion: 'crime' },
      { stem: 'social inequality as a driver of', completion: 'crime' },
    ],
  },
  {
    name: 'Work',
    items: [
      { stem: 'achieve a healthy work-life', completion: 'balance' },
      { stem: 'protect workers\'', completion: 'rights' },
      { stem: 'create employment', completion: 'opportunities' },
      { stem: 'a widening skills', completion: 'gap' },
      { stem: 'increase job satisfaction and staff', completion: 'retention' },
      { stem: 'remote work', completion: 'arrangements' },
      { stem: 'a competitive job', completion: 'market' },
    ],
  },
  {
    name: 'Government',
    items: [
      { stem: 'implement effective', completion: 'policies' },
      { stem: 'allocate public', completion: 'funds' },
      { stem: 'hold the government', completion: 'accountable' },
      { stem: 'tackle corruption and', completion: 'bureaucracy' },
      { stem: 'introduce sweeping', completion: 'reforms' },
      { stem: 'collaborate with the private', completion: 'sector' },
      { stem: 'meet the needs of', completion: 'citizens' },
    ],
  },
  {
    name: 'Globalization',
    items: [
      { stem: 'accelerate', completion: 'globalisation' },
      { stem: 'bridge cultural', completion: 'divides' },
      { stem: 'widen the gap between rich and poor', completion: 'nations' },
      { stem: 'exploit cheap', completion: 'labour' },
      { stem: 'increase economic', completion: 'interdependence' },
      { stem: 'erode local cultures and', completion: 'traditions' },
      { stem: 'free trade', completion: 'agreements' },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Seeded shuffle (Fisher-Yates). */
function shuffleWithRng<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick `n` items from `pool` that are not equal to `exclude`, using seeded RNG. */
function pickDistractors(pool: string[], exclude: string, n: number, rand: () => number): string[] {
  const candidates = pool.filter((x) => x !== exclude);
  return shuffleWithRng(candidates, rand).slice(0, n);
}

// ─── Colours ─────────────────────────────────────────────────────────────────

const CORRECT_BG = 'rgba(22,163,74,0.12)';
const CORRECT_BORDER = '#16a34a';
const WRONG_BG = 'rgba(220,38,38,0.10)';
const WRONG_BORDER = '#dc2626';
const NEUTRAL_BORDER = 'var(--ifm-color-emphasis-300)';

// ─── Component ───────────────────────────────────────────────────────────────

export default function Sim({ width, seed, isDark }: SimProps) {
  const rand = useRng(seed);

  const [themeIdx, setThemeIdx] = useState<number>(0);
  const [qIdx, setQIdx] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);

  const theme = THEMES[themeIdx];

  // Shuffle questions once per theme (memoized by themeIdx + seed)
  const questions = useMemo(() => {
    // Re-create a fresh rand for shuffle (independent per theme)
    const shuffleSeed = seed ^ (themeIdx * 0x9e3779b9 + 0x6c62272e);
    const localRand = (() => {
      let s = shuffleSeed >>> 0;
      return () => {
        s = Math.imul(s ^ (s >>> 15), s | 1);
        s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
        return ((s ^ (s >>> 14)) >>> 0) / 0x100000000;
      };
    })();
    return shuffleWithRng(theme.items, localRand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeIdx, seed]);

  // Build answer options for the current question (seeded distractors)
  const currentQ = questions[qIdx] ?? questions[0];

  const options = useMemo(() => {
    const allCompletions = theme.items.map((it) => it.completion);
    const distractors = pickDistractors(allCompletions, currentQ.completion, 2, rand);
    const opts = shuffleWithRng([currentQ.completion, ...distractors], rand);
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeIdx, qIdx, seed]);

  const answered = selected !== null;

  const handleSelect = useCallback(
    (opt: string) => {
      if (answered) return;
      setSelected(opt);
      const correct = opt === currentQ.completion;
      setScore((s) => (correct ? s + 1 : s));
      setTotal((t) => t + 1);
    },
    [answered, currentQ.completion],
  );

  const handleNext = useCallback(() => {
    if (qIdx + 1 >= questions.length) {
      setDone(true);
    } else {
      setQIdx((i) => i + 1);
      setSelected(null);
    }
  }, [qIdx, questions.length]);

  const handleTheme = useCallback((idx: number) => {
    setThemeIdx(idx);
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setTotal(0);
    setDone(false);
  }, []);

  const handleRestart = useCallback(() => {
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setTotal(0);
    setDone(false);
  }, []);

  const narrow = width < 500;
  const themeBtnFontSize = narrow ? 11 : 13;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Theme selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 18,
        }}
        role="tablist"
        aria-label="Choose a theme"
      >
        {THEMES.map((t, i) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            aria-selected={i === themeIdx}
            onClick={() => handleTheme(i)}
            style={{
              fontSize: themeBtnFontSize,
              fontWeight: i === themeIdx ? 700 : 400,
              padding: narrow ? '4px 8px' : '5px 12px',
              borderRadius: 20,
              border: `2px solid ${i === themeIdx ? 'var(--ifm-color-primary)' : NEUTRAL_BORDER}`,
              background: i === themeIdx ? 'var(--ifm-color-primary)' : 'transparent',
              color: i === themeIdx ? '#fff' : 'var(--ifm-font-color-base)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 5,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)' }}>
            {done
              ? `Completed ${questions.length} / ${questions.length}`
              : `Question ${qIdx + 1} of ${questions.length}`}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)' }}>
            Score: {score} / {total}
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 4,
            background: 'var(--ifm-color-emphasis-200)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 4,
              background: 'var(--ifm-color-primary)',
              width: `${((done ? questions.length : qIdx) / questions.length) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Quiz card */}
      {done ? (
        <DoneCard
          score={score}
          total={total}
          themeName={theme.name}
          onRestart={handleRestart}
          isDark={isDark}
        />
      ) : (
        <div
          style={{
            borderRadius: 10,
            border: `1px solid ${NEUTRAL_BORDER}`,
            padding: narrow ? 16 : 22,
          }}
        >
          {/* Prompt */}
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--ifm-color-emphasis-600)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
            Complete the collocation
          </p>
          <p
            style={{
              margin: '0 0 18px',
              fontSize: narrow ? 17 : 20,
              fontWeight: 700,
              color: 'var(--ifm-font-color-base)',
              lineHeight: 1.4,
            }}
          >
            {currentQ.stem}{' '}
            <span
              style={{
                display: 'inline-block',
                minWidth: 80,
                borderBottom: '3px solid var(--ifm-color-primary)',
                verticalAlign: 'bottom',
                marginLeft: 4,
              }}
            >
              &nbsp;
            </span>
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === currentQ.completion;
              let bg = 'transparent';
              let border = NEUTRAL_BORDER;
              let textColor = 'var(--ifm-font-color-base)';

              if (answered) {
                if (isCorrect) {
                  bg = CORRECT_BG;
                  border = CORRECT_BORDER;
                  textColor = CORRECT_BORDER;
                } else if (isSelected) {
                  bg = WRONG_BG;
                  border = WRONG_BORDER;
                  textColor = WRONG_BORDER;
                }
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  disabled={answered}
                  style={{
                    textAlign: 'left',
                    padding: narrow ? '10px 14px' : '12px 16px',
                    borderRadius: 8,
                    border: `2px solid ${border}`,
                    background: bg,
                    color: textColor,
                    cursor: answered ? 'default' : 'pointer',
                    fontSize: narrow ? 14 : 15,
                    fontWeight: isSelected || (answered && isCorrect) ? 700 : 400,
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                  aria-label={`Option: ${opt}`}
                >
                  <span style={{ flex: 1 }}>{opt}</span>
                  {answered && isCorrect && (
                    <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true">✓</span>
                  )}
                  {answered && isSelected && !isCorrect && (
                    <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true">✗</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback + next */}
          {answered && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color:
                    selected === currentQ.completion ? CORRECT_BORDER : WRONG_BORDER,
                  fontStyle: 'italic',
                }}
              >
                {selected === currentQ.completion
                  ? `Correct — "${currentQ.stem} ${currentQ.completion}"`
                  : `The full collocation is: "${currentQ.stem} ${currentQ.completion}"`}
              </p>
              <ControlRow>
                <Button
                  label={qIdx + 1 >= questions.length ? 'See results' : 'Next'}
                  onClick={handleNext}
                />
              </ControlRow>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Done card ────────────────────────────────────────────────────────────────

function DoneCard({
  score,
  total,
  themeName,
  onRestart,
  isDark,
}: {
  score: number;
  total: number;
  themeName: string;
  onRestart: () => void;
  isDark: boolean;
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const band =
    pct >= 86 ? 'Band 7 ready' : pct >= 57 ? 'Developing — review and retry' : 'Keep practising — repeat this theme';
  const bandColour =
    pct >= 86 ? CORRECT_BORDER : pct >= 57 ? '#d97706' : '#dc2626';

  return (
    <div
      style={{
        borderRadius: 10,
        border: `2px solid ${bandColour}`,
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        padding: 22,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: '0 0 6px',
          fontSize: 36,
          fontWeight: 800,
          color: bandColour,
          lineHeight: 1.1,
        }}
      >
        {pct}%
      </p>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--ifm-font-color-base)', fontWeight: 700 }}>
        {score} / {total} correct — {themeName}
      </p>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: bandColour, fontStyle: 'italic' }}>
        {band}
      </p>
      <ControlRow>
        <Button label="Retry this theme" onClick={onRestart} />
      </ControlRow>
    </div>
  );
}
