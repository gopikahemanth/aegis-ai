import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MatchScoreDial } from '@/shared/components/MatchScoreDial';
import { Layout } from '@/shared/components/Layout';
import { apiClient } from '@/services/api';

const DashboardPage: React.FC<any> = () => {
  const { data: scans, isLoading, error } = useQuery({
    queryKey: ['scan-history'],
    queryFn: () => apiClient.get('/scans').then((res) => res.data),
  });

  return (
    <Layout>
      <div className="space-y-8 p-8">
        <header>
          <h1 className="text-2xl font-bold text-white">Resume Scan Overview</h1>
          <p className="text-zinc-400">Manage your recent analysis results and career insights.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl bg-zinc-900 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="p-4 text-rose-500 bg-rose-500/10 rounded-lg">Failed to load scan metrics.</div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scans?.map((scan: any) => (
              <div key={scan.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                <h3 className="text-lg font-medium text-white mb-4">{scan.jobDescription.title}</h3>
                <MatchScoreDial score={scan.matchScore} />
              </div>
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
export { DashboardPage };
