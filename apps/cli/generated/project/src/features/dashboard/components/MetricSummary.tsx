import React from 'react';
import { Card } from '@/shared/components/Card';

interface MetricSummaryProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  totalScans: number;
  averageScore: number;
}

export const MetricSummary: React.FC<any> = ({ totalScans, averageScore }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="p-6">
        <h3 className="text-sm font-medium text-slate-400">Total Scans Performed</h3>
        <p className="text-3xl font-bold text-white mt-2">{totalScans}</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-medium text-slate-400">Average Match Score</h3>
        <p className="text-3xl font-bold text-indigo-400 mt-2">{averageScore}%</p>
      </Card>
    </div>
  );
};
export default MetricSummary;

export type { MetricSummaryProps };
