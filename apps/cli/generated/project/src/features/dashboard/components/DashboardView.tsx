import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const DashboardView = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resume-scans'],
    queryFn: () => api.get('/submissions').then(res => res.data)
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-zinc-800 rounded-lg" />;
  if (error) return <div className="text-red-500">Failed to load Resume Scans.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-100">ResumeScan Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* KPI Cards (Total Scans, Average Match Score, etc.) */}
      </div>
    </div>
  );
};

export default DashboardView;
export { DashboardView };
