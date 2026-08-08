import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  score: number;
}

export const MatchScoreChart: React.FC<any> = ({ score }) => {
  const data = useMemo(() => [
    { name: 'Match', value: score },
    { name: 'Gap', value: 100 - score }
  ], [score]);

  return (
    <div className="h-48 w-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
            <Cell fill="#3b82f6" />
            <Cell fill="#1e293b" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
export default MatchScoreChart;

export type { Props };
