import MDXComponents from '@theme-original/MDXComponents';
import NetworkGraph from '@site/src/widgets/NetworkGraph';
import GraphFigure from '@site/src/widgets/GraphFigure';
import SimHost from '@site/src/widgets/SimHost';
import Schelling from '@site/src/widgets/Schelling';
import StructuralBalance from '@site/src/widgets/StructuralBalance';
import Flashcards from '@site/src/components/Flashcards';
import Check from '@site/src/components/Check';
import Callout from '@site/src/components/Callout';
import BookFigure from '@site/src/components/BookFigure';

// Registered globally so generated MDX can use <Schelling/>, <Flashcards/>, etc.
// without per-file imports.
export default {
  ...MDXComponents,
  NetworkGraph,
  GraphFigure,
  SimHost,
  Schelling,
  StructuralBalance,
  Flashcards,
  Check,
  Callout,
  BookFigure,
};
