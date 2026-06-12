// src/interactive/registry.ts
// Curated mapping of which interactive widget appears in which chapter, and after
// which concept. Concept matching is a case-insensitive substring on the concept
// name; if no concept matches, the widget is appended after the last concept.
//
// This is hand-authored (not AI at runtime) so the deterministic generator stays
// deterministic — adding a new interactive means registering it here.

export interface WidgetPlacement {
  /** Substring matched (case-insensitive) against a concept name to anchor the widget. */
  afterConcept: string;
  /** The MDX/JSX to insert. Components are registered globally in MDXComponents.tsx. */
  jsx: string;
}

type Registry = Record<string, Record<number, WidgetPlacement[]>>;

const REGISTRY: Registry = {
  'networks-book': {
    1: [
      {
        afterConcept: 'graph theory',
        jsx: '<NetworkGraph title="A network at a glance" caption="The same node-and-link idea behind every example in this chapter. Drag a node; hover to see a neighborhood." />',
      },
    ],
    2: [
      {
        afterConcept: 'connectivity',
        jsx: '<NetworkGraph title="Components, paths, and neighborhoods" caption="Drag nodes to confirm a graph is its connections, not its drawing. Hover a node to trace who it can reach in one step." />',
      },
    ],
    3: [
      {
        afterConcept: 'bridge',
        jsx: '<NetworkGraph title="Strong ties, weak ties, and bridges" caption="Dashed links are the weak-tie bridges between tightly-knit communities — the shortcuts that carry new information." />',
      },
    ],
    4: [
      {
        afterConcept: 'schelling',
        jsx: '<Schelling threshold={3} />',
      },
    ],
    5: [
      {
        afterConcept: 'balance',
        jsx: '<StructuralBalance />',
      },
    ],
  },
};

export function placementsFor(slug: string, chapter: number): WidgetPlacement[] {
  return REGISTRY[slug]?.[chapter] ?? [];
}
