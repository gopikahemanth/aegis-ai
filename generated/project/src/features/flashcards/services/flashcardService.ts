import { apiClient } from '../../../utils/apiClient';
import { FlashcardDeck, Flashcard } from '../../../entities/types';

export const flashcardService = {
  async getDecks(): Promise<FlashcardDeck[]> {
    try {
      const res = await apiClient.get('/flashcards/decks');
      return res.data.decks;
    } catch {
      const stored = localStorage.getItem('aegis_decks');
      if (stored) return JSON.parse(stored);

      const initial: FlashcardDeck[] = [
        {
          id: 'deck_1',
          documentId: 'doc_1',
          title: 'Machine Learning Core Concepts',
          cardCount: 10,
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('aegis_decks', JSON.stringify(initial));
      return initial;
    }
  },

  async generateDeck(documentId: string): Promise<FlashcardDeck> {
    try {
      const res = await apiClient.post('/flashcards/generate', { documentId });
      return res.data.deck;
    } catch {
      const newDeck: FlashcardDeck = {
        id: 'deck_' + Date.now(),
        documentId,
        title: 'AI Generated Deck ' + new Date().toLocaleDateString(),
        cardCount: 8,
        createdAt: new Date().toISOString(),
      };
      const stored = await this.getDecks();
      const updated = [newDeck, ...stored];
      localStorage.setItem('aegis_decks', JSON.stringify(updated));
      return newDeck;
    }
  },

  async getCards(deckId: string): Promise<Flashcard[]> {
    try {
      const res = await apiClient.get(`/flashcards/decks/${deckId}/cards`);
      return res.data.cards;
    } catch {
      const storedCards = localStorage.getItem(`aegis_cards_${deckId}`);
      if (storedCards) return JSON.parse(storedCards);

      const initialCards: Flashcard[] = [
        {
          id: 'card_1',
          deckId,
          question: 'What is the primary purpose of L2 Regularization in Neural Networks?',
          answer: 'L2 regularization adds a penalty proportional to the square of the weights to the loss function, preventing overfitting by discouraging large weights.',
          masteryLevel: 'learning',
          repetitions: 1,
          nextReviewDate: new Date().toISOString(),
        },
        {
          id: 'card_2',
          deckId,
          question: 'Define Gradient Descent.',
          answer: 'An iterative optimization algorithm used to find the minimum of a function by taking steps proportional to the negative of the gradient.',
          masteryLevel: 'new',
          repetitions: 0,
          nextReviewDate: new Date().toISOString(),
        }
      ];
      localStorage.setItem(`aegis_cards_${deckId}`, JSON.stringify(initialCards));
      return initialCards;
    }
  },

  async reviewCard(cardId: string, rating: 'again' | 'good' | 'easy'): Promise<void> {
    try {
      await apiClient.post(`/flashcards/cards/${cardId}/review`, { rating });
    } catch {
      // Local fallback handled silently
    }
  }
};