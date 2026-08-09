import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
}

export const ScanOverviewCard: React.FC<any> = ({ title, value, trend, icon }) => {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {icon && <div className="text-indigo-400">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend && <span className="text-xs text-emerald-400 font-medium">{trend}</span>}
      </div>
    </motion.div>
  );
};
export default ScanOverviewCard;

export type { Props };
