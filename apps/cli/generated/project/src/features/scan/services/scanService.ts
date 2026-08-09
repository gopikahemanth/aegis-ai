import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const performScan = async (file: File, jobDescription: string) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('jobDescription', jobDescription);
  
  const { data } = await api.post('/scan', formData, {
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
