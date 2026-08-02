import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../design-system';
import { flashcardService } from '../services/flashcardService';
import { Flashcard } from '../../../entities/types';

export const FlashcardReviewPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    flashcardService.getCards(deckId || 'deck_1').then(data => {
      setCards(data);
      setLoading(false);
    });
  }, [deckId]);

  const handleRating = async (rating: 'again' | 'good' | 'easy') => {
    const currentCard = cards[currentIndex];
    if (currentCard) {
      await flashcardService.reviewCard(currentCard.id, rating);
    }
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert('Deck review completed!');
      navigate('/app/flashcards');
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-12">Loading flashcards...</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">No cards in this deck</h2>
        <Button onClick={() => navigate('/app/flashcards')}>Back to Decks</Button>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/app/flashcards')} className="text-xs text-indigo-400 hover:underline">
          ← Back to Decks
        </button>
        <span className="text-xs font-mono text-slate-400">
          Card {currentIndex + 1} of {cards.length}
        </span>
      </div>

      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center cursor-pointer shadow-2xl transition-all"
      >
        <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-4">
          {isFlipped ? 'Answer' : 'Question (Click to flip)'}
        </span>
        <p className="text-xl font-medium text-slate-100 leading-relaxed">
          {isFlipped ? card.answer : card.question}
        </p>
      </div>

      {isFlipped && (
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="danger" onClick={() => handleRating('again')}>
            Again (Hard)
          </Button>
          <Button variant="secondary" onClick={() => handleRating('good')}>
            Good
          </Button>
          <Button onClick={() => handleRating('easy')}>
            Easy
          </Button>
        </div>
      )}
    </div>
  );
};