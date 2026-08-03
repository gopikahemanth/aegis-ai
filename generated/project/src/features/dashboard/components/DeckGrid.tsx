import React from 'react';
import { Deck } from '../../../entities/flashcard';
import { DeckCard } from './DeckCard';
import { EmptyState, Button } from '../../../design-system/index';
import { Layers, Plus } from 'lucide-react';

interface DeckGridProps {
  decks: Deck[];
  onStudy: (deckId: string) => void;
  onEdit: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  onCreateNew: () => void;
}

export const DeckGrid: React.FC<DeckGridProps> = ({
  decks,
  onStudy,
  onEdit,
  onDelete,
  onCreateNew
}) => {
  if (decks.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="w-12 h-12 text-slate-600" />}
        title="No flashcard decks found"
        description="Get started by creating your first deck of flashcards to study."
        action={
          <Button variant="primary" onClick={onCreateNew} icon={<Plus className="w-4 h-4" />}>
            Create Deck
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onStudy={onStudy}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};