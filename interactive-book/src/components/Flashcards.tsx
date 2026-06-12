import React, {useMemo, useState} from 'react';

export interface FlashcardItem {
  id: string;
  concept: string;
  question: string;
  answer: string;
}

interface FlashcardsProps {
  items: FlashcardItem[];
}

/**
 * Active-recall flashcard deck built from a chapter's review items. The learner
 * reads the question, attempts an answer, flips to check, and self-grades.
 * "Needs review" cards are requeued to the end so they resurface.
 */
export default function Flashcards({items}: FlashcardsProps): React.ReactElement {
  const [order, setOrder] = useState<number[]>(() => items.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<string>>(() => new Set());

  const current = items[order[pos]];
  const masteredCount = mastered.size;
  const progressPct = useMemo(
    () => (items.length === 0 ? 0 : Math.round((masteredCount / items.length) * 100)),
    [masteredCount, items.length],
  );

  if (items.length === 0) {
    return <p className="flashcards__empty">No review items for this chapter yet.</p>;
  }

  function advance(): void {
    setFlipped(false);
    setPos((p) => (p + 1) % order.length);
  }

  function grade(got: boolean): void {
    const next = new Set(mastered);
    if (got) {
      next.add(current.id);
    } else {
      next.delete(current.id);
      // Requeue this card to the end so it comes back around.
      setOrder((o) => {
        const copy = [...o];
        const [moved] = copy.splice(pos, 1);
        copy.push(moved);
        return copy;
      });
      setMastered(next);
      setFlipped(false);
      // Stay at the same index — the requeue shifted a new card into this slot
      // (unless we were at the end, in which case wrap).
      setPos((p) => (p >= order.length - 1 ? 0 : p));
      return;
    }
    setMastered(next);
    advance();
  }

  function reset(): void {
    setOrder(items.map((_, i) => i));
    setPos(0);
    setFlipped(false);
    setMastered(new Set());
  }

  return (
    <div className="flashcards">
      <div className="flashcards__bar">
        <span className="flashcards__count">
          Mastered {masteredCount}/{items.length}
        </span>
        <div className="flashcards__progress">
          <div className="flashcards__progress-fill" style={{width: `${progressPct}%`}} />
        </div>
        <button type="button" className="flashcards__reset" onClick={reset}>
          Reset
        </button>
      </div>

      <button
        type="button"
        className={`flashcard ${flipped ? 'flashcard--flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show question' : 'Show answer'}>
        <span className="flashcard__concept">{current.concept}</span>
        {flipped ? (
          <span className="flashcard__text flashcard__text--answer">{current.answer}</span>
        ) : (
          <span className="flashcard__text">{current.question}</span>
        )}
        <span className="flashcard__hint">{flipped ? 'Click to see question' : 'Click to flip'}</span>
      </button>

      <div className="flashcards__actions">
        {flipped ? (
          <>
            <button type="button" className="fc-btn fc-btn--review" onClick={() => grade(false)}>
              Needs review
            </button>
            <button type="button" className="fc-btn fc-btn--got" onClick={() => grade(true)}>
              Got it
            </button>
          </>
        ) : (
          <button type="button" className="fc-btn" onClick={() => setFlipped(true)}>
            Flip card
          </button>
        )}
      </div>
    </div>
  );
}
