import React, { useEffect, useState } from 'react';
import type { ReviewCard } from '../lib/practiceTypes';
import { loadDeck, saveDeck } from '../lib/practiceStore';
import { dueCards, applyResult } from '../lib/srs';

const today = (): string => new Date().toISOString().slice(0, 10);

export default function ReviewDrills({ slug }: { slug: string }): React.ReactElement {
  const [deck, setDeck] = useState<ReviewCard[]>([]);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setDeck(loadDeck(window.localStorage, slug));
  }, [slug]);

  const due = dueCards(deck, today());
  const card = due[0];

  function grade(result: 'pass' | 'fail'): void {
    if (!card || typeof window === 'undefined') return;
    const next = deck.map((c) => (c.id === card.id ? applyResult(c, result, today()) : c));
    saveDeck(window.localStorage, slug, next);
    setDeck(next);
    setFlipped(false);
  }

  if (deck.length === 0) return <p>No review drills yet. Cards are created from the recurring errors in your scored essays.</p>;
  if (!card) return <p>No drills due today. {deck.length} card(s) scheduled for later.</p>;

  return (
    <div style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, padding: 16, maxWidth: 560 }}>
      <p style={{ fontSize: '0.85em', opacity: 0.7 }}>{due.length} due · {deck.length} total</p>
      <p><strong>{card.question}</strong></p>
      {flipped ? (
        <>
          <p style={{ background: 'var(--ifm-color-emphasis-100)', padding: 8, borderRadius: 6 }}>{card.answer}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => grade('fail')}>Still hard</button>
            <button onClick={() => grade('pass')}>Got it</button>
          </div>
        </>
      ) : (
        <button onClick={() => setFlipped(true)}>Show guidance</button>
      )}
    </div>
  );
}
