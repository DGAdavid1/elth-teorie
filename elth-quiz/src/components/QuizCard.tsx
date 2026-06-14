import { useState } from 'react';
import type { Question, UserAnswer } from '../types';
import { SingleChoice } from './question-types/SingleChoice';
import { MultipleChoice } from './question-types/MultipleChoice';
import { MatchingQuestion } from './question-types/MatchingQuestion';
import { FillInQuestion } from './question-types/FillInQuestion';
import { TextBlanksQuestion } from './question-types/TextBlanksQuestion';
import './QuizCard.css';

interface Props {
  question: Question;
  answer: UserAnswer | undefined;
  onSubmit: (answer: UserAnswer) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  single: 'Alegere unică',
  multiple: 'Alegere multiplă',
  matching: 'Asociere',
  fillin: 'Completare numerică',
  textblanks: 'Completare text',
};

export function QuizCard({ question, answer, onSubmit, onNext, onPrev, isFirst, isLast }: Props) {
  const [submitted, setSubmitted] = useState(answer?.isSubmitted ?? false);

  const handleSubmit = (ans: UserAnswer) => {
    setSubmitted(true);
    onSubmit(ans);
  };

  const isCorrect = answer?.isCorrect;

  return (
    <div className="quiz-card">
      <div className="card-meta">
        <span className="card-type">{TYPE_LABELS[question.type]}</span>
        <span className="card-id">#{question.id}</span>
      </div>

      <h2 className="card-question">{question.text}</h2>

      <div className="card-body">
        {question.type === 'single' && (
          <SingleChoice
            question={question}
            answer={answer}
            onSubmit={handleSubmit}
            submitted={submitted}
          />
        )}
        {question.type === 'multiple' && (
          <MultipleChoice
            question={question}
            answer={answer}
            onSubmit={handleSubmit}
            submitted={submitted}
          />
        )}
        {question.type === 'matching' && (
          <MatchingQuestion
            question={question}
            answer={answer}
            onSubmit={handleSubmit}
            submitted={submitted}
          />
        )}
        {question.type === 'fillin' && (
          <FillInQuestion
            question={question}
            answer={answer}
            onSubmit={handleSubmit}
            submitted={submitted}
          />
        )}
        {question.type === 'textblanks' && (
          <TextBlanksQuestion
            question={question}
            answer={answer}
            onSubmit={handleSubmit}
            submitted={submitted}
          />
        )}
      </div>

      {submitted && (
        <div className={`card-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect
            ? '✓ Corect!'
            : '✗ Incorect — vezi răspunsul corect mai sus'}
        </div>
      )}

      <div className="card-nav">
        <button
          className="btn-nav"
          onClick={onPrev}
          disabled={isFirst}
        >
          ← Anterior
        </button>

        <button
          className="btn-nav primary"
          onClick={onNext}
        >
          {isLast ? 'Finalizează →' : 'Următor →'}
        </button>
      </div>
    </div>
  );
}
