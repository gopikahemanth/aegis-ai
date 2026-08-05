import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Artwork } from '../../../entities/Artwork';

export const useArtGallery = () => {
  const [data, setData] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (filters: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/artworks', { params: filters });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch artworks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};