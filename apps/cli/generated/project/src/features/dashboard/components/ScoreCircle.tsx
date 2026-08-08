import React from 'react';
import { motion } from 'framer-motion';

export const ScoreCircle = (props: any) => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <svg className="w-full h-full rotate-[-90deg]">
      <circle cx="64" cy="64" r="56" className="stroke-zinc-800" strokeWidth="8" fill="none" />
      <motion.circle
        cx="64" cy="64" r="56"
        className="stroke-violet-500"
        strokeWidth="8"
        fill="none"
        strokeDasharray={351.8}
        initial={{ strokeDashoffset: 351.8 }}
        animate={{ strokeDashoffset: 351.8 - (351.8 * score) / 100 }}
      />
    </svg>
    <span className="absolute text-2xl font-bold">{score}%</span>
  </div>
);
export default ScoreCircle;
