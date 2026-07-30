import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive = true, icon }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
      
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-lg shadow-inner">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between relative z-10">
        <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{value}</span>
        {change && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};