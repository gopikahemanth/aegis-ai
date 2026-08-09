import React from 'react';
import { motion } from 'framer-motion';

interface MetricsGridProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  totalScans: number;
  averageMatchScore: number;
}

export const MetricsGrid: React.FC<any> = ({ totalScans, averageMatchScore }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-slate-900 border border-slate-800 rounded-2xl"
    >
      <h3 className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total ResumeScans</h3>
      <p className="text-4xl font-bold text-white mt-2">{totalScans}</p>
    </motion.div>
    
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
      <h3 className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Average Match Score</h3>
      <p className="text-4xl font-bold text-indigo-400 mt-2">{averageMatchScore}%</p>
    </div>
  </div>
);
export default MetricsGrid;

export type { MetricsGridProps };
