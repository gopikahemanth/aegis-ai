import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatedMatchScoreGauge } from '@/shared/components/AnimatedMatchScoreGauge';

export const Dashboard = () => {
  const { data, isLoading } = useQuery({ 
    queryKey: ['scans'], 
    queryFn: () => fetch('/api/scans').then(res => res.json()) 
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Resume Scan Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data?.map((scan: any) => (
          <AnimatedMatchScoreGauge 
            key={scan.id}
            matchScore={scan.matchScore}
            foundKeywords={scan.foundKeywords}
            missingKeywords={scan.missingKeywords}
          />
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
