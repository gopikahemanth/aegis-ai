export interface Flashcard {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  interval?: number;
  repetitions?: number;
  nextReviewDate: string;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  cardCount: number;
  createdAt: string;
  cards: Flashcard[];
}