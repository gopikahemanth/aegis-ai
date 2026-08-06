import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { artworkService } from '../services/artworkService';

const schema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  description: z.string().min(10),
  imageUrl: z.string().url(),
  category: z.string().min(1)
});

export const ArtworkForm: React.FC<any> = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: any) => {
    await artworkService.uploadArtwork(data);
    alert('Artwork added successfully');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 bg-slate-900 rounded-xl">
      <input {...register('title')} placeholder="Title" className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg" />
      {errors.title && <p className="text-red-500 text-sm">Title is required</p>}
      
      <input {...register('artist')} placeholder="Artist" className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg" />
      <textarea {...register('description')} placeholder="Description" className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg" />
      
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
        Save Artwork
      </button>
    </form>
  );
};