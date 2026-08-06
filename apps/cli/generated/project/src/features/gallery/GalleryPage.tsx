import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArtworkGrid } from './components/ArtworkGrid';
import { fetchArtworks } from '../../services/api';

export default function GalleryPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artworks'],
    queryFn: () => fetchArtworks({}),
  });

  if (error) return <div className="text-red-500">Error loading gallery. Please try again.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Aegis Art Gallery</h1>
      <Suspense fallback={<div className="h-64 animate-pulse bg-slate-800 rounded-xl" />}>
        <ArtworkGrid artworks={data || []} loading={isLoading} />
      </Suspense>
    </div>
  );
}