import React from 'react';
import { useMetrics } from '../hooks/useMetrics';

export const ProductivityChart: React.FC = () => {
  const { stats } = useMetrics();
  const logs = stats.logs.slice(-7); // Last 7 days

  const maxMinutes = Math.max(...logs.map(l => l.focusMinutes), 120);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-sm text-slate-200">Focus Velocity</h3>
          <p className="text-xs text-slate-400">Daily focus minutes over the last week</p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs">
          Weekly Trend
        </div>
      </div>

      <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
        {logs.map((log, index) => {
          const heightPercentage = Math.min(Math.round((log.focusMinutes / maxMinutes) * 100), 100);
          const dayLabel = new Date(log.date).toLocaleDateString([], { weekday: 'short' });

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                {log.focusMinutes}m
              </span>
              <div 
                className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-xl transition-all group-hover:from-indigo-500 group-hover:to-violet-400 shadow-lg shadow-indigo-600/10"
                style={{ height: `${Math.max(heightPercentage, 8)}%` }}
              />
              <span className="text-[11px] font-medium text-slate-400 mt-1">{dayLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
        <span>Average: {Math.round(stats.totalFocusMinutes / Math.max(logs.length, 1))}m / day</span>
        <span className="text-emerald-400 font-semibold">↑ On Track</span>
      </div>
    </div>
  );
};