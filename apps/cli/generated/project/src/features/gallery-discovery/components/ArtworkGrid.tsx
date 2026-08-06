import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/utils/apiClient';
import { ArtworkCard } from './ArtworkCard';

export const ArtworkGrid: React.FC<any> = ({ filter }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artworks', filter],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/artworks?category=${filter}`);
      return data.data;
    }
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
    {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-800 rounded-xl" />)}
  </div>;

  if (error) return <div className="text-red-500">Error loading gallery.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {data?.map((art: any) => (
        <ArtworkCard key={art.id} artwork={art} />
      ))}
    </div>
  );
};