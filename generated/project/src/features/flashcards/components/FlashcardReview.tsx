import React, { useState } from 'react';
import { FlashcardDeck, Flashcard } from '../../../entities/Flashcard';
import { Card, Button, Badge } from '../../../design-system';

interface FlashcardReviewProps {
  deck: FlashcardDeck;
  onBack: () => void;
  onRateCard: (deckId: string, cardId: string, quality: number) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ deck, onBack, onRateCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentCard: Flashcard | undefined = deck.cards[currentIndex];

  const handleRate = (quality: number) => {
    if (!currentCard) return;
    onRateCard(deck.id, currentCard.id, quality);
    setIsFlipped(false);
    if (currentIndex + 1 < deck.cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 animate-fadeIn">
        <Card className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="text-2xl font-bold text-slate-100">Deck Review Complete!</h2>
          <p className="text-sm text-slate-400">You have successfully reviewed all cards in "{deck.title}". Keep up the spaced repetition schedule!</p>
          <Button variant="primary" onClick={onBack}>
            Back to Decks
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <Badge variant="info">Card {currentIndex + 1} of {deck.cards.length}</Badge>
      </div>

      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[300px] bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 transition-all shadow-xl"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
          <span>{isFlipped ? 'Answer' : 'Question'}</span>
          <span>Click card to flip</span>
        </div>
        <div className="my-auto text-center py-6">
          <p className="text-xl font-medium text-slate-100">
            {isFlipped ? currentCard?.back : currentCard?.front}
          </p>
        </div>
        <div className="text-center text-xs text-slate-400">
          {isFlipped ? 'Rate your recall below' : 'Flip to reveal answer'}
        </div>
      </div>

      {isFlipped && (
        <div className="flex items-center justify-center gap-3 animate-fadeIn">
          <Button variant="danger" size="sm" onClick={() => handleRate(1)}>
            Again (1)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleRate(3)}>
            Good (3)
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleRate(5)}>
            Easy (5)
          </Button>
        </div>
      )}
    </div>
  );
};