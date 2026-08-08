import { Deck, Card, QuizSession, DeckMetrics } from '../entities/flashcard';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = {
  async getDecks(): Promise<Deck[]> {
    const res = await fetch(`${API_BASE}/decks`);
    if (!res.ok) throw new Error('Failed to fetch decks');
    return res.json();
  },

  async getDeckById(id: string): Promise<Deck | null> {
    const res = await fetch(`${API_BASE}/decks/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch deck');
    return res.json();
  },

  async createDeck(data: { title: string; description: string; category: string; isPublic: boolean }): Promise<Deck> {
    const res = await fetch(`${API_BASE}/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create deck');
    return res.json();
  },

  async updateDeck(id: string, data: Partial<Deck>): Promise<Deck> {
    const res = await fetch(`${API_BASE}/decks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update deck');
    return res.json();
  },

  async deleteDeck(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/decks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete deck');
  },

  async saveCard(deckId: string, cardData: { id?: string; front: string; back: string; hints?: string; tags?: string[] }): Promise<Card> {
    const res = await fetch(`${API_BASE}/decks/${deckId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });
    if (!res.ok) throw new Error('Failed to save card');
    return res.json();
  },

  async deleteCard(deckId: string, cardId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete card');
  },

  async getQuizSessions(): Promise<QuizSession[]> {
    return [];
  },

  async saveQuizSession(session: Omit<QuizSession, 'id' | 'createdAt'>): Promise<QuizSession> {
    const res = await fetch(`${API_BASE}/quiz-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    if (!res.ok) throw new Error('Failed to save quiz session');
    return res.json();
  },

  async getMetrics(): Promise<DeckMetrics> {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  }
};

export const api = apiClient;
export default apiClient;