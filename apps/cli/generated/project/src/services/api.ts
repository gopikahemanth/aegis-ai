import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const resumeApi = {
  uploadAndAnalyze: async (resumeFile: File, jobDescription: string) => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);
    const response = await apiClient.post('/scans', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getScanHistory: async () => {
    const response = await apiClient.get('/scans');
    return response.data;
  },

  getScanById: async (id: string) => {
    const response = await apiClient.get(`/scans/${id}`);
    return response.data;
  },
};

export default apiClient;

type API_BASE_URL = any;

export { API_BASE_URL };

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

export const api: any = (globalThis as any).api || (globalThis as any).apiClient || { get: async () => ({ data: [] }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }), patch: async () => ({ data: {} }) };
