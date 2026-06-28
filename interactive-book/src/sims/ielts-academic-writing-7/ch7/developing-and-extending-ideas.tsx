import React, { useState, useCallback } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Idea Extension Chain',
  concept: 'Developing And Extending Ideas',
  caption:
    'Step through the domino chain — see where Band 6 stops and where Band 7 keeps going.',
  libs: [],
};

// ─── Chain data (grounded in lesson note C2 worked example) ──────────────────

interface ChainStep {
  label: string;
  tag: string;
  sentence: string;
  /** true = the extra steps Band 7 adds beyond the Band 6 stopping point */
  band7Only: boolean;
  /** Tooltip / hint shown beneath the sentence */
  hint: string;
}

const CHAIN: ChainStep[] = [
  {
    label: 'Claim',
    tag: 'C',
    sentence:
      'Social media has made political misinformation easier to spread.',
    band7Only: false,
    hint: 'One controlling idea — the topic sentence that every subsequent step must serve.',
  },
  {
    label: 'Mechanism',
    tag: 'M',
    sentence:
      'Algorithms on platforms like Facebook and YouTube are designed to maximise engagement, and emotionally charged or sensational content tends to generate more clicks and shares than factual reporting.',
    band7Only: false,
    hint:
      'Explains the "why/how" — Band 6 writers typically stop here, leaving the paragraph underdeveloped.',
  },
  {
    label: 'Consequence',
    tag: 'CO',
    sentence:
      'As a result, false stories can accumulate millions of views within hours before fact-checkers have time to respond.',
    band7Only: true,
    hint:
      '"So what?" — the logical child of the Mechanism. Band 7 adds this step.',
  },
  {
    label: 'Significance',
    tag: 'S',
    sentence:
      'This rapid amplification means that by the time a correction is published, a large proportion of the audience has already formed an opinion based on the false version — making misinformation correction far less effective than prevention.',
    band7Only: true,
    hint:
      '"Why does that matter?" — the deepest domino, tying the reasoning to a wider implication.',
  },
];

// ─── Colours ─────────────────────────────────────────────────────────────────

const BAND6_COLOUR = '#e07b39';
const BAND7_COLOUR = '#16a34a';
const DIM_COLOUR = 'var(--ifm-color-emphasis-400)';
const LABEL_BG_ACTIVE = 'var(--ifm-color-primary)';

// ─── Component ───────────────────────────────────────────────────────────────

export default function Sim({ width }: SimProps) {
  // visibleCount: how many steps are currently shown (0 = none, 4 = all)
  const [visibleCount, setVisibleCount] = useState<number>(0);

  const canAdvance = visibleCount < CHAIN.length;
  const canReset = visibleCount > 0;

  const advance = useCallback(() => {
    setVisibleCount((n) => Math.min(n + 1, CHAIN.length));
  }, []);

  const reset = useCallback(() => {
    setVisibleCount(0);
  }, []);

  const narrow = width < 480;

  // Band 6 stopping point: after step index 1 (Mechanism)
  const BAND6_STOP = 1;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <LegendDot colour={BAND6_COLOUR} label="Band 6 stops here" />
          <LegendDot colour={BAND7_COLOUR} label="Band 7 continues" />
        </div>
        <ControlRow>
          <Button label="Next step" onClick={advance} />
          <Button label="Reset" onClick={reset} />
        </ControlRow>
      </div>

      {/* Step counter */}
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 13,
          color: 'var(--ifm-color-emphasis-600)',
        }}
      >
        {visibleCount === 0
          ? 'Press "Next step" to reveal the chain one domino at a time.'
          : visibleCount < CHAIN.length
          ? `Step ${visibleCount} of ${CHAIN.length} revealed — keep going to reach Band 7.`
          : 'All four dominoes revealed — this is a fully extended Band 7 paragraph.'}
      </p>

      {/* Chain */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {CHAIN.map((step, i) => {
          const visible = i < visibleCount;
          const isBand6Stop = i === BAND6_STOP;
          const accentColour = step.band7Only ? BAND7_COLOUR : BAND6_COLOUR;

          return (
            <React.Fragment key={step.tag}>
              {/* Domino card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  opacity: visible ? 1 : 0.25,
                  transition: 'opacity 0.35s ease',
                  padding: '14px 0',
                }}
              >
                {/* Tag badge */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: narrow ? 34 : 40,
                      height: narrow ? 34 : 40,
                      borderRadius: '50%',
                      background: visible ? accentColour : DIM_COLOUR,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: narrow ? 11 : 12,
                      flexShrink: 0,
                      transition: 'background 0.35s ease',
                      letterSpacing: '0.04em',
                    }}
                    aria-label={step.label}
                  >
                    {step.tag}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: narrow ? 12 : 13,
                        color: visible ? accentColour : DIM_COLOUR,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        transition: 'color 0.35s ease',
                      }}
                    >
                      {step.label}
                    </span>
                    {step.band7Only && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: visible ? BAND7_COLOUR : DIM_COLOUR,
                          color: '#fff',
                          borderRadius: 10,
                          padding: '1px 7px',
                          letterSpacing: '0.06em',
                          transition: 'background 0.35s ease',
                        }}
                      >
                        Band 7+
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: narrow ? 13 : 14,
                      lineHeight: 1.65,
                      color: visible
                        ? 'var(--ifm-font-color-base)'
                        : 'var(--ifm-color-emphasis-400)',
                      transition: 'color 0.35s ease',
                    }}
                  >
                    {step.sentence}
                  </p>

                  {visible && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: 'var(--ifm-color-emphasis-600)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                      }}
                    >
                      {step.hint}
                    </p>
                  )}
                </div>
              </div>

              {/* Band 6 stop marker — shown after the Mechanism step */}
              {isBand6Stop && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    margin: '4px 0',
                    opacity: visibleCount > BAND6_STOP ? 1 : 0.3,
                    transition: 'opacity 0.35s ease',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: BAND6_COLOUR,
                      borderRadius: 1,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: BAND6_COLOUR,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Band 6 stops here
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: BAND6_COLOUR,
                      borderRadius: 1,
                    }}
                  />
                </div>
              )}

              {/* Downward arrow connector between steps (not after last) */}
              {i < CHAIN.length - 1 && !isBand6Stop && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    paddingLeft: narrow ? 17 : 20,
                    opacity: i < visibleCount - 1 ? 0.6 : 0.15,
                    transition: 'opacity 0.35s ease',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      d="M10 2 L10 14 M5 10 L10 15 L15 10"
                      stroke="var(--ifm-color-emphasis-500)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Summary callout */}
      {visibleCount === CHAIN.length && (
        <div
          style={{
            marginTop: 20,
            padding: '14px 18px',
            borderRadius: 8,
            border: `1px solid ${BAND7_COLOUR}`,
            background: 'rgba(22, 163, 74, 0.08)',
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontWeight: 700,
              fontSize: 13,
              color: BAND7_COLOUR,
            }}
          >
            Band 7 extension complete
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ifm-font-color-base)', lineHeight: 1.55 }}>
            Four dominoes fell: Claim → Mechanism → Consequence → Significance. Each sentence
            is a logical child of the one before it — not a new claim alongside it.
            The practical test: after your Explain sentence, ask "so what?" If you can write a
            meaningful answer, write it.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function LegendDot({ colour, label }: { colour: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: colour,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-700)' }}>{label}</span>
    </div>
  );
}
