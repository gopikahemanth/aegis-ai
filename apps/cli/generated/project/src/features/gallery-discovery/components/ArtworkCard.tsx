import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

interface Props {
  artwork?: {
    title?: string;
    artist?: string;
    imageUrl?: string;
  };
}

export const ArtworkCard: React.FC<any> = ({ artwork }) => {
  return (
    <article className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
      <div className="aspect-square overflow-hidden bg-slate-800">
        <LazyLoadImage
          src={artwork.imageUrl}
          alt={artwork.title}
          effect="blur"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white">{artwork.title}</h3>
        <p className="text-sm text-slate-400 mt-1">{artwork.artist}</p>
      </div>
    </article>
  );
};