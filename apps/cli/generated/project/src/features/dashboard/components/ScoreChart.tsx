import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const ScoreChart: React.FC<any> = ({ score }) => {
  const data = useMemo(() => [
    { name: 'Match', value: score },
    { name: 'Gap', value: 100 - score },
  ], [score]);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            <Cell fill="#3b82f6" />
            <Cell fill="#1e293b" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center font-bold text-2xl mt-2">{score}% Match</div>
    </div>
  );
};
export default ScoreChart;
