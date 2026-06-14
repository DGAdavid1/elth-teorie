import type { Question, UserAnswer } from '../types';
import './Results.css';

interface Props {
  questions: Question[];
  answers: Record<number, UserAnswer>;
  score: number;
  onRestart: () => void;
  onGoTo: (idx: number) => void;
}

const TYPE_LABELS: Record<string, string> = {
  single: 'Alegere unică',
  multiple: 'Alegere multiplă',
  matching: 'Asociere',
  fillin: 'Completare',
  textblanks: 'Completare text',
};

export function Results({ questions, answers, score, onRestart, onGoTo }: Props) {
  const answered = Object.values(answers).filter(a => a.isSubmitted);
  const total = questions.length;
  const pct = total > 0 ? Math.round(score / total * 100) : 0;

  const grade = pct >= 90 ? 'Excelent!' : pct >= 70 ? 'Bine!' : pct >= 50 ? 'Acceptabil' : 'Mai încearcă!';
  const gradeColor = pct >= 90 ? 'green' : pct >= 70 ? 'blue' : pct >= 50 ? 'yellow' : 'red';

  const wrong = questions.filter(q => {
    const a = answers[q.id];
    return a?.isSubmitted && !a.isCorrect;
  });

  const skipped = questions.filter(q => !answers[q.id]?.isSubmitted);

  return (
    <div className="results-screen">
      <div className="results-hero">
        <div className={`results-score ${gradeColor}`}>
          <div className="results-pct">{pct}%</div>
          <div className="results-grade">{grade}</div>
        </div>

        <div className="results-stats">
          <div className="stat">
            <span className="stat-num green">{score}</span>
            <span className="stat-label">Corecte</span>
          </div>
          <div className="stat">
            <span className="stat-num red">{wrong.length}</span>
            <span className="stat-label">Greșite</span>
          </div>
          <div className="stat">
            <span className="stat-num muted">{skipped.length}</span>
            <span className="stat-label">Sărite</span>
          </div>
          <div className="stat">
            <span className="stat-num">{total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        <button className="btn-restart" onClick={onRestart}>
          ↩ Înapoi la meniu
        </button>
      </div>

      {wrong.length > 0 && (
        <div className="results-section">
          <h3 className="results-section-title red">Răspunsuri greșite ({wrong.length})</h3>
          <div className="results-list">
            {wrong.map((q, idx) => {
              const qIdx = questions.indexOf(q);
              return (
                <div key={q.id} className="results-item wrong" onClick={() => onGoTo(qIdx)}>
                  <div className="results-item-meta">
                    <span className="ri-type">{TYPE_LABELS[q.type]}</span>
                    <span className="ri-num">#{idx + 1}</span>
                  </div>
                  <p className="ri-text">{q.text.slice(0, 100)}{q.text.length > 100 ? '…' : ''}</p>
                  {q.type === 'fillin' && (
                    <p className="ri-answer">Răspuns corect: <strong>{q.answer}</strong></p>
                  )}
                  {q.type === 'single' && q.options && (
                    <ul className="ri-options">
                      {q.options.filter(o => o.correct).map((o, i) => (
                        <li key={i} className="ri-correct">✓ {o.text}</li>
                      ))}
                    </ul>
                  )}
                  {q.type === 'multiple' && q.options && (
                    <ul className="ri-options">
                      {q.options.filter(o => o.correct).map((o, i) => (
                        <li key={i} className="ri-correct">✓ {o.text}</li>
                      ))}
                    </ul>
                  )}
                  {q.type === 'matching' && q.pairs && (
                    <ul className="ri-options">
                      {q.pairs.map((p, i) => (
                        <li key={i} className="ri-correct">✓ {p.left} → {p.right}</li>
                      ))}
                    </ul>
                  )}
                  <span className="ri-goto">Revezi →</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {skipped.length > 0 && (
        <div className="results-section">
          <h3 className="results-section-title muted">Întrebări sărite ({skipped.length})</h3>
          <div className="results-list">
            {skipped.map((q) => {
              const qIdx = questions.indexOf(q);
              return (
                <div key={q.id} className="results-item skipped" onClick={() => onGoTo(qIdx)}>
                  <span className="ri-type">{TYPE_LABELS[q.type]}</span>
                  <p className="ri-text">{q.text.slice(0, 80)}{q.text.length > 80 ? '…' : ''}</p>
                  <span className="ri-goto">Răspunde →</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {answered.filter(a => a.isCorrect).length > 0 && (
        <div className="results-section">
          <h3 className="results-section-title green">Răspunsuri corecte ({score})</h3>
          <div className="results-list">
            {questions.filter(q => answers[q.id]?.isCorrect).map(q => (
              <div key={q.id} className="results-item correct">
                <span className="ri-type">{TYPE_LABELS[q.type]}</span>
                <p className="ri-text">{q.text.slice(0, 80)}{q.text.length > 80 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
