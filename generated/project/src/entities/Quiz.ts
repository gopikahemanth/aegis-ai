export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  scorePercent?: number;
  score?: number;
  correctAnswers?: number;
  totalQuestions: number;
  completedAt: string;
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  questions: QuizQuestion[];
  attempts?: QuizAttempt[];
}