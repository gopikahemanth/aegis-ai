import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '../../../design-system';
import { documentService } from '../services/documentService';
import { StudyDocument } from '../../../entities/types';
import { formatDate } from '../../../utils/formatDate';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const newDoc = await documentService.uploadDocument(file);
      setDocuments(prev => [newDoc, ...prev]);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch {
      setError('Failed to delete document.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Study Materials</h1>
          <p className="text-sm text-slate-400 mt-1">Upload lecture notes, PDFs, or slides for AI RAG analysis.</p>
        </div>
        <label className="cursor-pointer inline-flex items-center justify-center font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 text-sm gap-2 transition-all">
          <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt,.png,.jpg" />
          {uploading ? 'Processing & Vectorizing...' : 'Upload Document'}
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents uploaded yet"
          description="Upload your first textbook chapter or lecture notes to begin studying smarter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(`/app/documents/${doc.id}`)}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-xl p-5 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-slate-100 line-clamp-1">{doc.title}</h3>
                  <button
                    aria-label="Delete document"
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{doc.summary || 'Ready for chat and quiz generation.'}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-500">
                <span className="uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  {doc.mimeType.split('/')[1] || 'FILE'}
                </span>
                <span>{formatDate(doc.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};