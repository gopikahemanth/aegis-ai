import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const performScan = async (data: FormData) => {
  const { data: response } = await api.post('/scan', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response;
};

export const fetchHistory = async () => {
  const { data } = await api.get('/history');
  return data;
};
export { api };

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
