export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface StudyDocument {
  id: string;
  userId: string;
  title: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  summary?: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  masteryLevel: 'new' | 'learning' | 'mastered';
  nextReviewDate: string;
  repetitions: number;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  documentId: string;
  cardCount: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

export interface Quiz {
  id: string;
  title: string;
  documentId: string;
  score?: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  completedAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  createdAt: string;
}