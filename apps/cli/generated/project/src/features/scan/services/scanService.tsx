import { apiClient } from '@/services/apiClient';

export interface ScanResult {
  id: number;
  jobTitle: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  createdAt: string;
}

export const scanService = {
  processResume: async (formData: FormData): Promise<ScanResult> => {
    const { data } = await apiClient.post('/api/scan/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  getHistory: async (): Promise<ScanResult[]> => {
    const { data } = await apiClient.get('/api/scan/history');
    return data;
  }
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
