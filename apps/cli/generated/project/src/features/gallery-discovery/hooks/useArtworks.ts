import { useQuery } from '@tanstack/react-query';
import { artworkService } from '../../artwork-management/services/artworkService';

export const useArtworks = (category: string = 'all') => {
  return useQuery({
    queryKey: ['artworks', category],
    queryFn: () => artworkService.fetchArtworks(category),
    placeholderData: (prev: any) => prev,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};