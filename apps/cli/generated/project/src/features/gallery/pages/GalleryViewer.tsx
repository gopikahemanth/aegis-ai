import React, { Suspense, lazy } from 'react';
import { useArtGallery } from '../hooks/useArtGallery';

const ArtworkGrid = lazy(() => import('../components/ArtworkGrid').then(module => ({ default: module.ArtworkGrid })));

export const GalleryViewer = () => {
  const { artworks, loading, search, setSearch } = useArtGallery();

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Gallery Collection</h1>
        <input
          type="search"
          placeholder="Search by title or artist..."
          className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
          value={search ?? ''}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <Suspense fallback={<div className="h-64 animate-pulse bg-slate-800" />}>
        <ArtworkGrid artworks={artworks || []} loading={loading} />
      </Suspense>
    </main>
  );
};