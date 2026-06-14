import { useState } from 'react';
import type { Question, UserAnswer } from '../../types';
import './TextBlanksQuestion.css';

interface Props {
  question: Question;
  answer: UserAnswer | undefined;
  onSubmit: (ans: UserAnswer) => void;
  submitted: boolean;
}

export function TextBlanksQuestion({ question, answer, onSubmit, submitted }: Props) {
  const [revealed, setRevealed] = useState(answer?.revealed ?? false);

  const handleReveal = () => {
    setRevealed(true);
    if (!submitted) {
      onSubmit({
        questionId: question.id,
        type: 'textblanks',
        revealed: true,
        isCorrect: true,
        isSubmitted: true,
      });
    }
  };

  const filledText = question.filledText ?? '';

  // Parse filledText: words followed by [✓] are the answers
  const segments = filledText.split(/(\[✓\])/);

  return (
    <div className="textblanks">
      <p className="textblanks-hint">
        Această întrebare necesită completarea spațiilor libere. Studiați enunțul și descoperiți răspunsul.
      </p>

      {revealed ? (
        <div className="textblanks-answer">
          <p className="textblanks-answer-label">Răspuns complet:</p>
          <div className="textblanks-text">
            {segments.map((seg, i) =>
              seg === '[✓]'
                ? <mark key={i} className="blanks-mark">✓</mark>
                : <span key={i}>{seg}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="textblanks-hidden">
          <p className="textblanks-text muted">
            {question.text}
          </p>
          <div className="textblanks-dots">• • •</div>
        </div>
      )}

      {!submitted && (
        <button className="btn-reveal" onClick={handleReveal}>
          👁 Arată răspunsul complet
        </button>
      )}
    </div>
  );
}
