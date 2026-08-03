import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './features/sidebar/components/Sidebar';
import { SearchBar } from './features/search/components/SearchBar';
import { NoteList } from './features/notes/components/NoteList';
import { MarkdownEditor } from './features/editor/components/MarkdownEditor';
import { useNotesQuery } from './features/notes/hooks/useNotesQuery';
import { exportService } from './features/export/services/exportService';
import { useLocalStorage } from './shared/hooks/useLocalStorage';
import { useFuzzySearch } from './features/search/hooks/useFuzzySearch';
import { Menu, Download, Sparkles } from 'lucide-react';
import { Button } from './design-system/index.js';

const queryClient = new QueryClient();

function KnowledgeDashboard() {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>('aegis_sidebar_open', true);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [isFavoriteFilter, setIsFavoriteFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const {
    notebooks,
    tags,
    notes: fetchedNotes,
    isLoading,
    createNotebook,
    deleteNotebook,
    createTag,
    deleteTag,
    createNote,
    updateNote,
    deleteNote,
  } = useNotesQuery({
    notebookId: activeNotebookId,
    tagId: activeTagId,
    search: searchQuery,
    favorite: isFavoriteFilter,
  });

  const notes = useFuzzySearch(fetchedNotes, searchQuery);

  useEffect(() => {
    if (notes.length > 0 && (!activeNoteId || !notes.some((n) => n.id === activeNoteId))) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[type="text"]');
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  const handleCreateNote = () => {
    const targetNbId = activeNotebookId || notebooks[0]?.id || 'nb-1';
    createNote({
      title: 'Untitled Note',
      content: '',
      notebookId: targetNbId,
    });
  };

  const activeFilterLabel = isFavoriteFilter
    ? 'Favorites'
    : activeTagId
    ? `Tag: ${tags.find((t) => t.id === activeTagId)?.name || 'Filtered'}`
    : activeNotebookId
    ? `Notebook: ${notebooks.find((nb) => nb.id === activeNotebookId)?.title || 'Filtered'}`
    : 'All Notes';

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Navigation Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Navigation Sidebar"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <span className="font-semibold text-sm tracking-wide text-slate-200 hidden sm:inline">
              Aegis Workspace
            </span>
          </div>
        </div>

        {/* Search Engine */}
        <div className="w-full max-w-md mx-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search notes, tags, or content... (Cmd+K)"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 relative">
          {activeNote && (
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                aria-label="Export document menu"
                icon={<Download className="w-4 h-4" aria-hidden="true" />}
              >
                Export
              </Button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-md shadow-2xl z-50 p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      exportService.exportAsMarkdown(activeNote);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    Export Markdown (.md)
                  </button>
                  <button
                    onClick={() => {
                      exportService.exportAsTxt(activeNote);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    Export Plain Text (.txt)
                  </button>
                  <button
                    onClick={() => {
                      exportService.exportAsJson(activeNote);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    Export Backup (.json)
                  </button>
                  <button
                    onClick={() => {
                      exportService.exportAsPdf(activeNote);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    Print / PDF Document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          notebooks={notebooks}
          tags={tags}
          activeNotebookId={activeNotebookId}
          activeTagId={activeTagId}
          isFavoriteFilter={isFavoriteFilter}
          onSelectNotebook={(id) => {
            setActiveNotebookId(id);
            setActiveTagId(null);
            setIsFavoriteFilter(false);
          }}
          onSelectTag={(id) => {
            setActiveTagId(id);
            setActiveNotebookId(null);
            setIsFavoriteFilter(false);
          }}
          onSelectFavorites={(fav) => {
            setIsFavoriteFilter(fav);
            setActiveNotebookId(null);
            setActiveTagId(null);
          }}
          onCreateNotebook={(title, color) => createNotebook({ title, color })}
          onCreateTag={(name, color) => createTag({ name, color })}
          onDeleteNotebook={(id) => deleteNotebook(id)}
          onDeleteTag={(id) => deleteTag(id)}
          isOpen={sidebarOpen}
          onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        />

        <NoteList
          notes={notes}
          activeNoteId={activeNoteId}
          isLoading={isLoading}
          onSelectNote={setActiveNoteId}
          onCreateNote={handleCreateNote}
          onDeleteNote={(id) => deleteNote(id)}
          filterLabel={activeFilterLabel}
        />

        <MarkdownEditor
          note={activeNote}
          allTags={tags}
          onUpdateNote={(id, data) => updateNote({ id, data })}
          onDeleteNote={(id) => deleteNote(id)}
          onToggleFavorite={(id) => {
            if (activeNote) {
              updateNote({ id, data: { isFavorite: !activeNote.isFavorite } });
            }
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KnowledgeDashboard />
    </QueryClientProvider>
  );
}