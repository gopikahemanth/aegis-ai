import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export const MatchOverview: React.FC<any> = ({ score, matched }) => {
  const data = [
    { subject: 'Skills', A: score, fullMark: 100 },
    { subject: 'Relevance', A: Math.min(score + 10, 100), fullMark: 100 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" />
            <Radar name="Match" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6">
        <p className="text-4xl font-bold text-indigo-400">{score}% Match Score</p>
        <p className="text-slate-400 mt-2">Found {matched.length} matching keywords.</p>
      </div>
    </div>
  );
};
export default MatchOverview;
