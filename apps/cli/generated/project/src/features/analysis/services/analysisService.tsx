import { apiClient } from '../../../services/api';
import AnalysisResult from "../../../entities/Analysis";

export const analyzeResume = async (formData: FormData): Promise<AnalysisResult> => {
  const { data } = await apiClient.post<AnalysisResult>('/api/scanner/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const fetchHistory = async (): Promise<AnalysisResult[]> => {
  const { data } = await apiClient.get<AnalysisResult[]>('/api/history');
  return data;
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
