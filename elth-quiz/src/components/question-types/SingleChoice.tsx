import { useState } from 'react';
import type { Question, UserAnswer } from '../../types';
import './Choice.css';

interface Props {
  question: Question;
  answer: UserAnswer | undefined;
  onSubmit: (ans: UserAnswer) => void;
  submitted: boolean;
}

export function SingleChoice({ question, answer, onSubmit, submitted }: Props) {
  const [selected, setSelected] = useState<number>(answer?.selectedSingle ?? -1);

  const handleSubmit = () => {
    if (selected < 0) return;
    const isCorrect = question.options![selected].correct;
    onSubmit({
      questionId: question.id,
      type: 'single',
      selectedSingle: selected,
      isCorrect,
      isSubmitted: true,
    });
  };

  return (
    <div className="choice-group">
      {question.options!.map((opt, i) => {
        let cls = 'choice-option';
        if (submitted) {
          if (opt.correct) cls += ' correct';
          else if (i === (answer?.selectedSingle ?? -1) && !opt.correct) cls += ' wrong';
          else cls += ' dimmed';
        } else if (i === selected) {
          cls += ' selected';
        }

        return (
          <label key={i} className={cls}>
            <input
              type="radio"
              name={`q${question.id}`}
              checked={i === selected}
              onChange={() => !submitted && setSelected(i)}
              disabled={submitted}
            />
            <span className="choice-marker">
              {submitted && opt.correct && '✓'}
              {submitted && !opt.correct && i === (answer?.selectedSingle ?? -1) && '✗'}
              {!submitted && i === selected && '◉'}
              {(!submitted || (!opt.correct && i !== (answer?.selectedSingle ?? -1))) && !submitted && i !== selected && '○'}
            </span>
            <span className="choice-text">{opt.text}</span>
          </label>
        );
      })}

      {!submitted && (
        <button
          className="btn-check"
          onClick={handleSubmit}
          disabled={selected < 0}
        >
          Verifică răspunsul
        </button>
      )}
    </div>
  );
}
