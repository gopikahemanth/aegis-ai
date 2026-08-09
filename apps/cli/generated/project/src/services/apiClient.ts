import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

export const api: any = (globalThis as any).api || (globalThis as any).apiClient || { get: async () => ({ data: [] }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }), patch: async () => ({ data: {} }) };

const _apiDefaultShim = (globalThis as any).api || (globalThis as any).apiClient || { get: async () => ({ data: [] }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }), patch: async () => ({ data: {} }) };
export default _apiDefaultShim;
