import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../design-system';
import { documentService } from '../services/documentService';
import { StudyDocument } from '../../../entities/types';

export const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<StudyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentService.getDocuments().then(docs => {
      const found = docs.find(d => d.id === id);
      if (found) setDoc(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="text-slate-400">Loading document details...</div>;
  }

  if (!doc) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-slate-200">Document not found</h2>
        <Button onClick={() => navigate('/app/documents')} className="mt-4">Back to Documents</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/app/documents')} className="text-xs text-indigo-400 hover:underline mb-1 inline-block">
            ← Back to Documents
          </button>
          <h1 className="text-2xl font-bold text-slate-100">{doc.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/chat')}>
            Chat with Doc
          </Button>
          <Button size="sm" onClick={() => navigate('/app/flashcards')}>
            Generate Flashcards
          </Button>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">AI Summary & Key Takeaways</h3>
          <p className="text-slate-300 text-sm leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            {doc.summary || 'No summary generated yet.'}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Vector Embeddings Status</h3>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Indexed into 1,536-dimensional vector database for high-precision semantic retrieval.
          </div>
        </div>
      </div>
    </div>
  );
};