import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export const MatchRadar = (props: any) => {
  const data = [{ subject: 'Match Accuracy', A: score, fullMark: 100 }];

  return (
    <div className="h-[300px] w-full bg-slate-900/50 rounded-xl p-4 border border-slate-800">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" />
          <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default MatchRadar;
