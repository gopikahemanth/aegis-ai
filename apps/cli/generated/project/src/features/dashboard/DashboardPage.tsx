import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { MatchScoreChart } from '../../components/MatchScoreChart';
import { EmptyState } from '../../shared/components/EmptyState';

const DashboardPage: React.FC<any> = () => {
  const { data: scans, isLoading, error } = useQuery({
    queryKey: ['resumeScans'],
    queryFn: async () => {
      const res = await fetch('/api/scans');
      if (!res.ok) throw new Error('Failed to fetch scans');
      return res.json();
    }
  });

  if (isLoading) return <div className="p-8">Loading your analysis...</div>;
  if (error) return <div className="text-red-500">Failed to load dashboard. <button onClick={() => window.location.reload()}>Retry</button></div>;

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">ResumeScan Overview</h1>
        <p className="text-slate-500">Track match scores and professional growth metrics</p>
      </header>

      {scans?.length === 0 ? (
        <EmptyState 
          title="No scans yet" 
          message="Upload your first resume and job description to get started." 
          cta="Upload Resume"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {scans.map((scan: any) => (
             <div key={scan.id} className="bg-white p-6 border border-slate-200 rounded-xl hover:shadow-lg transition-shadow">
               <h3 className="font-semibold text-lg">{scan.title}</h3>
               <MatchScoreChart score={scan.matchScore} />
             </div>
           ))}
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;
export { DashboardPage };
