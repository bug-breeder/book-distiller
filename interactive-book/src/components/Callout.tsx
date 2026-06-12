import React from 'react';

type Variant = 'misconception' | 'application' | 'why';

const META: Record<Variant, {label: string; icon: string}> = {
  why: {label: 'Why it matters', icon: '◆'},
  misconception: {label: 'Common misconception', icon: '⚠'},
  application: {label: 'In the real world', icon: '◎'},
};

interface CalloutProps {
  variant: Variant;
  /** Prose to render (generator passes a string); falls back to children. */
  text?: string;
  children?: React.ReactNode;
}

/** A labeled, color-coded callout for the recurring lesson-note blocks. */
export default function Callout({variant, text, children}: CalloutProps): React.ReactElement {
  const meta = META[variant];
  return (
    <div className={`callout callout--${variant}`}>
      <div className="callout__label">
        <span className="callout__icon" aria-hidden="true">
          {meta.icon}
        </span>
        {meta.label}
      </div>
      <div className="callout__body">{text ? <p>{text}</p> : children}</div>
    </div>
  );
}
