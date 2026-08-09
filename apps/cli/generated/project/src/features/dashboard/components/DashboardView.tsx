import React, { useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { motion } from 'framer-motion';

interface DashboardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
  matches: number;
  total: number;
}

export const DashboardView: React.FC<any> = ({ score, matches, total }) => {
  const data = useMemo(() => [{ name: 'Match', value: score, fill: '#6366f1' }], [score]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8"
    >
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 col-span-1">
        <h2 className="text-sm font-medium text-slate-400">Match Score</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart data={data} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={450}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background dataKey="value" />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-4xl font-bold text-white text-center">{score}%</p>
      </div>
      
      <div className="col-span-2 space-y-6">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-semibold text-white">Analysis Summary</h3>
          <p className="text-slate-400 mt-2">Matched {matches} of {total} identified technical keywords.</p>
        </div>
      </div>
    </motion.div>
  );
};
export default DashboardView;

export type { DashboardProps };
