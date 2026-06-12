import React from 'react';

/**
 * Collapsed-by-default disclosure holding a concept's intuition + worked example.
 * Generated MDX wraps the Dig-deeper markdown as children:
 *   <DigDeeper>\n\n ...markdown... \n\n</DigDeeper>
 */
export default function DigDeeper({
  title = 'Dig deeper',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="digDeeper">
      <summary className="digDeeper__summary">{title}</summary>
      <div className="digDeeper__body">{children}</div>
    </details>
  );
}
