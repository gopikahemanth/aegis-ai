import React, { useState } from 'react';
import { FlashcardDeck } from '../../../entities/Flashcard';
import { Card, Button, Badge, Modal, Input, EmptyState } from '../../../design-system';

interface FlashcardDeckListProps {
  decks: FlashcardDeck[];
  onGenerateDeck: (title: string, category: string, topicText: string) => Promise<void>;
  onStartReview: (deck: FlashcardDeck) => void;
}

export const FlashcardDeckList: React.FC<FlashcardDeckListProps> = ({ decks, onGenerateDeck, onStartReview }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [topicText, setTopicText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category) return;
    setLoading(true);
    try {
      await onGenerateDeck(title, category, topicText);
      setIsModalOpen(false);
      setTitle('');
      setCategory('');
      setTopicText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-100">Spaced Repetition Flashcards</h1>
          <p className="text-sm text-slate-400">Memory retention boosted by active recall and spaced intervals.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Generate AI Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <EmptyState
          title="No flashcard decks created yet"
          description="Generate your first flashcard deck using AI to start reviewing key concepts."
          actionLabel="Generate AI Deck"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <Card key={deck.id} className="flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-500/50" onClick={() => onStartReview(deck)}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge variant="success">{deck.category}</Badge>
                  <span className="text-xs text-slate-400">{deck.cards.length} Cards</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{deck.title}</h3>
                <p className="text-sm text-slate-400">Ready for review session using SM-2 algorithm.</p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-indigo-400 font-medium">Start Review Session →</span>
                <Badge variant="info">Active</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate AI Flashcard Deck">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Deck Title"
            placeholder="e.g., Organic Chemistry Reactions, Machine Learning Algorithms"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Input
            label="Category / Subject"
            placeholder="e.g., Chemistry, Computer Science"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Topic Notes or Source Text</label>
            <textarea
              rows={4}
              placeholder="Paste notes, chapter summaries, or bullet points here..."
              value={topicText}
              onChange={e => setTopicText(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Generate Deck
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};