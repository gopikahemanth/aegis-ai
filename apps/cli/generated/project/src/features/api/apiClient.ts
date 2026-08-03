import axios from 'axios';
import { Note, Notebook, Tag } from '../../entities';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  async getNotebooks(): Promise<Notebook[]> {
    const res = await client.get<Notebook[]>('/notebooks');
    return res.data;
  },

  async createNotebook(data: { title: string; color?: string; parentId?: string }): Promise<Notebook> {
    const res = await client.post<Notebook>('/notebooks', data);
    return res.data;
  },

  async deleteNotebook(id: string): Promise<void> {
    await client.delete(`/notebooks/${id}`);
  },

  async getTags(): Promise<Tag[]> {
    const res = await client.get<Tag[]>('/tags');
    return res.data;
  },

  async createTag(data: { name: string; color?: string }): Promise<Tag> {
    const res = await client.post<Tag>('/tags', data);
    return res.data;
  },

  async deleteTag(id: string): Promise<void> {
    await client.delete(`/tags/${id}`);
  },

  async getNotes(params?: {
    notebookId?: string;
    tagId?: string;
    search?: string;
    favorite?: boolean;
  }): Promise<Note[]> {
    const res = await client.get<Note[]>('/notes', { params });
    return res.data;
  },

  async getNote(id: string): Promise<Note> {
    const res = await client.get<Note>(`/notes/${id}`);
    return res.data;
  },

  async createNote(data: { title?: string; content?: string; notebookId: string; tagIds?: string[] }): Promise<Note> {
    const res = await client.post<Note>('/notes', data);
    return res.data;
  },

  async updateNote(id: string, data: Partial<Note> & { tagIds?: string[] }): Promise<Note> {
    const res = await client.put<Note>(`/notes/${id}`, data);
    return res.data;
  },

  async deleteNote(id: string): Promise<void> {
    await client.delete(`/notes/${id}`);
  },
};