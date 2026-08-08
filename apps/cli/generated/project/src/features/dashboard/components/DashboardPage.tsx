import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardView } from './DashboardView';

interface AnalysisData {
  matchScore: number;
  missingKeywords: string[];
  resumeFileName: string;
}

const fetchAnalysisHistory = async (): Promise<AnalysisData[]> => {
  const response = await fetch('/api/analysis/history');
  if (!response.ok) {
    throw new Error('Failed to fetch analysis history');
  }
  return response.json();
};

export const DashboardPage: React.FC<any> = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analysis-history'],
    queryFn: fetchAnalysisHistory,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-400">
        Error loading dashboard data. Please try again later.
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: `Resume ${index + 1}`,
    matchScore: item.matchScore,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
      <DashboardView data={chartData} />
    </div>
  );
};

export default DashboardPage;
export type { AnalysisData };
