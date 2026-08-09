import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const resumeService = {
  analyze: async (formData: FormData) => {
    const { data } = await api.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  getHistory: async () => {
    const { data } = await api.get('/history');
    return data;
  }
};
export { api };

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

export const apiClient: any = (globalThis as any).apiClient || (globalThis as any).api || { get: async () => ({ data: [] }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }), patch: async () => ({ data: {} }) };

const _apiDefaultShim = (globalThis as any).api || (globalThis as any).apiClient || { get: async () => ({ data: [] }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }), patch: async () => ({ data: {} }) };
export default _apiDefaultShim;
