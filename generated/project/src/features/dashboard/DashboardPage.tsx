import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Deck, DeckMetrics } from '../../entities/flashcard';
import { apiClient } from '../../services/apiClient';
import { DashboardMetrics } from './components/DashboardMetrics';
import { DeckGrid } from './components/DeckGrid';
import { Button, Skeleton } from '../../design-system/index';
import { Plus, Layers, Search, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [metrics, setMetrics] = useState<DeckMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedDecks, fetchedMetrics] = await Promise.all([
        apiClient.getDecks(),
        apiClient.getMetrics()
      ]);
      setDecks(fetchedDecks);
      setMetrics(fetchedMetrics);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await apiClient.deleteDeck(deckId);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck');
    }
  };

  const filteredDecks = decks.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Flashcard Hub</h1>
            </div>
            <p className="text-sm text-slate-400">
              Manage your intelligent study decks, organize concepts, and test knowledge with precision.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/decks/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              New Deck
            </Button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-center justify-between">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={loadData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : (
          <>
            {metrics && <DashboardMetrics metrics={metrics} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search decks by title, description or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  aria-label="Search decks"
                />
              </div>
              <div className="text-xs text-slate-400">
                Showing {filteredDecks.length} of {decks.length} decks
              </div>
            </div>

            <DeckGrid
              decks={filteredDecks}
              onStudy={(id) => navigate(`/decks/${id}/quiz`)}
              onEdit={(id) => navigate(`/decks/${id}/edit`)}
              onDelete={handleDeleteDeck}
              onCreateNew={() => navigate('/decks/new')}
            />
          </>
        )}
      </div>
    </div>
  );
};