import React, { useState } from 'react';
import { Deck } from '../../../entities/flashcard';
import { Button } from '../../../design-system/index';
import { BookOpen, Play, Edit3, Trash2, Calendar, Tag } from 'lucide-react';

interface DeckCardProps {
  deck: Deck;
  onStudy: (deckId: string) => void;
  onEdit: (deckId: string) => void;
  onDelete: (deckId: string) => void;
}

export const DeckCard: React.FC<DeckCardProps> = ({ deck, onStudy, onEdit, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (showConfirm) {
      onDelete(deck.id);
    } else {
      setShowConfirm(true);
    }
  };

  const formattedDate = new Date(deck.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-md p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-sm group">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800/50 mb-2">
              <Tag className="w-3 h-3 mr-1" />
              {deck.category || 'General'}
            </span>
            <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-blue-400 transition">
              {deck.title}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
            {deck.cards.length} cards
          </span>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2 mb-6">
          {deck.description || 'No description provided for this deck.'}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Created {formattedDate}
          </span>
          <span className={deck.isPublic ? 'text-emerald-400' : 'text-slate-500'}>
            {deck.isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={<Play className="w-3.5 h-3.5" />}
            onClick={() => onStudy(deck.id)}
          >
            Study
          </Button>

          <Button
            variant="secondary"
            size="sm"
            aria-label="Edit deck"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={() => onEdit(deck.id)}
          >
            Edit
          </Button>

          <Button
            variant={showConfirm ? 'danger' : 'secondary'}
            size="sm"
            aria-label="Delete deck"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleDeleteClick}
          >
            {showConfirm ? 'Confirm' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};