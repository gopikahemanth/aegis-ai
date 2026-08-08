import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ScanService } from './services/scanService';

export const Dashboard: React.FC<any> = () => {
  const { data: scans, isLoading, error } = useQuery(['scans'], ScanService.getAll);

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />;
  if (error) return <div className="text-red-500">Error loading scan history</div>;

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Match Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scans?.slice(-5)}>
                <XAxis dataKey="createdAt" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="matchScore" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};
export default Dashboard;
