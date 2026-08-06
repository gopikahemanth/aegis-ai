import { useState, useEffect } from 'react';

export const useGallery = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ search, category });
        const response = await fetch(`/api/artworks?${query.toString()}`);
        const data = await response.json();
        setArtworks(data);
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchArtworks, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return { artworks, loading, search, setSearch, category, setCategory };
};