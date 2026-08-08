import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentScans } from '../services/ScanService';

const DashboardView = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recent-scans'],
    queryFn: fetchRecentScans
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />;
  if (error) return <div className="text-red-600">Failed to load history.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Scan Summary</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Scans" value={data?.length || 0} />
        {/* Additional KPI cards */}
      </div>
      
      <section className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Recent Scan History</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {data?.map((scan: any) => (
            <div key={scan.id} className="p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-medium">{scan.fileName}</span>
                <span className="text-indigo-600 font-bold">{scan.matchScore}% Match</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const MetricCard = (props: any) => (
  <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
    <p className="text-sm text-slate-500 mb-1">{title}</p>
    <p className="text-3xl font-extrabold text-slate-900">{value}</p>
  </div>
);

export default DashboardView;
export { DashboardView };
