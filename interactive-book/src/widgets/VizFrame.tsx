import React from 'react';

interface VizFrameProps {
  title: string;
  /** One-line description of what to do / what to look for. */
  caption?: string;
  /** Optional controls row rendered in the header (sliders, buttons). */
  controls?: React.ReactNode;
  children: React.ReactNode;
  /** Small grounding note under the visualization (e.g. "Illustrative network"). */
  note?: string;
}

/**
 * Shared chrome for every interactive visualization: titled card, optional
 * controls row, body, and a grounding note. Keeps all widgets visually consistent.
 */
export default function VizFrame({title, caption, controls, children, note}: VizFrameProps): React.ReactElement {
  return (
    <figure className="viz">
      <figcaption className="viz__head">
        <span className="viz__title">{title}</span>
        {caption ? <span className="viz__caption">{caption}</span> : null}
      </figcaption>
      {controls ? <div className="viz__controls">{controls}</div> : null}
      <div className="viz__body">{children}</div>
      {note ? <p className="viz__note">{note}</p> : null}
    </figure>
  );
}
