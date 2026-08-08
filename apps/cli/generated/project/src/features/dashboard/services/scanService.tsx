import { api } from '@/services/api';

export interface ScanResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export const runScan = async (formData: FormData): Promise<ScanResult> => {
  const { data } = await api.post('/api/scan/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data.data;
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
