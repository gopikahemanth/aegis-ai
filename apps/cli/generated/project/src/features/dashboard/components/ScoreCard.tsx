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
    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
      <h3 className="text-slate-400 text-sm font-medium mb-2">{label}</h3>
      <div className="text-4xl font-bold text-white">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {score}%
        </motion.span>
      </div>
      <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
export default ScoreCard;

export type { ScoreCardProps };
