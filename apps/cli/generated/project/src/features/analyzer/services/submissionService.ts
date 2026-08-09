import axios from 'axios';
import { api } from '@/services/api';

export interface AnalyzePayload {
  resume: File;
  jobDescription: string;
}

export const submissionService = {
  analyze: async (payload: AnalyzePayload) => {
    const formData = new FormData();
    formData.append('resume', payload.resume);
    formData.append('jobDescription', payload.jobDescription);

    const { data } = await api.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  
  getHistory: async () => {
    const { data } = await api.get('/submissions');
    return data;
  }
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
