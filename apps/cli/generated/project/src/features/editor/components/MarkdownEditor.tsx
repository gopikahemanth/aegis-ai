import React, { useState, useEffect, useRef } from 'react';
import { Note, Tag } from '../../../entities';
import {
  Star,
  Trash2,
  Eye,
  Edit3,
  Tag as TagIcon,
  Check,
  Bold,
  Italic,
  Heading,
  Code,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Columns
} from 'lucide-react';

interface MarkdownEditorProps {
  note: Note | null;
  allTags: Tag[];
  onUpdateNote: (id: string, data: Partial<Note> & { tagIds?: string[] }) => void;
  onDeleteNote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  note,
  allTags,
  onUpdateNote,
  onDeleteNote,
  onToggleFavorite,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id]);

  const triggerSave = (updatedTitle?: string, updatedContent?: string) => {
    if (!note) return;
    setIsSaving(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onUpdateNote(note.id, {
        title: updatedTitle !== undefined ? updatedTitle : title,
        content: updatedContent !== undefined ? updatedContent : content,
      });
      setIsSaving(false);
    }, 500);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerSave(newTitle, undefined);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerSave(undefined, newContent);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  };

  const handleTagToggle = (tagId: string) => {
    if (!note) return;
    const currentTagIds = note.tags.map((t) => t.id);
    const updatedTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    onUpdateNote(note.id, { tagIds: updatedTagIds });
  };

  const renderMarkdown = (raw: string) => {
    if (!raw) return '<p class="text-slate-600 italic">No content yet...</p>';
    
    let html = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
      return `<pre class="bg-slate-900 border border-slate-800 rounded-md p-4 text-slate-300 font-mono text-xs overflow-x-auto my-3"><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-slate-100 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-100 mt-5 mb-2 border-b border-slate-800/80 pb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-slate-100 mt-6 mb-3">$1</h1>');

    // Blockquotes
    html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-2 border-blue-500 pl-3 py-1 my-2 text-slate-400 italic bg-blue-500/5">$1</blockquote>');

    // Task items
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1 text-slate-300"><span class="w-4 h-4 bg-blue-600 rounded text-slate-100 flex items-center justify-center text-[10px]">✓</span><s>$1</s></div>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1 text-slate-300"><span class="w-4 h-4 border border-slate-700 rounded inline-block"></span>$1</div>');

    // Bullet lists
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');

    // Paragraph breaks
    html = html.replace(/\n\n/g, '<div class="h-3"></div>');
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500 text-sm p-6 text-center">
        <Edit3 className="w-10 h-10 mb-3 text-slate-700" aria-hidden="true" />
        <p className="font-medium text-slate-400">No Note Selected</p>
        <p className="text-xs text-slate-600 mt-1 max-w-sm">Choose a document from the left list or click &quot;New Note&quot; to begin writing.</p>
      </div>
    );
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Top Header Controls */}
      <div className="border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {isSaving ? 'Saving...' : 'Saved'}
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-[11px] text-slate-500">{wordCount} words · {charCount} chars</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('edit')}
              aria-label="Edit view"
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'edit' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              aria-label="Split view"
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'split' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              aria-label="Preview view"
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'preview' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          <button
            onClick={() => onToggleFavorite(note.id)}
            aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 rounded-md border border-slate-800 transition-colors ${
              note.isFavorite ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-amber-500' : ''}`} aria-hidden="true" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this note?')) {
                onDeleteNote(note.id);
              }
            }}
            aria-label="Delete note"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      {viewMode !== 'preview' && (
        <div className="border-b border-slate-800/80 px-4 py-1.5 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => insertMarkdown('**', '**')}
              aria-label="Bold text"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <Bold className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              aria-label="Italic text"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <Italic className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => insertMarkdown('## ')}
              aria-label="Heading"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <Heading className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="w-px h-4 bg-slate-800 mx-1" />
            <button
              onClick={() => insertMarkdown('- ')}
              aria-label="Bullet list"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => insertMarkdown('1. ')}
              aria-label="Numbered list"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => insertMarkdown('- [ ] ')}
              aria-label="Task list"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="w-px h-4 bg-slate-800 mx-1" />
            <button
              onClick={() => insertMarkdown('```ts\n', '\n```')}
              aria-label="Code block"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <Code className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => insertMarkdown('> ')}
              aria-label="Blockquote"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            >
              <Quote className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Tag Selector Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowTagSelector(!showTagSelector)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <TagIcon className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              <span>Tags ({note.tags.length})</span>
            </button>
            {showTagSelector && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-md shadow-2xl z-50 p-2 space-y-1">
                <p className="text-[10px] font-semibold uppercase text-slate-500 px-2 py-1">Assign Tags</p>
                {allTags.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 py-1">No tags created yet</p>
                ) : (
                  allTags.map((t) => {
                    const isSelected = note.tags.some((nt) => nt.id === t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleTagToggle(t.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Title Input */}
      <div className="px-6 pt-4 pb-2 bg-slate-950">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Note"
          aria-label="Note Title"
          className="w-full bg-transparent text-xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none"
        />
        {/* Applied Tag Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {note.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              <TagIcon className="w-3 h-3" aria-hidden="true" />
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Workspace Area: Edit / Split / Preview */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col h-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write markdown here... (supports GFM, headers, code, blockquotes)"
              aria-label="Note Content Editor"
              className="w-full h-full bg-slate-900/30 border border-slate-800/80 rounded-md p-4 text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono text-sm leading-relaxed"
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 overflow-y-auto bg-slate-900/20 border border-slate-800/60 rounded-md p-6 text-slate-300 text-sm leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          </div>
        )}
      </div>
    </div>
  );
};