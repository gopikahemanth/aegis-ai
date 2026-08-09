import axios from 'axios';

export const scanService = {
  uploadAndAnalyze: async (formData: FormData) => {
    const { data } = await axios.post('/api/scan/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  
  getHistory: async () => {
    const { data } = await axios.get('/api/scan/history');
    return data;
  }
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
