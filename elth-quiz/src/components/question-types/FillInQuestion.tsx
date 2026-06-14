import { useState } from 'react';
import type { Question, UserAnswer } from '../../types';
import './FillInQuestion.css';

interface Props {
  question: Question;
  answer: UserAnswer | undefined;
  onSubmit: (ans: UserAnswer) => void;
  submitted: boolean;
}

function normalize(s: string) {
  return s.trim().replace(',', '.').replace(/\s+/g, '');
}

export function FillInQuestion({ question, answer, onSubmit, submitted }: Props) {
  const [input, setInput] = useState(answer?.fillinText ?? '');

  const handleSubmit = () => {
    const correct = question.answer!;
    const isCorrect = normalize(input) === normalize(correct);
    onSubmit({
      questionId: question.id,
      type: 'fillin',
      fillinText: input,
      isCorrect,
      isSubmitted: true,
    });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted) handleSubmit();
  };

  const isCorrect = answer?.isCorrect;
  const showAnswer = submitted;

  return (
    <div className="fillin">
      <label className="fillin-label">
        Răspuns numeric:
        <input
          type="text"
          className={`fillin-input ${showAnswer ? (isCorrect ? 'correct' : 'wrong') : ''}`}
          value={input}
          onChange={e => !submitted && setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={submitted}
          placeholder="Introduceți valoarea..."
          autoFocus
        />
      </label>

      {showAnswer && (
        <div className="fillin-answer">
          <span className="fillin-answer-label">Răspuns corect:</span>
          <span className="fillin-answer-value">{question.answer}</span>
        </div>
      )}

      {!submitted && (
        <button
          className="btn-check"
          onClick={handleSubmit}
          disabled={!input.trim()}
        >
          Verifică răspunsul
        </button>
      )}
    </div>
  );
}
