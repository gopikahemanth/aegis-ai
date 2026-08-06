import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Artwork {
  id: number;
  title: string;
  artistName: string;
  imageUrl: string;
  price: number;
}

export const ArtworkGrid = ({ artworks, loading }: { artworks: Artwork[], loading: boolean }) => {
  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 animate-pulse">
    {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-800 rounded-lg" />)}
  </div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
      <AnimatePresence>
        {artworks.map((art) => (
          <motion.div 
            key={art.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
          >
            <img src={art.imageUrl} alt={art.title} className="w-full h-64 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-white">{art.title}</h3>
              <p className="text-sm text-slate-400">{art.artistName}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-blue-400 font-bold">${art.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};