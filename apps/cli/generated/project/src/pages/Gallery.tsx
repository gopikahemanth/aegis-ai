import React from 'react';
import { ArtworkGrid } from '../features/gallery/components/ArtworkGrid';
import { useArtGallery } from '../features/gallery/hooks/useArtGallery';

export default function GalleryPage() {
  const { artworks, loading, search, setSearch, category, setCategory } = useArtGallery();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="p-8 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tighter">Aegis Gallery</h1>
        <div className="flex gap-4">
          <input 
            placeholder="Search artworks..." 
            className="bg-slate-900 border border-slate-800 rounded-md px-4 py-2"
            value={search ?? ''}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="bg-slate-900 border border-slate-800 rounded-md px-4 py-2"
            value={category ?? 'ALL'}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {/* Add category mapping logic here */}
          </select>
        </div>
      </header>
      <main>
        <ArtworkGrid artworks={artworks ?? []} loading={loading} />
      </main>
    </div>
  );
}