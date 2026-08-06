import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchArtworks = async (params: Record<string, any>) => {
  const { data } = await apiClient.get('/artworks', { params });
  return data;
};