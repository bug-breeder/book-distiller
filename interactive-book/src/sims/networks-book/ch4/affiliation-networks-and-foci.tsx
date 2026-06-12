import React, { useState } from 'react';
import type { SimProps, SimMeta } from '../../types';
import { ControlRow, Button } from '@site/src/widgets/VizControls';

export const meta: SimMeta = {
  title: 'Affiliation Networks and Foci',
  concept: 'Affiliation Networks and Foci',
  caption:
    'Click a focus to highlight everyone who shares it — that shared context is the seed of focal closure.',
  libs: [],
};

// ── Network data ─────────────────────────────────────────────────────────────
// Five people and three foci; each person belongs to 1–2 foci.

const PEOPLE = [
  { id: 'Anna',   label: 'Anna'   },
  { id: 'Bob',    label: 'Bob'    },
  { id: 'Claire', label: 'Claire' },
  { id: 'Daniel', label: 'Daniel' },
  { id: 'Esther', label: 'Esther' },
] as const;

const FOCI = [
  { id: 'LV',  label: 'Lit. Vol.' },
  { id: 'KC',  label: 'Karate'    },
  { id: 'CB',  label: 'Chess'     },
] as const;

type PersonId = typeof PEOPLE[number]['id'];
type FocusId  = typeof FOCI[number]['id'];

// Membership edges: [person, focus]
const MEMBERSHIPS: [PersonId, FocusId][] = [
  ['Anna',   'LV'],
  ['Anna',   'KC'],
  ['Daniel', 'KC'],
  ['Bob',    'LV'],
  ['Bob',    'CB'],
  ['Claire', 'CB'],
  ['Esther', 'KC'],
];

// Friendship edges formed by focal closure (revealed one at a time)
const FOCAL_EDGES: { u: PersonId; v: PersonId; focus: FocusId; label: string }[] = [
  { u: 'Anna',   v: 'Daniel', focus: 'KC', label: 'Anna & Daniel → both Karate' },
  { u: 'Anna',   v: 'Bob',    focus: 'LV', label: 'Anna & Bob → both Lit. Vol.' },
  { u: 'Bob',    v: 'Claire', focus: 'CB', label: 'Bob & Claire → both Chess'   },
  { u: 'Daniel', v: 'Esther', focus: 'KC', label: 'Daniel & Esther → both Karate' },
];

// ── Layout helpers ────────────────────────────────────────────────────────────
// People on the left, foci on the right (bipartite two-column layout).
// Positions in [0,1] fractions of (usable width, height).

const PEOPLE_X = 0.25;
const FOCI_X   = 0.75;

const peopleY: Record<PersonId, number> = {
  Anna:   0.15,
  Bob:    0.35,
  Claire: 0.55,
  Daniel: 0.70,
  Esther: 0.87,
};

const fociY: Record<FocusId, number> = {
  LV: 0.25,
  KC: 0.55,
  CB: 0.80,
};

// ── Main sim ─────────────────────────────────────────────────────────────────

export default function Sim({ width, isDark }: SimProps) {
  const [selectedFocus, setSelectedFocus] = useState<FocusId | null>(null);
  const [revealedEdges, setRevealedEdges] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const height = Math.min(Math.round(width * 0.75), 500);
  const PAD  = Math.max(20, width * 0.04);
  const W    = width - PAD * 2;
  const H    = height - PAD * 2;
  const R    = Math.max(14, Math.min(22, width * 0.032));
  const fR   = Math.max(18, Math.min(28, width * 0.038)); // focus nodes bigger
  const fontSize  = Math.max(9, Math.min(13, width * 0.022));

  // Colors
  const bg         = isDark ? '#1e1e2e' : '#f8f9fb';
  const textColor  = isDark ? '#e2e8f0' : '#1a202c';
  const personFill = isDark ? '#3b82f6' : '#2563eb';
  const focusFill  = isDark ? '#f97316' : '#ea580c';
  const edgeColor  = isDark ? '#4a5568' : '#a0aec0';
  const hiliteEdge = '#f6ad55';
  const newEdgeColor = '#d69e2e';
  const dimAlpha   = 0.25;

  function px(person: PersonId) {
    return { x: PAD + PEOPLE_X * W, y: PAD + peopleY[person] * H };
  }
  function fx(focus: FocusId) {
    return { x: PAD + FOCI_X * W, y: PAD + fociY[focus] * H };
  }

  // Which people belong to the selected focus?
  const selectedMembers = selectedFocus
    ? MEMBERSHIPS.filter(([, f]) => f === selectedFocus).map(([p]) => p)
    : null;

  // Revealed friendship edges
  const friendEdgesToShow = showAll
    ? FOCAL_EDGES
    : FOCAL_EDGES.slice(0, revealedEdges);

  const canRevealMore = !showAll && revealedEdges < FOCAL_EDGES.length;

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        background: bg,
        borderRadius: 8,
        padding: 8,
        userSelect: 'none',
        color: textColor,
      }}
    >
      <ControlRow>
        <Button
          label={canRevealMore ? `Reveal focal closure (${revealedEdges}/${FOCAL_EDGES.length})` : 'All friendships shown'}
          onClick={() => {
            if (canRevealMore) setRevealedEdges(n => n + 1);
          }}
        />
        <Button
          label="Reset"
          onClick={() => {
            setRevealedEdges(0);
            setShowAll(false);
            setSelectedFocus(null);
          }}
        />
      </ControlRow>

      <svg
        width={width}
        height={height}
        style={{ display: 'block', marginTop: 4 }}
        aria-label="Affiliation network bipartite diagram"
      >
        {/* Membership edges (person ↔ focus) */}
        {MEMBERSHIPS.map(([person, focus]) => {
          const pp = px(person);
          const fp = fx(focus);
          const isHighlighted =
            selectedFocus === focus ||
            (selectedFocus !== null && MEMBERSHIPS.some(([p2, f2]) => f2 === selectedFocus && p2 === person));
          const opacity =
            selectedFocus === null
              ? 0.65
              : isHighlighted
              ? 1.0
              : dimAlpha;
          return (
            <line
              key={`m-${person}-${focus}`}
              x1={pp.x} y1={pp.y}
              x2={fp.x} y2={fp.y}
              stroke={isHighlighted ? hiliteEdge : edgeColor}
              strokeWidth={isHighlighted ? 2.5 : 1.8}
              opacity={opacity}
            />
          );
        })}

        {/* Focal-closure friendship edges */}
        {friendEdgesToShow.map(({ u, v, label }) => {
          const pu = px(u);
          const pv = px(v);
          return (
            <g key={`f-${u}-${v}`}>
              <line
                x1={pu.x} y1={pu.y}
                x2={pv.x} y2={pv.y}
                stroke={newEdgeColor}
                strokeWidth={2.5}
                strokeDasharray="none"
                opacity={0.9}
              />
              {/* midpoint label */}
              <text
                x={(pu.x + pv.x) / 2 - R - 4}
                y={(pu.y + pv.y) / 2}
                fontSize={Math.max(8, fontSize - 2)}
                fill={newEdgeColor}
                textAnchor="end"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none' }}
              >
                ✓ {label}
              </text>
            </g>
          );
        })}

        {/* Focus nodes (right column) */}
        {FOCI.map(({ id, label }) => {
          const p = fx(id);
          const isSelected = selectedFocus === id;
          const highlighted = selectedFocus === null || isSelected;
          return (
            <g
              key={id}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedFocus(prev => (prev === id ? null : id))}
            >
              <rect
                x={p.x - fR}
                y={p.y - fR * 0.6}
                width={fR * 2}
                height={fR * 1.2}
                rx={6}
                fill={focusFill}
                stroke={isSelected ? '#fff' : 'transparent'}
                strokeWidth={2}
                opacity={highlighted ? 1 : dimAlpha}
              />
              <text
                x={p.x}
                y={p.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill="#fff"
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Person nodes (left column) */}
        {PEOPLE.map(({ id, label }) => {
          const p = px(id);
          const isHighlighted = selectedMembers ? selectedMembers.includes(id) : true;
          return (
            <g key={id}>
              <circle
                cx={p.x} cy={p.y} r={R}
                fill={personFill}
                stroke={isDark ? '#1e1e2e' : '#fff'}
                strokeWidth={2}
                opacity={isHighlighted ? 1.0 : dimAlpha}
              />
              <text
                x={p.x}
                y={p.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill="#fff"
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Column labels */}
        <text
          x={PAD + PEOPLE_X * W}
          y={PAD * 0.6}
          textAnchor="middle"
          fontSize={fontSize}
          fill={textColor}
          opacity={0.6}
        >
          People
        </text>
        <text
          x={PAD + FOCI_X * W}
          y={PAD * 0.6}
          textAnchor="middle"
          fontSize={fontSize}
          fill={textColor}
          opacity={0.6}
        >
          Foci
        </text>
      </svg>

      {/* Instruction / status */}
      <div style={{ padding: '4px 4px 2px', fontSize: 12, color: textColor, opacity: 0.85 }}>
        {selectedFocus === null
          ? 'Click a focus to see who shares it. Use "Reveal focal closure" to add friendships that emerge.'
          : `Highlighted: members of ${FOCI.find(f => f.id === selectedFocus)?.label ?? selectedFocus}. They are primed for focal closure.`}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          padding: '4px 4px 0',
          flexWrap: 'wrap',
          alignItems: 'center',
          fontSize: 11,
          color: textColor,
        }}
      >
        <LegendDot color={personFill} label="Person" />
        <LegendRect color={focusFill} label="Focus (click to highlight)" />
        <LegendLine color={edgeColor} dash={false} label="Membership" />
        <LegendLine color={newEdgeColor} dash={false} label="Focal closure (new friendship)" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width={14} height={14} style={{ flexShrink: 0 }}>
        <circle cx={7} cy={7} r={6} fill={color} />
      </svg>
      {label}
    </span>
  );
}

function LegendRect({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width={22} height={14} style={{ flexShrink: 0 }}>
        <rect x={1} y={2} width={20} height={10} rx={3} fill={color} />
      </svg>
      {label}
    </span>
  );
}

function LegendLine({ color, dash, label }: { color: string; dash: boolean; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width={28} height={8} style={{ flexShrink: 0 }}>
        <line
          x1={2} y1={4} x2={26} y2={4}
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={dash ? '5 4' : undefined}
        />
      </svg>
      {label}
    </span>
  );
}
