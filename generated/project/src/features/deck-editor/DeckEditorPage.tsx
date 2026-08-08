import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Deck, Card } from '../../entities/flashcard';
import { apiClient } from '../../services/apiClient';
import { Button } from '../../design-system/index';
import { ArrowLeft, Plus, Trash2, Save, Sparkles, Tag, HelpCircle } from 'lucide-react';

export const DeckEditorPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const isNew = !deckId || deckId === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Programming');
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(isNew ? null : deckId);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active card form state
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hints, setHints] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && deckId) {
      apiClient.getDeckById(deckId).then(deck => {
        if (deck) {
          setTitle(deck.title);
          setDescription(deck.description);
          setCategory(deck.category);
          setIsPublic(deck.isPublic);
          setCards(deck.cards);
          setCurrentDeckId(deck.id);
        } else {
          setError('Deck not found');
        }
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load deck');
        setLoading(false);
      });
    }
  }, [deckId, isNew]);

  const handleSaveDeckInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Deck title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (isNew || !currentDeckId) {
        const created = await apiClient.createDeck({ title, description, category, isPublic });
        setCurrentDeckId(created.id);
        navigate(`/dashboard`, { replace: true });
      } else {
        await apiClient.updateDeck(currentDeckId, { title, description, category, isPublic });
        setSuccess('✓ Deck info saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        navigate(`/dashboard`);
      }
      setSaving(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save deck');
      setSaving(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeckId) {
      setError('Please save deck details before adding cards.');
      return;
    }
    if (!front.trim() || !back.trim()) {
      setError('Both front and back content are required for a flashcard.');
      return;
    }

    try {
      setError(null);
      const tags = tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [];
      const savedCard = await apiClient.saveCard(currentDeckId, {
        id: editingCardId || undefined,
        front,
        back,
        hints,
        tags
      });

      if (editingCardId) {
        setCards(cards.map(c => c.id === editingCardId ? savedCard : c));
      } else {
        setCards([...cards, savedCard]);
      }

      // Reset card form
      setFront('');
      setBack('');
      setHints('');
      setTagInput('');
      setEditingCardId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    }
  };

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setFront(card.front);
    setBack(card.back);
    setHints(card.hints || '');
    setTagInput(card.tags ? card.tags.join(', ') : '');
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!currentDeckId) return;
    try {
      await apiClient.deleteCard(currentDeckId, cardId);
      setCards(cards.filter(c => c.id !== cardId));
      if (editingCardId === cardId) {
        setEditingCardId(null);
        setFront('');
        setBack('');
        setHints('');
        setTagInput('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete card');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-10 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-sm">Loading deck editor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Back to dashboard"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {isNew ? 'Create New Flashcard Deck' : 'Edit Flashcard Deck'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure deck settings and manage individual flashcard items.
              </p>
            </div>
          </div>
          {currentDeckId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/decks/${currentDeckId}/quiz`)}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Start Quiz Mode
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-950/60 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm font-medium flex items-center gap-2">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deck Settings Form */}
          <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-md p-6 h-fit">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Deck Settings
            </h2>
            <form onSubmit={handleSaveDeckInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="deck-title">
                  Deck Title *
                </label>
                <input
                  id="deck-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced TypeScript"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="deck-desc">
                  Description
                </label>
                <textarea
                  id="deck-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of what this deck covers..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="deck-cat">
                  Category
                </label>
                <input
                  id="deck-cat"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Programming, Language, Science"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="deck-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="deck-public" className="text-xs text-slate-300">
                  Make deck publicly searchable
                </label>
              </div>

              <div className="pt-4">
                <Button variant="primary" type="submit" loading={saving} className="w-full" icon={<Save className="w-4 h-4" />}>
                  {currentDeckId ? 'Save Deck Info' : 'Create Deck & Add Cards'}
                </Button>
              </div>
            </form>
          </div>

          {/* Cards Manager */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  {editingCardId ? 'Edit Flashcard Item' : 'Add New Flashcard'}
                </h2>
                {currentDeckId && (
                  <span className="text-xs font-mono text-slate-400">
                    {cards.length} cards in deck
                  </span>
                )}
              </div>

              {!currentDeckId ? (
                <div className="p-4 rounded-md bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
                  Please configure and save deck details on the left before adding flashcards.
                </div>
              ) : (
                <form onSubmit={handleSaveCard} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="card-front">
                      Front Content (Question / Prompt) *
                    </label>
                    <textarea
                      id="card-front"
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      placeholder="What is..."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="card-back">
                      Back Content (Answer / Explanation) *
                    </label>
                    <textarea
                      id="card-back"
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      placeholder="The answer is..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="card-hint">
                        Hint (Optional)
                      </label>
                      <input
                        id="card-hint"
                        type="text"
                        value={hints}
                        onChange={(e) => setHints(e.target.value)}
                        placeholder="Subtle clue for study mode"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="card-tags">
                        Tags (Comma separated)
                      </label>
                      <input
                        id="card-tags"
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="typescript, generics"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="primary" size="sm" type="submit" icon={<Plus className="w-4 h-4" />}>
                      {editingCardId ? 'Update Card' : 'Add Card to Deck'}
                    </Button>
                    {editingCardId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setEditingCardId(null);
                          setFront('');
                          setBack('');
                          setHints('');
                          setTagInput('');
                        }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Card List Preview */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-md p-6">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">
                Existing Cards ({cards.length})
              </h3>

              {cards.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No cards added to this deck yet. Add your first card above.
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card, idx) => (
                    <div
                      key={card.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-md p-4 flex items-start justify-between gap-4 group hover:border-slate-700 transition"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                          {card.tags && card.tags.map((t, ti) => (
                            <span key={ti} className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              <Tag className="w-3 h-3 mr-1" />
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm font-medium text-white">
                          <span className="text-xs text-blue-400 uppercase font-mono mr-2">Q:</span>
                          {card.front}
                        </div>
                        <div className="text-sm text-slate-400">
                          <span className="text-xs text-emerald-400 uppercase font-mono mr-2">A:</span>
                          {card.back}
                        </div>
                        {card.hints && (
                          <div className="text-xs text-amber-400/80 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            Hint: {card.hints}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditCard(card)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          aria-label="Delete card"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleDeleteCard(card.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};