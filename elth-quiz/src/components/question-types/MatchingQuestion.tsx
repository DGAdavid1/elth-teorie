import { useState, useMemo } from 'react';
import type { Question, UserAnswer } from '../../types';
import './MatchingQuestion.css';

interface Props {
  question: Question;
  answer: UserAnswer | undefined;
  onSubmit: (ans: UserAnswer) => void;
  submitted: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchingQuestion({ question, answer, onSubmit, submitted }: Props) {
  const pairs = question.pairs!;
  const shuffledRights = useMemo(() => shuffle(pairs.map(p => p.right)), []);

  const [userMap, setUserMap] = useState<Record<number, string>>(
    answer?.matchingMap ?? {}
  );

  const handleSelect = (leftIdx: number, right: string) => {
    if (submitted) return;
    setUserMap(prev => ({ ...prev, [leftIdx]: right }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    pairs.forEach((p, i) => {
      if (userMap[i] === p.right) correctCount++;
    });
    const isCorrect = correctCount === pairs.length;

    onSubmit({
      questionId: question.id,
      type: 'matching',
      matchingMap: userMap,
      isCorrect,
      isSubmitted: true,
    });
  };

  const submittedMap = answer?.matchingMap ?? {};
  const displayMap = submitted ? submittedMap : userMap;

  const allSelected = pairs.every((_, i) => displayMap[i] !== undefined);

  return (
    <div className="matching">
      <p className="matching-hint">Asociați fiecare element din coloana stângă cu cel corespunzător din dreapta:</p>

      <div className="matching-pairs">
        {pairs.map((pair, i) => {
          const selected = displayMap[i];
          const isCorrectPair = submitted && selected === pair.right;
          const isWrongPair = submitted && selected !== undefined && selected !== pair.right;

          return (
            <div key={i} className={`matching-row ${isCorrectPair ? 'correct' : ''} ${isWrongPair ? 'wrong' : ''}`}>
              <div className="matching-left">{pair.left}</div>
              <div className="matching-arrow">→</div>
              <div className="matching-right-selector">
                {submitted ? (
                  <div className="matching-result">
                    <span className={`match-value ${isCorrectPair ? 'correct' : 'wrong'}`}>
                      {selected || '—'}
                    </span>
                    {isWrongPair && (
                      <span className="match-correct-value">✓ {pair.right}</span>
                    )}
                  </div>
                ) : (
                  <select
                    value={selected ?? ''}
                    onChange={e => handleSelect(i, e.target.value)}
                    className="matching-select"
                  >
                    <option value="">— alege —</option>
                    {shuffledRights.map((r, j) => (
                      <option key={j} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {submitted && (
        <div className="matching-score">
          Corect: {pairs.filter((p, i) => submittedMap[i] === p.right).length} / {pairs.length}
        </div>
      )}

      {!submitted && (
        <button
          className="btn-check"
          onClick={handleSubmit}
          disabled={!allSelected}
        >
          Verifică asocierile
        </button>
      )}
    </div>
  );
}
