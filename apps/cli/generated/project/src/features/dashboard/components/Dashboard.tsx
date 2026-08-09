import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../design-system/components/Button';

const AnalysisList = React.lazy(() => import('./AnalysisList'));

export const Dashboard: React.FC<any> = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['resumeScans'],
    queryFn: () => fetch('/api/scans').then(res => res.json())
  });

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Resume Analysis Dashboard</h1>
        <Button onClick={() => window.location.href = '/upload'}>Upload Resume</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h3 className="text-zinc-400 text-sm">Total Scans</h3>
          <p className="text-3xl font-semibold mt-2">{data?.length || 0}</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-4">Recent ResumeScans</h2>
        <Suspense fallback={<div>Loading history...</div>}>
          <AnalysisList data={data} isLoading={isLoading} />
        </Suspense>
      </section>
    </div>
  );
};
export default Dashboard;
