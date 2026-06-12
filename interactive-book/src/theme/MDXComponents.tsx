import MDXComponents from '@theme-original/MDXComponents';
import GraphFigure from '@site/src/widgets/GraphFigure';
import SimHost from '@site/src/widgets/SimHost';
import Flashcards from '@site/src/components/Flashcards';
import Check from '@site/src/components/Check';
import Callout from '@site/src/components/Callout';
import BookFigure from '@site/src/components/BookFigure';

// Registered globally so generated MDX can use <SimHost/>, <GraphFigure/>,
// <Flashcards/>, etc. without per-file imports. Per-concept sims are imported
// directly in each chapter's MDX and rendered through <SimHost>.
export default {
  ...MDXComponents,
  GraphFigure,
  SimHost,
  Flashcards,
  Check,
  Callout,
  BookFigure,
};
