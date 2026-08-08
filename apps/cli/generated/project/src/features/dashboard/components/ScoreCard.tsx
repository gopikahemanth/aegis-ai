import React from 'react';
import { motion } from 'framer-motion';

interface ScoreCardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
  label: string;
}

export const ScoreCard: React.FC<any> = ({ score, label }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"
    >
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</h3>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white">{score}%</span>
      </div>
      <div className="mt-4 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </motion.div>
  );
};
export default ScoreCard;

export type { ScoreCardProps };
