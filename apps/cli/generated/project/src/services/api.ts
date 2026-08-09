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
