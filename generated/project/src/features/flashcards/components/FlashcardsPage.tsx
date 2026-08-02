import React, { useState, useEffect } from 'react';
import { FlashcardDeck } from '../../../entities/Flashcard';
import { flashcardService } from '../services/flashcardService';
import { useAuth } from '../../auth/hooks/useAuth';
import { FlashcardDeckList } from './FlashcardDeckList';
import { FlashcardReview } from './FlashcardReview';
import { Toast } from '../../../design-system';

export const FlashcardsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'usr_guest';

  const [decks, setDecks] = useState<FlashcardDeck[]>(() => flashcardService.getDecks(userId));
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setDecks(flashcardService.getDecks(userId));
  }, [userId]);

  const handleGenerateDeck = async (title: string, category: string, topicText: string) => {
    await flashcardService.generateDeck(userId, title, category, topicText);
    setDecks(flashcardService.getDecks(userId));
    setToastMessage('Flashcard deck generated successfully!');
  };

  const handleRateCard = (deckId: string, cardId: string, quality: number) => {
    flashcardService.updateCardReview(userId, deckId, cardId, quality);
    setDecks(flashcardService.getDecks(userId));
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  const handleDismissToast = () => {
    setToastMessage(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {toastMessage && (
        <Toast toast={{ id: 'cards_toast', type: 'success', message: toastMessage }} onDismiss={handleDismissToast} />
      )}

      {selectedDeck ? (
        <FlashcardReview
          deck={selectedDeck}
          onBack={() => setSelectedDeckId(null)}
          onRateCard={handleRateCard}
        />
      ) : (
        <FlashcardDeckList
          decks={decks}
          onGenerateDeck={handleGenerateDeck}
          onStartReview={deck => setSelectedDeckId(deck.id)}
        />
      )}
    </div>
  );
};