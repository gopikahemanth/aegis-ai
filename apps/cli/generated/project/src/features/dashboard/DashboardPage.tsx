import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { MetricCard } from './components/MetricCard';
import { ScanHistoryTable } from '../history/components/ScanHistoryTable';

const DashboardPage: React.FC<any> = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => fetch('/api/scans/metrics').then(res => res.json())
  });

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Scan Dashboard</h1>
      </header>
      
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Scans" value={data?.total ?? 0} />
        <MetricCard label="Avg. Match Score" value={`${data?.avgScore ?? 0}%`} />
        <MetricCard label="Active Jobs" value={data?.activeJobs ?? 0} />
        <MetricCard label="This Month" value={data?.monthly ?? 0} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Scan History</h2>
        <ScanHistoryTable />
      </section>
    </Layout>
  );
};

export default DashboardPage;
export { DashboardPage };
