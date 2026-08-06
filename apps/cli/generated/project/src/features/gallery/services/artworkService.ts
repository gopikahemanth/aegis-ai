import axios from 'axios';
// Assuming the file exists at src/entities/artwork.ts
import { Artwork } from '../../../../entities/artwork'; 

const api = axios.create({ baseURL: '/api' });

export const fetchArtworks = async (params: { 
  search?: string; 
  category?: string; 
  sortBy?: string 
}): Promise<Artwork[]> => {
  const { data } = await api.get('/artworks', { params });
  return data;
};