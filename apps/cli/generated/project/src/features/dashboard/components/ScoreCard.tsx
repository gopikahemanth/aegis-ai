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

export const ScoreCard: React.FC<any> = ({ score, label }) => (
  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
    <h3 className="text-slate-400 text-sm font-medium mb-2">{label}</h3>
    <div className="text-4xl font-bold text-white mb-4">{score}%</div>
    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className="h-full bg-indigo-500"
      />
    </div>
  </div>
);
export default ScoreCard;

export type { ScoreCardProps };
