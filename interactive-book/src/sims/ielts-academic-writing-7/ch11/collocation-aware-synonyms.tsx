import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Collocation Synonym Picker',
  concept: 'Collocation Aware Synonyms',
  caption:
    'Choose a frame, then tap a synonym to see whether it collocates naturally. Notice how thesaurus alternatives split into safe and unsafe.',
  libs: [],
};

// ── data ────────────────────────────────────────────────────────────────────
// All collocational data comes directly from the chapter text.

type Verdict = 'natural' | 'borderline' | 'unnatural';

interface WordChoice {
  word: string;
  verdict: Verdict;
  reason: string;
}

interface Frame {
  label: string;          // displayed as "__ rain" etc.
  prefix: string;         // text before the blank
  suffix: string;         // text after the blank
  choices: WordChoice[];
  teachingPoint: string;  // bottom-of-card insight from the chapter
}

const FRAMES: Frame[] = [
  {
    label: '___ rain',
    prefix: '',
    suffix: ' rain',
    teachingPoint:
      '"Heavy" (Germanic origin) partnered with rain and traffic; "strong" (Germanic but different semantic cluster) partnered with wind, argument, and position. This is convention, not logic.',
    choices: [
      { word: 'heavy', verdict: 'natural',   reason: '"Heavy rain" is the standard English collocation.' },
      { word: 'strong', verdict: 'unnatural', reason: '"Strong" collocates with wind and arguments — not rain. This is a common L1-Vietnamese/Chinese transfer error.' },
      { word: 'severe', verdict: 'natural',   reason: '"Severe rain" is acceptable, though "heavy rain" is more common.' },
      { word: 'big',    verdict: 'unnatural', reason: '"Big rain" is not a conventional English collocation.' },
    ],
  },
  {
    label: '___ wind',
    prefix: '',
    suffix: ' wind',
    teachingPoint:
      '"Strong" goes with wind, argument, and position. "Heavy" goes with rain and traffic. You cannot predict this from the meaning of the adjective — it must be learned as a fixed pair.',
    choices: [
      { word: 'strong', verdict: 'natural',   reason: '"Strong wind" is the standard collocation.' },
      { word: 'heavy',  verdict: 'unnatural', reason: '"Heavy wind" swaps the conventional adjective. "Heavy" belongs with rain, not wind.' },
      { word: 'fierce', verdict: 'natural',   reason: '"Fierce wind" is natural and precise.' },
      { word: 'big',    verdict: 'unnatural', reason: '"Big wind" is not a conventional pairing in formal English.' },
    ],
  },
  {
    label: 'a(n) ___ in crime',
    prefix: 'a(n) ',
    suffix: ' in crime',
    teachingPoint:
      'From the chapter worked example: "rise" and "surge" are safe; "escalation" is acceptable; "augmentation" is unsafe because it collocates with breast augmentation / army augmentation, not crime statistics; "proliferation" expects countable nouns like weapons, not an uncountable trend.',
    choices: [
      { word: 'rise',        verdict: 'natural',    reason: '"A rise in crime" — natural and precise.' },
      { word: 'surge',       verdict: 'natural',    reason: '"A surge in crime" — natural, implies sudden increase.' },
      { word: 'escalation',  verdict: 'borderline', reason: '"An escalation in crime" — acceptable, slightly formal.' },
      { word: 'augmentation',verdict: 'unnatural',  reason: '"Augmentation" collocates with breast augmentation / army augmentation — not crime statistics. Using it exposes a collocation gap.' },
      { word: 'proliferation',verdict: 'borderline',reason: '"Proliferation" typically expects countable nouns (weapons, regulations). A crime rate is uncountable, making this a borderline choice.' },
    ],
  },
  {
    label: 'make / do a mistake',
    prefix: '',
    suffix: ' a mistake',
    teachingPoint:
      '"Make a mistake" is the standard English collocation. "Do a mistake" is a frequent error among L1-Vietnamese and L1-Chinese learners who transfer the logic of their first language to English.',
    choices: [
      { word: 'make', verdict: 'natural',   reason: '"Make a mistake" — the only standard English collocation here.' },
      { word: 'do',   verdict: 'unnatural', reason: '"Do a mistake" is not standard. "Do" collocates with activities (do homework, do exercise), not mistakes.' },
      { word: 'commit', verdict: 'natural', reason: '"Commit a mistake" — formal but fully natural, especially in written English.' },
    ],
  },
];

// ── colour helpers ───────────────────────────────────────────────────────────

function verdictColors(verdict: Verdict, isDark: boolean) {
  if (verdict === 'natural') {
    return {
      bg:     isDark ? '#22543d' : '#c6f6d5',
      border: isDark ? '#48bb78' : '#38a169',
      text:   isDark ? '#9ae6b4' : '#276749',
      icon:   '✓',
    };
  }
  if (verdict === 'borderline') {
    return {
      bg:     isDark ? '#7b4f00' : '#fefcbf',
      border: isDark ? '#ecc94b' : '#d69e2e',
      text:   isDark ? '#f6e05e' : '#744210',
      icon:   '~',
    };
  }
  // unnatural
  return {
    bg:     isDark ? '#742a2a' : '#fed7d7',
    border: isDark ? '#fc8181' : '#e53e3e',
    text:   isDark ? '#feb2b2' : '#9b2c2c',
    icon:   '✗',
  };
}

// ── component ────────────────────────────────────────────────────────────────

export default function Sim({ width, isDark }: SimProps) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const frame = FRAMES[frameIdx];
  const chosen = frame.choices.find(c => c.word === selected) ?? null;

  const bg        = isDark ? '#1e1e2e' : '#f8f9fb';
  const cardBg    = isDark ? '#2d3748' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const mutedText = isDark ? '#a0aec0' : '#718096';
  const border    = isDark ? '#4a5568' : '#e2e8f0';
  const btnBase   = isDark ? '#4a5568' : '#e2e8f0';
  const btnHover  = isDark ? '#718096' : '#cbd5e0';

  const maxW = Math.min(width - 24, 560);

  function handleFrameChange(delta: number) {
    setFrameIdx(idx => (idx + delta + FRAMES.length) % FRAMES.length);
    setSelected(null);
  }

  function handleReset() {
    setSelected(null);
  }

  const verdictInfo = chosen ? verdictColors(chosen.verdict, isDark) : null;

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        background: bg,
        borderRadius: 10,
        padding: 16,
        color: textColor,
        userSelect: 'none',
        maxWidth: maxW,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12, fontSize: 13, color: mutedText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Collocation Sandbox — Frame {frameIdx + 1} of {FRAMES.length}
      </div>

      {/* Frame navigation */}
      <ControlRow>
        <Button label="← Prev" onClick={() => handleFrameChange(-1)} />
        <Button label="Next →" onClick={() => handleFrameChange(1)} />
        <Button label="Reset" onClick={handleReset} />
      </ControlRow>

      {/* Frame display */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '16px 20px',
          marginTop: 12,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, color: mutedText, marginBottom: 6 }}>
          Fill in the blank with a colocationally correct word:
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.02em' }}>
          {frame.prefix}
          <span
            style={{
              display: 'inline-block',
              minWidth: 110,
              borderBottom: `2px solid ${chosen ? verdictColors(chosen.verdict, isDark).border : (isDark ? '#718096' : '#a0aec0')}`,
              padding: '0 8px',
              color: chosen ? verdictColors(chosen.verdict, isDark).text : (isDark ? '#718096' : '#a0aec0'),
              fontStyle: chosen ? 'normal' : 'italic',
              fontSize: chosen ? 24 : 20,
              transition: 'color 0.2s',
            }}
          >
            {chosen ? chosen.word : '___'}
          </span>
          {frame.suffix}
        </div>
      </div>

      {/* Word choices */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: mutedText, marginBottom: 8 }}>
          Thesaurus options — tap one:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {frame.choices.map(c => {
            const isSelected = selected === c.word;
            const vc = verdictColors(c.verdict, isDark);
            return (
              <button
                key={c.word}
                type="button"
                onClick={() => setSelected(c.word)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `2px solid ${isSelected ? vc.border : border}`,
                  background: isSelected ? vc.bg : btnBase,
                  color: isSelected ? vc.text : textColor,
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = btnHover;
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = btnBase;
                  }
                }}
              >
                {c.word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verdict card */}
      {chosen && verdictInfo && (
        <div
          style={{
            background: verdictInfo.bg,
            border: `2px solid ${verdictInfo.border}`,
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 12,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: verdictInfo.text }}>{verdictInfo.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: verdictInfo.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {chosen.verdict === 'natural' ? 'Natural collocation' : chosen.verdict === 'borderline' ? 'Borderline — use with care' : 'Unnatural collocation'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: verdictInfo.text, lineHeight: 1.5 }}>
            {chosen.reason}
          </div>
        </div>
      )}

      {/* Teaching point */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: mutedText,
          lineHeight: 1.6,
        }}
      >
        <span style={{ fontWeight: 700, color: isDark ? '#90cdf4' : '#2b6cb0' }}>Why? </span>
        {frame.teachingPoint}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          marginTop: 14,
          flexWrap: 'wrap',
          fontSize: 11,
          color: mutedText,
          borderTop: `1px solid ${border}`,
          paddingTop: 10,
        }}
      >
        {(['natural', 'borderline', 'unnatural'] as Verdict[]).map(v => {
          const vc = verdictColors(v, isDark);
          return (
            <span key={v} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: vc.border, opacity: 0.85 }} />
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
