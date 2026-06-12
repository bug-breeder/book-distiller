import React, {useState} from 'react';

interface CheckProps {
  /** The comprehension-check question. */
  question: string;
  /** The ideal answer, revealed on demand. */
  answer: string;
}

/**
 * "Check your understanding": shows a question that proves understanding, with
 * the ideal answer hidden behind a reveal so the learner attempts it first.
 */
export default function Check({question, answer}: CheckProps): React.ReactElement {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="check">
      <div className="check__label">Check your understanding</div>
      <div className="check__question">{question}</div>
      {revealed ? (
        <div className="check__answer">
          <div className="check__answer-label">Ideal answer</div>
          {answer}
        </div>
      ) : (
        <button type="button" className="check__reveal" onClick={() => setRevealed(true)}>
          Reveal answer
        </button>
      )}
    </div>
  );
}
