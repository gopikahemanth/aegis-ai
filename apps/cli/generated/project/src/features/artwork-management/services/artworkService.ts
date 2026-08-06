import { apiClient } from '@/shared/utils/apiClient';
import { z } from 'zod';

export const ArtworkSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  categoryId: z.number()
});

export const artworkService = {
  fetchArtworks: async (category?: string) => {
    const { data } = await apiClient.get(`/api/artworks${category ? `?category=${category}` : ''}`);
    return data.data;
  },
  
  uploadArtwork: async (formData: unknown) => {
    const { data } = await apiClient.post('/api/artworks', formData);
    return data;
  }
};