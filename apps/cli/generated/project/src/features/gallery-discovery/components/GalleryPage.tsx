import React, { useState } from 'react';
import { useArtworks } from '../hooks/useArtworks';
import { ArtworkCard } from './ArtworkCard';
import { SearchBar } from './SearchBar';

export const GalleryPage: React.FC<any> = () => {
  const [search, setSearch] = useState('');
  const {  data: artworks, isLoading, error  } = (useArtworks(search) as any) || {};

  if (error) return <div className="text-red-500">Error loading gallery.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Art Gallery</h1>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-800 animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artworks?.map((art) => (
            <ArtworkCard key={art.id} artwork={art} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
