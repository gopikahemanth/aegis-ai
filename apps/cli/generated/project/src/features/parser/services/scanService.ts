import axios from 'axios';

export const scanService = {
  uploadAndAnalyze: async (file: File, jobDescription: string) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    const { data } = await axios.post('/api/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
