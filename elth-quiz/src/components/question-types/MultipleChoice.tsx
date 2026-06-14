import { useState } from 'react';
import type { Question, UserAnswer } from '../../types';
import './Choice.css';

interface Props {
  question: Question;
  answer: UserAnswer | undefined;
  onSubmit: (ans: UserAnswer) => void;
  submitted: boolean;
}

export function MultipleChoice({ question, answer, onSubmit, submitted }: Props) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(answer?.selectedMultiple ?? [])
  );

  const toggle = (i: number) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleSubmit = () => {
    const correctIndices = new Set(
      question.options!.map((o, i) => o.correct ? i : -1).filter(i => i >= 0)
    );
    const sel = Array.from(selected);
    const isCorrect =
      sel.length === correctIndices.size &&
      sel.every(i => correctIndices.has(i));

    onSubmit({
      questionId: question.id,
      type: 'multiple',
      selectedMultiple: sel,
      isCorrect,
      isSubmitted: true,
    });
  };

  const submittedSelected = new Set(answer?.selectedMultiple ?? []);

  return (
    <div className="choice-group">
      <p className="choice-hint">Selectați toate variantele corecte:</p>
      {question.options!.map((opt, i) => {
        const isSelected = submitted ? submittedSelected.has(i) : selected.has(i);
        let cls = 'choice-option';
        if (submitted) {
          if (opt.correct) cls += ' correct';
          else if (isSelected && !opt.correct) cls += ' wrong';
          else cls += ' dimmed';
        } else if (isSelected) {
          cls += ' selected';
        }

        return (
          <label key={i} className={cls} onClick={() => toggle(i)}>
            <span className="choice-marker checkbox">
              {submitted && opt.correct && '✓'}
              {submitted && !opt.correct && isSelected && '✗'}
              {!submitted && isSelected && '☑'}
              {!submitted && !isSelected && '☐'}
            </span>
            <span className="choice-text">{opt.text}</span>
          </label>
        );
      })}

      {!submitted && (
        <button
          className="btn-check"
          onClick={handleSubmit}
          disabled={selected.size === 0}
        >
          Verifică răspunsul
        </button>
      )}
    </div>
  );
}
