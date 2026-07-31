import React from 'react';

interface MetricsDashboardProps {
  metrics: {
    mitigatedThreats: number;
    activeShields: number;
    systemLatencyMs: number;
    accuracyPercentage: number;
  };
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  isStreaming,
  onToggleStreaming,
}) => {
  return (
    <section id="metrics" className="py-24 bg-slate-900/40 border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Telemetry Stream</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Real-Time Threat Intelligence</h2>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE FEED ACTIVE
            </span>
            <button 
              onClick={onToggleStreaming} 
              className={isStreaming ? 'px-4 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer' : 'px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors cursor-pointer'}
            >
              {isStreaming ? 'Pause Stream' : 'Resume Stream'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-4">
              <span className="text-sm font-medium">Mitigated Attacks</span>
              <i className="fa-solid fa-shield-virus text-cyan-400 text-lg"></i>
            </div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.mitigatedThreats.toLocaleString()}</div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <i className="fa-solid fa-arrow-trend-up"></i> +14.2% from last hour
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-4">
              <span className="text-sm font-medium">Active Neural Shields</span>
              <i className="fa-solid fa-network-wired text-indigo-400 text-lg"></i>
            </div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.activeShields.toLocaleString()}</div>
            <div className="text-xs text-cyan-400 mt-2 flex items-center gap-1">
              <i className="fa-solid fa-check-circle"></i> 100% Operational
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-4">
              <span className="text-sm font-medium">System Latency</span>
              <i className="fa-solid fa-gauge-high text-purple-400 text-lg"></i>
            </div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.systemLatencyMs} ms</div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <i className="fa-solid fa-bolt"></i> Ultra-low latency
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-4">
              <span className="text-sm font-medium">Detection Accuracy</span>
              <i className="fa-solid fa-bullseye text-emerald-400 text-lg"></i>
            </div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.accuracyPercentage}%</div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <i className="fa-solid fa-shield-check"></i> Zero false positives
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};