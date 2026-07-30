import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatPercent } from '../utils/formatters';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  gradient?: string;
  borderColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  gradient = 'from-indigo-600 to-purple-600',
  borderColor = 'border-slate-800/80',
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={`bg-slate-900/60 backdrop-blur-xl border ${borderColor} rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-indigo-500/20 transition-all" />
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight mb-2">
        {value}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-bold font-mono px-2 py-0.5 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {formatPercent(change)}
          </span>
          <span className="text-slate-400 font-medium">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};