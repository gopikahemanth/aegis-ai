import React from 'react';
import { Note } from '../../../entities';
import { Plus, Star, FileText, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Button, Skeleton, EmptyState } from '../../../design-system/index.js';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  isLoading: boolean;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  filterLabel?: string;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  activeNoteId,
  isLoading,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  filterLabel,
}) => {
  if (isLoading) {
    return (
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{filterLabel || 'All Notes'}</h2>
          <span className="text-xs text-slate-500">{notes.length} note{notes.length === 1 ? '' : 's'}</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateNote}
          aria-label="Create new note"
          icon={<Plus className="w-4 h-4" aria-hidden="true" />}
        >
          New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {notes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" aria-hidden="true" />}
            title="No notes found"
            description="Create your first note to start adding content to your knowledge base."
            action={
              <Button variant="primary" size="sm" onClick={onCreateNote}>
                Create Note
              </Button>
            }
          />
        ) : (
          notes.map((note) => {
            const isActive = note.id === activeNoteId;
            const excerpt = note.content.replace(/[#*`_]/g, '').slice(0, 90) || 'Empty note...';
            const dateFormatted = new Date(note.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group p-4 cursor-pointer transition-colors relative ${
                  isActive ? 'bg-slate-800/90 text-slate-100' : 'hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className={`text-sm font-medium truncate ${isActive ? 'text-slate-100' : 'text-slate-200'}`}>
                    {note.title || 'Untitled Note'}
                  </h3>
                  {note.isFavorite && (
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" aria-hidden="true" />
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">{excerpt}</p>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">{dateFormatted}</span>

                  <div className="flex items-center gap-1">
                    {note.tags.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${t.color}25`, color: t.color }}
                      >
                        {t.name}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[10px] text-slate-500">+{note.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};