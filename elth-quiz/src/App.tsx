import { useState, useEffect, useCallback } from 'react';
import type { Question, UserAnswer, FilterType } from './types';
import { QuizCard } from './components/QuizCard';
import { Results } from './components/Results';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import './App.css';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, UserAnswer>>({});
  const [mode, setMode] = useState<'home' | 'quiz' | 'results'>('home');
  const [filter, setFilter] = useState<FilterType>('all');
  const [shuffled, setShuffled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/questions.json')
      .then(r => r.json())
      .then((data: Question[]) => {
        setAllQuestions(data);
        setLoading(false);
      });
  }, []);

  const filteredQuestions = useCallback(() => {
    const filtered = filter === 'all'
      ? allQuestions
      : allQuestions.filter(q => q.type === filter);
    return shuffled ? shuffle(filtered) : filtered;
  }, [allQuestions, filter, shuffled]);

  const startQuiz = () => {
    const qs = filteredQuestions();
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswers({});
    setMode('quiz');
  };

  const submitAnswer = (answer: UserAnswer) => {
    setAnswers(prev => ({ ...prev, [answer.questionId]: answer }));
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setMode('results');
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const restart = () => {
    setMode('home');
    setAnswers({});
    setCurrentIndex(0);
  };

  const score = Object.values(answers).filter(a => a.isCorrect).length;
  const total = Object.values(answers).filter(a => a.isSubmitted).length;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Se încarcă întrebările...</p>
      </div>
    );
  }

  if (mode === 'results') {
    return (
      <Results
        questions={questions}
        answers={answers}
        score={score}
        onRestart={restart}
        onGoTo={(idx) => { setCurrentIndex(idx); setMode('quiz'); }}
      />
    );
  }

  if (mode === 'quiz' && questions.length > 0) {
    const q = questions[currentIndex];
    const answered = answers[q.id];
    return (
      <div className="app-layout">
        <Header
          current={currentIndex + 1}
          total={questions.length}
          score={score}
          answered={total}
          onHome={restart}
        />
        <div className="quiz-area">
          <QuizCard
            key={q.id}
            question={q}
            answer={answered}
            onSubmit={submitAnswer}
            onNext={goNext}
            onPrev={goPrev}
            isFirst={currentIndex === 0}
            isLast={currentIndex === questions.length - 1}
          />
        </div>
        <nav className="question-nav">
          {questions.map((qn, idx) => {
            const ans = answers[qn.id];
            const cls = ans?.isSubmitted
              ? ans.isCorrect ? 'nav-dot correct' : 'nav-dot wrong'
              : idx === currentIndex ? 'nav-dot active' : 'nav-dot';
            return (
              <button key={qn.id} className={cls} onClick={() => setCurrentIndex(idx)}>
                {idx + 1}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Home screen
  const typeLabels: Record<string, string> = {
    all: 'Toate',
    single: 'Alegere unică',
    multiple: 'Alegere multiplă',
    matching: 'Asociere',
    fillin: 'Completare',
    textblanks: 'Răspuns complet',
  };

  const typeCounts = allQuestions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = filter === 'all'
    ? allQuestions.length
    : (typeCounts[filter] || 0);

  return (
    <div className="home-screen">
      <div className="home-hero">
        <div className="home-badge">⚡ Bazele Electrotehnicii — Teorie Câmp</div>
        <h1 className="home-title">Quiz Examen Final 2021</h1>
        <p className="home-subtitle">
          Exersează toate grilele din examenele de câmp electromagnetic
        </p>
      </div>

      <div className="home-card">
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          counts={typeCounts}
          total={allQuestions.length}
          typeLabels={typeLabels}
        />

        <div className="home-options">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={shuffled}
              onChange={e => setShuffled(e.target.checked)}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            Amestecă întrebările
          </label>
        </div>

        <div className="home-start-row">
          <div className="home-count">
            <span className="count-num">{activeCount}</span>
            <span className="count-label">întrebări selectate</span>
          </div>
          <button
            className="btn-start"
            onClick={startQuiz}
            disabled={activeCount === 0}
          >
            Începe testul →
          </button>
        </div>
      </div>

      <div className="type-grid">
        {Object.entries(typeCounts).map(([type, count]) => (
          <div key={type} className="type-card" onClick={() => setFilter(type as FilterType)}>
            <span className="type-icon">{typeIcon(type)}</span>
            <span className="type-name">{typeLabels[type] || type}</span>
            <span className="type-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function typeIcon(type: string) {
  const icons: Record<string, string> = {
    single: '◉',
    multiple: '☑',
    matching: '⇄',
    fillin: '✏',
    textblanks: '📖',
  };
  return icons[type] || '?';
}
