import React, { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';

interface Props {
  score: number;
}

export const MatchRadarChart: React.FC<any> = ({ score }) => {
  const data = useMemo(() => [
    { subject: 'Match Accuracy', value: score, fullMark: 100 },
  ], [score]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8' }} />
          <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default MatchRadarChart;

export type { Props };
