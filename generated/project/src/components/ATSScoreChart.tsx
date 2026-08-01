import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisCategories } from '../types';

interface ATSScoreChartProps {
  categories: AnalysisCategories;
}

export const ATSScoreChart: React.FC<ATSScoreChartProps> = ({ categories }) => {
  const data = [
    { name: 'Keywords', score: categories.keywords },
    { name: 'Skills', score: categories.skills },
    { name: 'Experience', score: categories.experience },
    { name: 'Education', score: categories.education },
    { name: 'Formatting', score: categories.formatting },
  ];

  return (
    <div className="w-full h-80 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
      <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wider mb-2">Score Breakdown Categories</h3>
      <div className="w-full flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={90} tick={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }} 
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.score >= 75 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};