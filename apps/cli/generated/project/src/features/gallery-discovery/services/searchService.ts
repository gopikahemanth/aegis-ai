import Fuse from 'fuse.js';
import { Artwork } from '@/entities/artwork';

export const createSearchIndex = (artworks: Artwork[]) => {
  return new Fuse(artworks, {
    keys: ['title', 'artist', 'description', 'category.name'],
    threshold: 0.3,
  });
};

export const filterArtworks = (
  artworks: Artwork[],
  query: string,
  categorySlug: string
): Artwork[] => {
  let result = artworks;

  // Filter by category slug if provided and not 'All'
  if (categorySlug && categorySlug !== 'All') {
    result = result.filter((art) => art.category?.slug === categorySlug);
  }

  // If query exists, perform fuzzy search on the already filtered result set
  if (query && query.trim() !== '') {
    const fuse = createSearchIndex(result);
    return fuse.search(query).map((res) => res.item);
  }

  return result;
};