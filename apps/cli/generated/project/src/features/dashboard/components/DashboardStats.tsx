import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  score: number;
  matchedCount: number;
  missingCount: number;
}

export const DashboardStats: React.FC<any> = ({ score, matchedCount, missingCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Match Score', value: `${score}%`, color: 'text-blue-500' },
        { label: 'Matched Keywords', value: matchedCount, color: 'text-emerald-500' },
        { label: 'Missing Skills', value: missingCount, color: 'text-rose-500' },
      ].map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-slate-900 border border-slate-800 p-6 rounded-lg"
        >
          <p className="text-sm text-slate-400 mb-2">{stat.label}</p>
          <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
        </motion.div>
      ))}
    </div>
  );
};
export default DashboardStats;

export type { Props };
