import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface Props {
  score: number;
}

export const MatchVisualization: React.FC<any> = ({ score }) => {
  const data = [
    { name: 'Match', value: score },
    { name: 'Gap', value: 100 - score },
  ];

  const COLORS = ['#8b5cf6', '#27272a'];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl"
    >
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">Match Score</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-3xl font-bold text-violet-400">{score}%</p>
    </motion.div>
  );
};
export default MatchVisualization;

export type { Props };
