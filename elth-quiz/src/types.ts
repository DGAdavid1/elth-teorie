export type QuestionType = 'single' | 'multiple' | 'matching' | 'fillin' | 'textblanks';

export interface Option {
  text: string;
  correct: boolean;
}

export interface Pair {
  left: string;
  right: string;
}

export interface Question {
  id: number;
  status: string;
  type: QuestionType;
  text: string;
  // For single/multiple
  options?: Option[];
  // For fillin
  answer?: string;
  // For matching
  pairs?: Pair[];
  // For textblanks
  filledText?: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, UserAnswer>;
  mode: 'quiz' | 'review' | 'results';
  filter: FilterType;
  score: number;
}

export type FilterType = 'all' | 'single' | 'multiple' | 'matching' | 'fillin' | 'textblanks';

export interface UserAnswer {
  questionId: number;
  type: QuestionType;
  // For single: index of selected option
  selectedSingle?: number;
  // For multiple: set of selected indices
  selectedMultiple?: number[];
  // For matching: user's mapping (leftIndex -> rightText)
  matchingMap?: Record<number, string>;
  // For fillin: text entered
  fillinText?: string;
  // For textblanks: revealed or not
  revealed?: boolean;
  // Result
  isCorrect?: boolean;
  isSubmitted: boolean;
}
