import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  matchScore: number;
  matchedCount: number;
  missingCount: number;
}

export const MatchDashboard: React.FC<any> = ({ matchScore, matchedCount, missingCount }) => {
  const data = useMemo(() => [
    { name: 'Matched', value: matchedCount },
    { name: 'Missing', value: missingCount },
  ], [matchedCount, missingCount]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Analysis Summary</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
              <Cell fill="#4f46e5" />
              <Cell fill="#e11d48" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center">
        <p className="text-4xl font-bold text-indigo-600">{matchScore}%</p>
        <p className="text-sm text-slate-500">Skill Alignment Score</p>
      </div>
    </div>
  );
};
export default MatchDashboard;

export type { Props };
