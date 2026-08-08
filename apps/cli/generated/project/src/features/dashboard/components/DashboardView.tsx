import React, { useMemo } from 'react';
import { Card } from '@/shared/components/Card';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

interface DashboardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  data: { name: string; matchScore: number }[];
}

export const DashboardView: React.FC<any> = ({ data }) => {
  const averageScore = useMemo(() => 
    data.length > 0 
      ? data.reduce((acc, curr) => acc + curr.matchScore, 0) / data.length 
      : 0
  , [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <Card title="Total Resumes Analyzed">
        <p className="text-4xl font-bold text-white">{data.length}</p>
      </Card>
      <Card title="Average Match Score">
        <p className="text-4xl font-bold text-blue-500">{averageScore.toFixed(0)}%</p>
      </Card>
      <div className="col-span-1 md:col-span-2 h-64 bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="matchScore" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.matchScore > 70 ? '#22c55e' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default DashboardView;

export type { DashboardProps };
