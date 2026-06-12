import React from 'react';

/** A horizontal row that lays out sim controls consistently. */
export function ControlRow({children}: {children: React.ReactNode}): React.ReactElement {
  return <div className="vizctl__row">{children}</div>;
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}

/** Labeled range slider with its current value shown. */
export function Slider({label, min, max, step = 1, value, onChange}: SliderProps): React.ReactElement {
  return (
    <label className="vizctl">
      <span className="vizctl__label">{label}</span>
      <input
        className="vizctl__slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="vizctl__value">{value}</span>
    </label>
  );
}

/** Labeled checkbox toggle. */
export function Toggle({label, value, onChange}: {label: string; value: boolean; onChange: (v: boolean) => void}): React.ReactElement {
  return (
    <label className="vizctl vizctl--toggle">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="vizctl__label">{label}</span>
    </label>
  );
}

/** Action button (e.g. Reset / Step). */
export function Button({label, onClick}: {label: string; onClick: () => void}): React.ReactElement {
  return (
    <button type="button" className="vizctl__btn" onClick={onClick}>
      {label}
    </button>
  );
}
