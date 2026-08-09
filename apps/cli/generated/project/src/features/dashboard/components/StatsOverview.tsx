import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  matchScore: number;
  totalScans: number;
}

export const StatsOverview: React.FC<any> = ({ matchScore, totalScans }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 border border-slate-200 rounded-lg bg-white shadow-sm"
    >
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Average Match Score</h3>
      <p className="text-4xl font-bold mt-2 text-slate-900">{matchScore}%</p>
    </motion.div>
    
    <div className="p-8 border border-slate-200 rounded-lg bg-white shadow-sm">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Scans Performed</h3>
      <p className="text-4xl font-bold mt-2 text-slate-900">{totalScans}</p>
    </div>
  </div>
);
export default StatsOverview;

export type { Props };
