import './Header.css';

interface Props {
  current: number;
  total: number;
  score: number;
  answered: number;
  onHome: () => void;
}

export function Header({ current, total, score, answered, onHome }: Props) {
  const pct = total > 0 ? Math.round((current - 1) / total * 100) : 0;

  return (
    <header className="header">
      <div className="header-inner">
        <button className="header-home" onClick={onHome} title="Înapoi acasă">
          ← Acasă
        </button>

        <div className="header-progress-text">
          <span className="progress-current">{current}</span>
          <span className="progress-sep"> / </span>
          <span className="progress-total">{total}</span>
        </div>

        <div className="header-score">
          {answered > 0 && (
            <span className="score-badge">
              {score}/{answered} ✓
            </span>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </header>
  );
}
