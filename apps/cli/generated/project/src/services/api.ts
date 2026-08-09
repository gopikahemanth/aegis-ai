import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const scanResume = async (file: File, jobDescription: string) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('jobDescription', jobDescription);

  const { data } = await api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
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
