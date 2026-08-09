import axios from 'axios';

export const uploadResume = async (file: File, jobDescription: string) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('jobDescription', jobDescription);

  const response = await axios.post('/api/scan/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data;
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
