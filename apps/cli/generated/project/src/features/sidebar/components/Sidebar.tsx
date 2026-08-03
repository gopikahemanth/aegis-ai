import React, { useState } from 'react';
import {
  BookOpen,
  Tag as TagIcon,
  Plus,
  Folder,
  FileText,
  Star,
  Trash2,
  ChevronLeft,
} from 'lucide-react';
import { Notebook, Tag } from '../../../entities';
import { Button } from '../../../design-system/index.js';

interface SidebarProps {
  notebooks: Notebook[];
  tags: Tag[];
  activeNotebookId: string | null;
  activeTagId: string | null;
  isFavoriteFilter: boolean;
  onSelectNotebook: (id: string | null) => void;
  onSelectTag: (id: string | null) => void;
  onSelectFavorites: (fav: boolean) => void;
  onCreateNotebook: (title: string, color: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onDeleteNotebook: (id: string) => void;
  onDeleteTag: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notebooks,
  tags,
  activeNotebookId,
  activeTagId,
  isFavoriteFilter,
  onSelectNotebook,
  onSelectTag,
  onSelectFavorites,
  onCreateNotebook,
  onCreateTag,
  onDeleteNotebook,
  onDeleteTag,
  isOpen,
  onToggleOpen,
}) => {
  const [newNotebookModal, setNewNotebookModal] = useState(false);
  const [newTagModal, setNewTagModal] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');
  const [notebookColor, setNotebookColor] = useState('#3b82f6');
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#64748b');

  const handleCreateNotebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notebookTitle.trim()) return;
    onCreateNotebook(notebookTitle.trim(), notebookColor);
    setNotebookTitle('');
    setNewNotebookModal(false);
  };

  const handleCreateTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    onCreateTag(tagName.trim(), tagColor);
    setTagName('');
    setNewTagModal(false);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300 select-none z-10">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" aria-hidden="true" />
          <span className="font-semibold text-slate-100 tracking-tight text-sm">Aegis Knowledge</span>
        </div>
        <button
          onClick={onToggleOpen}
          aria-label="Collapse sidebar"
          className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Primary Views */}
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectNotebook(null);
              onSelectTag(null);
              onSelectFavorites(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-md transition-colors ${
              !activeNotebookId && !activeTagId && !isFavoriteFilter
                ? 'bg-blue-600/20 text-blue-400 font-medium'
                : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>All Notes</span>
          </button>

          <button
            onClick={() => {
              onSelectNotebook(null);
              onSelectTag(null);
              onSelectFavorites(true);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-md transition-colors ${
              isFavoriteFilter
                ? 'bg-amber-500/20 text-amber-400 font-medium'
                : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>Favorites</span>
          </button>
        </div>

        {/* Notebooks List */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Notebooks</span>
            <button
              onClick={() => setNewNotebookModal(true)}
              aria-label="Create notebook"
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-0.5">
            {notebooks.map((nb) => {
              const isActive = activeNotebookId === nb.id;
              return (
                <div key={nb.id} className="group flex items-center justify-between rounded-md hover:bg-slate-800/60 px-2">
                  <button
                    onClick={() => {
                      onSelectNotebook(nb.id);
                      onSelectTag(null);
                      onSelectFavorites(false);
                    }}
                    className={`flex-1 flex items-center gap-2 py-1.5 text-xs transition-colors text-left ${
                      isActive ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" style={{ color: nb.color }} aria-hidden="true" />
                    <span className="truncate">{nb.title}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete notebook "${nb.title}"?`)) {
                        onDeleteNotebook(nb.id);
                      }
                    }}
                    aria-label={`Delete notebook ${nb.title}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags List */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tags</span>
            <button
              onClick={() => setNewTagModal(true)}
              aria-label="Create tag"
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-0.5">
            {tags.map((tag) => {
              const isActive = activeTagId === tag.id;
              return (
                <div key={tag.id} className="group flex items-center justify-between rounded-md hover:bg-slate-800/60 px-2">
                  <button
                    onClick={() => {
                      onSelectTag(tag.id);
                      onSelectNotebook(null);
                      onSelectFavorites(false);
                    }}
                    className={`flex-1 flex items-center gap-2 py-1.5 text-xs transition-colors text-left ${
                      isActive ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TagIcon className="w-3 h-3" style={{ color: tag.color }} aria-hidden="true" />
                    <span className="truncate">{tag.name}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete tag "${tag.name}"?`)) {
                        onDeleteTag(tag.id);
                      }
                    }}
                    aria-label={`Delete tag ${tag.name}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Create Notebook */}
      {newNotebookModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateNotebookSubmit} className="bg-slate-900 border border-slate-800 rounded-md p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Create Notebook</h3>
            <div>
              <label htmlFor="notebookTitleInput" className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input
                id="notebookTitleInput"
                type="text"
                value={notebookTitle}
                onChange={(e) => setNotebookTitle(e.target.value)}
                placeholder="e.g. System Specs"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>
            <div>
              <label htmlFor="notebookColorInput" className="block text-xs font-medium text-slate-400 mb-1">Accent Color</label>
              <input
                id="notebookColorInput"
                type="color"
                value={notebookColor}
                onChange={(e) => setNotebookColor(e.target.value)}
                className="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-1 cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setNewNotebookModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm">Create</Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Tag */}
      {newTagModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateTagSubmit} className="bg-slate-900 border border-slate-800 rounded-md p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Create Tag</h3>
            <div>
              <label htmlFor="tagNameInput" className="block text-xs font-medium text-slate-400 mb-1">Tag Name</label>
              <input
                id="tagNameInput"
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g. Architecture"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>
            <div>
              <label htmlFor="tagColorInput" className="block text-xs font-medium text-slate-400 mb-1">Tag Color</label>
              <input
                id="tagColorInput"
                type="color"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                className="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-1 cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setNewTagModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm">Create</Button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};