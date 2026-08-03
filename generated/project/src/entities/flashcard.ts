export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hints?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  isPublic: boolean;
  userId: string;
  cardsCount?: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizSession {
  id: string;
  deckId: string;
  userId: string;
  score: number;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  durationSeconds: number;
  completedAt: string;
  createdAt: string;
}

export interface DeckMetrics {
  totalDecks: number;
  totalCards: number;
  quizzesCompleted: number;
  averageScore: number;
}