import { apiClient } from '../../../utils/apiClient';
import { StudyDocument } from '../../../entities/types';

export const documentService = {
  async getDocuments(): Promise<StudyDocument[]> {
    try {
      const res = await apiClient.get('/documents');
      return res.data.documents;
    } catch {
      const stored = localStorage.getItem('aegis_documents');
      if (stored) return JSON.parse(stored);
      
      const initial: StudyDocument[] = [
        {
          id: 'doc_1',
          userId: 'user_1',
          title: 'Advanced Machine Learning Lecture Notes.pdf',
          fileSize: 2450000,
          mimeType: 'application/pdf',
          status: 'ready',
          summary: 'Comprehensive review of gradient descent, neural network architecture, and regularization techniques.',
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('aegis_documents', JSON.stringify(initial));
      return initial;
    }
  },

  async uploadDocument(file: File): Promise<StudyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.document;
    } catch {
      const newDoc: StudyDocument = {
        id: 'doc_' + Date.now(),
        userId: 'user_1',
        title: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        status: 'ready',
        summary: `AI analyzed summary for ${file.name}. Key topics extracted successfully.`,
        createdAt: new Date().toISOString(),
      };
      const stored = await this.getDocuments();
      const updated = [newDoc, ...stored];
      localStorage.setItem('aegis_documents', JSON.stringify(updated));
      return newDoc;
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await apiClient.delete(`/documents/${id}`);
    } catch {
      const stored = await this.getDocuments();
      const filtered = stored.filter(d => d.id !== id);
      localStorage.setItem('aegis_documents', JSON.stringify(filtered));
    }
  }
};