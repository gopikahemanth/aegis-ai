import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../shared/components/ui/Card';
import { Skeleton } from '../../shared/components/ui/Skeleton';

const DashboardPage: React.FC<any> = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['scans'],
    queryFn: () => fetch('/api/scans').then(res => res.json())
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) return <div className="text-red-500">Failed to load dashboard.</div>;

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Scan Dashboard</h1>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-400">Total Scans</h3>
          <p className="text-3xl font-bold text-white mt-2">{data?.length || 0}</p>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Results</h2>
        {/* Render list implementation here */}
      </section>
    </div>
  );
};

export default DashboardPage;
export { DashboardPage };
