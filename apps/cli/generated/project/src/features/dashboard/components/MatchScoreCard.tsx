import React from 'react';
import { motion } from 'framer-motion';

export const MatchScoreCard: React.FC<any> = ({ score }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
      <h3 className="text-slate-400 text-sm font-medium mb-4">ATS Compatibility Score</h3>
      <motion.div 
        initial={{ scale: 0.8 }} 
        animate={{ scale: 1 }} 
        className="text-5xl font-bold text-white mb-2"
      >
        {score}%
      </motion.div>
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className="h-full bg-indigo-500"
        />
      </div>
    </div>
  );
};
export default MatchScoreCard;
