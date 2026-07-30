import React from 'react';
import { ProductivityChart } from '../components/ProductivityChart';
import { WidgetGrid } from '../components/WidgetGrid';
import { useMetrics } from '../hooks/useMetrics';

export const AnalyticsPage: React.FC = () => {
  const { stats } = useMetrics();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Productivity Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">Deep dive into your focus trends, completed deliverables, and consistency.</p>
      </div>

      <WidgetGrid />

      <div className="grid grid-cols-1 gap-8">
        <ProductivityChart />
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="font-bold text-sm text-slate-200 mb-4">Activity Logs Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Focus Minutes</th>
                <th className="pb-3 font-semibold">Pomodoros</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {stats.logs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-medium text-slate-200">{log.date}</td>
                  <td className="py-3">{log.focusMinutes} mins</td>
                  <td className="py-3">{log.pomodorosCompleted} sessions</td>
                  <td className="py-3">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Recorded
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};