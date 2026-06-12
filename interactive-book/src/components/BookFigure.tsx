import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

interface BookFigureProps {
  /** Site-root-relative path to the extracted PNG, e.g. "/figures/networks-book/figure-3-13.png". */
  src: string;
  /** Figure label, e.g. "Figure 3.13". */
  label?: string;
  /** What the figure shows / what to look for. */
  caption?: string;
  /** Source attribution (book title). */
  source?: string;
}

/**
 * A REAL figure extracted from the source book (large/real networks, charts, maps,
 * photos) that we can't faithfully recreate as a <GraphFigure>. Rendered on a light
 * card so the white PDF crop reads cleanly in both light and dark themes.
 */
export default function BookFigure({src, label, caption, source}: BookFigureProps): React.ReactElement {
  const url = useBaseUrl(src);
  const alt = [label, caption].filter(Boolean).join(' — ') || 'Book figure';
  return (
    <figure className="bookfig">
      <div className="bookfig__frame">
        <img className="bookfig__img" src={url} alt={alt} loading="lazy" />
      </div>
      {label || caption ? (
        <figcaption className="bookfig__cap">
          {label ? <strong className="bookfig__label">{label}</strong> : null}
          {label && caption ? ' — ' : null}
          {caption}
          {source ? <span className="bookfig__src"> · {source}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
