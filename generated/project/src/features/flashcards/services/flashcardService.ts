import { FlashcardDeck, Flashcard } from '../../../entities/Flashcard';

export const flashcardService = {
  getDecks(userId: string): FlashcardDeck[] {
    const raw = localStorage.getItem(`flashcard_decks_${userId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDecks(userId: string, decks: FlashcardDeck[]): void {
    localStorage.setItem(`flashcard_decks_${userId}`, JSON.stringify(decks));
  },

  async generateDeck(userId: string, title: string, category: string, topicText: string): Promise<FlashcardDeck> {
    const mockCards: Flashcard[] = [
      {
        id: 'card_' + Math.random().toString(36).substring(2, 9),
        front: `What is the primary definition of ${title}?`,
        back: `${title} refers to the core concepts and methodologies associated with ${category}, specifically focusing on structured applications and principles.`,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
      },
      {
        id: 'card_' + Math.random().toString(36).substring(2, 9),
        front: `Explain the significance of ${category} in practical scenarios.`,
        back: `It provides robustness, scalability, and systematic problem solving capabilities across complex domains.`,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
      },
      {
        id: 'card_' + Math.random().toString(36).substring(2, 9),
        front: `What are common edge cases or pitfalls when studying ${title}?`,
        back: `Failing to understand foundational principles, skipping active recall practice, and neglecting spaced repetition schedules.`,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
      },
    ];

    const newDeck: FlashcardDeck = {
      id: 'deck_' + Math.random().toString(36).substring(2, 9),
      userId,
      title,
      description: `Generated flashcards for ${topicText}`,
      category,
      cardCount: mockCards.length,
      createdAt: new Date().toISOString(),
      cards: mockCards,
    };

    const existing = this.getDecks(userId);
    this.saveDecks(userId, [newDeck, ...existing]);
    return newDeck;
  },

  updateCardReview(userId: string, deckId: string, cardId: string, quality: number): FlashcardDeck {
    const decks = this.getDecks(userId);
    const deck = decks.find(d => d.id === deckId);
    if (!deck) throw new Error('Deck not found');

    const card = deck.cards.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');

    const reps = card.repetitions ?? 0;
    let currInterval = card.interval ?? 1;

    // Simple SM-2 spaced repetition algorithm implementation
    if (quality >= 3) {
      if (reps === 0) {
        currInterval = 1;
      } else if (reps === 1) {
        currInterval = 6;
      } else {
        currInterval = Math.round(currInterval * card.easeFactor);
      }
      card.repetitions = reps + 1;
    } else {
      card.repetitions = 0;
      currInterval = 1;
    }

    card.interval = currInterval;
    card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + currInterval);
    card.nextReviewDate = nextDate.toISOString();

    this.saveDecks(userId, decks);
    return deck;
  }
};