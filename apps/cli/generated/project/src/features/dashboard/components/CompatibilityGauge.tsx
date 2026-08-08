import React from 'react';
import { motion } from 'framer-motion';

interface CompatibilityGaugeProps {
  score: number;
}

export const CompatibilityGauge = ({ score }: CompatibilityGaugeProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Compatibility Score</h3>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full rotate-[-90deg]">
          <circle cx="64" cy="64" r="56" className="stroke-slate-800" strokeWidth="8" fill="none" />
          <motion.circle 
            cx="64" cy="64" r="56" 
            className="stroke-blue-500" 
            strokeWidth="8" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: score / 100 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
          {score}%
        </div>
      </div>
    </div>
  );
};

export default CompatibilityGauge;