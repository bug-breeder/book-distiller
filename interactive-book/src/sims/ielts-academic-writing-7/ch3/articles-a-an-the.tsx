import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Article Decision Trainer',
  concept: 'Articles A An The',
  caption: 'Step through the three-question decision flow for each noun phrase and pick the right article.',
  libs: [],
};

// ─────────────────────────────────────────────────────────────
// Each item has a noun phrase in a sentence context.
// The decision tree follows the lesson's three-branch flow:
//   Q1: Is the referent known/specific to both writer and reader?
//     yes → "the"
//     no  → Q2
//   Q2: Is the noun countable singular (and not generic)?
//     yes → "a" / "an"
//     no  → zero article
// ─────────────────────────────────────────────────────────────

type Article = 'a/an' | 'the' | 'zero';

interface Item {
  sentence: string;         // Full sentence with ___ in place of the article
  noun: string;             // The noun phrase in question
  hint: string;             // Short hint explaining context
  q1Answer: boolean;        // true = known/specific → "the"
  q2Answer: boolean | null; // true = countable singular → "a/an"; null when q1 is yes
  correct: Article;
  explanation: string;
}

const ITEMS: Item[] = [
  {
    sentence: '___ government should invest in education.',
    noun: 'government',
    hint: 'Generic reference — any government in general.',
    q1Answer: false,
    q2Answer: false,
    correct: 'zero',
    explanation:
      '"Government" here is a generic actor (uncountable/generic plural sense). Neither writer nor reader has a specific government in mind. Use zero article.',
  },
  {
    sentence: 'A researcher conducted ___ study described in this paper.',
    noun: 'study',
    hint: 'The paper is about exactly this study — both parties know which one.',
    q1Answer: true,
    q2Answer: null,
    correct: 'the',
    explanation:
      '"The study" — both writer and reader know which study is meant (the one the paper describes). Use "the".',
  },
  {
    sentence: '___ developer wrote the script that crashed the server.',
    noun: 'developer',
    hint: 'First mention; not yet identified — one developer among many possible.',
    q1Answer: false,
    q2Answer: true,
    correct: 'a/an',
    explanation:
      '"A developer" — first mention, non-specific, countable singular. Use "a".',
  },
  {
    sentence: '___ research shows that exercise improves cognition.',
    noun: 'research',
    hint: 'General claim about research as a category — not one specific study.',
    q1Answer: false,
    q2Answer: false,
    correct: 'zero',
    explanation:
      '"Research" is uncountable and used generically here. Zero article.',
  },
  {
    sentence:
      'Scientists found ___ error in the original dataset.',
    noun: 'error',
    hint: 'One error, not yet introduced to the reader.',
    q1Answer: false,
    q2Answer: true,
    correct: 'a/an',
    explanation:
      '"An error" — first mention, non-specific, countable singular. Use "an" (vowel sound).',
  },
  {
    sentence: '___ data from the 2023 survey support this hypothesis.',
    noun: 'data',
    hint: 'Specific data set identified by the phrase "from the 2023 survey".',
    q1Answer: true,
    q2Answer: null,
    correct: 'the',
    explanation:
      '"The data" — the post-modifying phrase "from the 2023 survey" identifies exactly which data set. Use "the".',
  },
  {
    sentence: 'In academic writing, ___ ideas must be supported by evidence.',
    noun: 'ideas',
    hint: 'Generic statement about ideas in general.',
    q1Answer: false,
    q2Answer: false,
    correct: 'zero',
    explanation:
      '"Ideas" is a generic plural (all ideas in academic writing). Zero article.',
  },
];

type Phase = 'q1' | 'q2' | 'choose' | 'feedback';

function correctLabel(a: Article): string {
  if (a === 'zero') return 'zero article (no word)';
  return `"${a}"`;
}

export default function Sim({ width, isDark }: SimProps) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('q1');
  const [q1Choice, setQ1Choice] = useState<boolean | null>(null);
  const [q2Choice, setQ2Choice] = useState<boolean | null>(null);
  const [userArticle, setUserArticle] = useState<Article | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [done, setDone] = useState(false);

  const item = ITEMS[idx];

  // ── colours ──────────────────────────────────────────────────
  const bg        = isDark ? '#1e1e2e' : '#f8f9fb';
  const cardBg    = isDark ? '#2d3748' : '#fff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedColor = isDark ? '#a0aec0' : '#718096';
  const primaryBg = isDark ? '#2b4a8c' : '#ebf4ff';
  const primaryBorder = isDark ? '#4f86c6' : '#3182ce';
  const goodBg    = isDark ? '#1c4532' : '#f0fff4';
  const goodBorder = isDark ? '#48bb78' : '#38a169';
  const badBg     = isDark ? '#5c1d1d' : '#fff5f5';
  const badBorder = isDark ? '#fc8181' : '#e53e3e';
  const btnBase: React.CSSProperties = {
    cursor: 'pointer',
    border: '1.5px solid',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    transition: 'opacity 0.15s',
    background: cardBg,
    color: textColor,
    borderColor: isDark ? '#4a5568' : '#cbd5e0',
  };
  const btnYes: React.CSSProperties = { ...btnBase, borderColor: goodBorder, color: isDark ? '#68d391' : '#276749' };
  const btnNo: React.CSSProperties  = { ...btnBase, borderColor: isDark ? '#fc8181' : '#e53e3e', color: isDark ? '#fc8181' : '#c53030' };

  // ── article button highlight ──────────────────────────────────
  function articleBtnStyle(a: Article): React.CSSProperties {
    const selected = userArticle === a;
    const isCorrect = a === item.correct;
    let borderColor = isDark ? '#4a5568' : '#cbd5e0';
    let bgColor = cardBg;
    if (phase === 'feedback') {
      if (isCorrect) { borderColor = goodBorder; bgColor = goodBg; }
      else if (selected && !isCorrect) { borderColor = badBorder; bgColor = badBg; }
    } else if (selected) {
      borderColor = primaryBorder; bgColor = primaryBg;
    }
    return {
      ...btnBase,
      borderColor,
      background: bgColor,
      minWidth: 110,
    };
  }

  // ── handlers ─────────────────────────────────────────────────
  const handleQ1 = useCallback((answer: boolean) => {
    setQ1Choice(answer);
    if (answer) {
      // known/specific → the; skip Q2
      setPhase('choose');
    } else {
      setPhase('q2');
    }
  }, []);

  const handleQ2 = useCallback((answer: boolean) => {
    setQ2Choice(answer);
    setPhase('choose');
  }, []);

  const handleChoose = useCallback((a: Article) => {
    setUserArticle(a);
    const correct = a === item.correct;
    if (correct) setScore(s => s + 1);
    setAnswered(n => n + 1);
    setPhase('feedback');
  }, [item]);

  const handleNext = useCallback(() => {
    if (idx + 1 >= ITEMS.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setPhase('q1');
      setQ1Choice(null);
      setQ2Choice(null);
      setUserArticle(null);
    }
  }, [idx]);

  const handleReset = useCallback(() => {
    setIdx(0);
    setPhase('q1');
    setQ1Choice(null);
    setQ2Choice(null);
    setUserArticle(null);
    setScore(0);
    setAnswered(0);
    setDone(false);
  }, []);

  // ── derived hint from user's path ────────────────────────────
  function treeHint(): string {
    if (q1Choice === null) return '';
    if (q1Choice) return 'Known/specific → try "the"';
    if (q2Choice === null) return 'Not known/specific → Is it countable singular?';
    if (q2Choice) return 'Not known/specific + countable singular → try "a/an"';
    return 'Not known/specific + not countable singular → try zero article';
  }

  const px = (n: number) => Math.round(n);

  // ── done screen ───────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / ITEMS.length) * 100);
    return (
      <div style={{ background: bg, borderRadius: 8, padding: 16, fontFamily: 'sans-serif', color: textColor, maxWidth: px(width) }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{score}/{ITEMS.length}</div>
          <div style={{ fontSize: 16, color: mutedColor, marginTop: 4 }}>{pct}% correct</div>
          <div style={{ marginTop: 16, fontSize: 14, color: mutedColor }}>
            {pct === 100
              ? 'Perfect — you nailed the three-branch decision flow!'
              : pct >= 70
              ? 'Good work. Review the explanations for any misses.'
              : 'Keep practising — trace the decision tree for each noun before choosing.'}
          </div>
          <div style={{ marginTop: 20 }}>
            <ControlRow>
              <Button label="Try again" onClick={handleReset} />
            </ControlRow>
          </div>
        </div>
      </div>
    );
  }

  // ── progress bar ─────────────────────────────────────────────
  const progress = ((idx) / ITEMS.length) * 100;

  return (
    <div style={{
      background: bg,
      borderRadius: 8,
      padding: 12,
      fontFamily: 'sans-serif',
      color: textColor,
      maxWidth: px(width),
      userSelect: 'none',
    }}>

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: mutedColor }}>
          Noun phrase {idx + 1} of {ITEMS.length}
        </span>
        <span style={{ fontSize: 12, color: mutedColor }}>
          Score: {score}/{answered}
        </span>
      </div>

      {/* progress bar */}
      <div style={{ height: 4, background: isDark ? '#4a5568' : '#e2e8f0', borderRadius: 2, marginBottom: 14 }}>
        <div style={{ height: 4, width: `${progress}%`, background: primaryBorder, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* sentence card */}
      <div style={{
        background: cardBg,
        border: `1.5px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 6 }}>
          {item.sentence.replace('___', userArticle && phase === 'feedback'
            ? `[${item.correct === 'zero' ? '∅' : item.correct}]`
            : '___')}
        </div>
        <div style={{ fontSize: 12, color: mutedColor }}>
          Noun in question: <strong style={{ color: textColor }}>{item.noun}</strong> — {item.hint}
        </div>
      </div>

      {/* decision tree */}
      <div style={{
        background: isDark ? '#252535' : '#f7fafc',
        border: `1px solid ${isDark ? '#3d4460' : '#e2e8f0'}`,
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 14,
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: textColor }}>Decision tree</div>

        {/* Q1 */}
        <div style={{ marginBottom: 8, opacity: phase === 'q1' ? 1 : 0.7 }}>
          <div style={{ marginBottom: 6, color: phase === 'q1' ? textColor : mutedColor, fontWeight: phase === 'q1' ? 600 : 400 }}>
            Q1: Is the referent <em>known/specific</em> to both writer and reader?
          </div>
          {phase === 'q1' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btnYes} onClick={() => handleQ1(true)}>Yes</button>
              <button style={btnNo} onClick={() => handleQ1(false)}>No</button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: q1Choice ? (isDark ? '#68d391' : '#276749') : (isDark ? '#fc8181' : '#c53030') }}>
              {q1Choice === true ? 'Yes — known/specific' : 'No — not yet known/specific'}
            </div>
          )}
        </div>

        {/* Q2 */}
        {(phase === 'q2' || (q2Choice !== null) || (phase === 'feedback' && q1Choice === false)) && (
          <div style={{ marginBottom: 8, paddingLeft: 14, borderLeft: `2px solid ${isDark ? '#4a5568' : '#cbd5e0'}`, opacity: phase === 'q2' ? 1 : 0.7 }}>
            <div style={{ marginBottom: 6, color: phase === 'q2' ? textColor : mutedColor, fontWeight: phase === 'q2' ? 600 : 400 }}>
              Q2: Is the noun <em>countable singular</em>?
            </div>
            {phase === 'q2' ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btnYes} onClick={() => handleQ2(true)}>Yes (countable singular)</button>
                <button style={btnNo} onClick={() => handleQ2(false)}>No (plural or uncountable)</button>
              </div>
            ) : q2Choice !== null ? (
              <div style={{ fontSize: 12, color: q2Choice ? (isDark ? '#68d391' : '#276749') : (isDark ? '#fc8181' : '#c53030') }}>
                {q2Choice ? 'Yes — countable singular' : 'No — plural or uncountable'}
              </div>
            ) : null}
          </div>
        )}

        {/* tree hint */}
        {treeHint() && phase !== 'feedback' && (
          <div style={{ fontSize: 12, color: isDark ? '#90cdf4' : '#2b6cb0', marginTop: 4, fontStyle: 'italic' }}>
            {treeHint()}
          </div>
        )}
      </div>

      {/* article choice */}
      {(phase === 'choose' || phase === 'feedback') && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Choose the correct article for "{item.noun}":
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['a/an', 'the', 'zero'] as Article[]).map(a => (
              <button
                key={a}
                style={articleBtnStyle(a)}
                onClick={() => phase === 'choose' ? handleChoose(a) : undefined}
                disabled={phase === 'feedback'}
              >
                {a === 'zero' ? 'zero article' : `"${a}"`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* feedback */}
      {phase === 'feedback' && (
        <div style={{
          background: userArticle === item.correct ? goodBg : badBg,
          border: `1.5px solid ${userArticle === item.correct ? goodBorder : badBorder}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 13,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: userArticle === item.correct ? (isDark ? '#68d391' : '#276749') : (isDark ? '#fc8181' : '#c53030') }}>
            {userArticle === item.correct ? 'Correct!' : `Incorrect — correct answer: ${correctLabel(item.correct)}`}
          </div>
          <div style={{ color: textColor }}>{item.explanation}</div>
        </div>
      )}

      {/* next button */}
      {phase === 'feedback' && (
        <ControlRow>
          <Button
            label={idx + 1 < ITEMS.length ? 'Next noun phrase' : 'See results'}
            onClick={handleNext}
          />
        </ControlRow>
      )}
    </div>
  );
}
