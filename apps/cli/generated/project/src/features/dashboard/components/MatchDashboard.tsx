import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  score: number;
}

export const MatchDashboard: React.FC<any> = ({ score }) => {
  const data = useMemo(() => [
    { name: 'Match', value: score },
    { name: 'Gap', value: 100 - score }
  ], [score]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">Analysis Result</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
              <Cell fill="#8b5cf6" />
              <Cell fill="#27272a" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center">
        <span className="text-4xl font-bold text-violet-500">{score}%</span>
        <p className="text-zinc-400 text-sm mt-1">Match Score</p>
      </div>
    </div>
  );
};
export default MatchDashboard;

export type { Props };
