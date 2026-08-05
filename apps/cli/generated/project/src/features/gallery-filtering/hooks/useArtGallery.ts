import { useState, useEffect } from 'react';
import axios from 'axios';

export const useArtGallery = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/artworks?search=${search}`);
        setArtworks(res.data);
      } catch (err) {
        console.error('Error fetching artworks', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  return { artworks, loading, search, setSearch };
};