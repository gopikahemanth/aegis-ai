import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../shared/components/ui/Card';

const DashboardPage: React.FC<any> = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => (await fetch('/api/scans')).json()
  });

  if (isLoading) return <div className="p-8 text-center">Loading scan data...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading dashboard</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Resume Scan Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Scans" value={data?.length || 0} />
        <Card title="Average Match" value={`${Math.round(data?.reduce((acc: any, s: any) => acc + s.matchScore, 0) / data?.length) || 0}%`} />
      </div>
      {/* List rendered with virtualization in production */}
    </div>
  );
};

export default DashboardPage;
export { DashboardPage };
