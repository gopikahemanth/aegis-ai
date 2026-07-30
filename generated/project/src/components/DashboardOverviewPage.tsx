import React, { useState } from 'react';
import { Mission, TelemetryData, LogEntry } from '../types';
import { 
  Rocket, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Thermometer, 
  Wind, 
  Zap, 
  Gauge,
  Calendar,
  Compass
} from 'lucide-react';

interface DashboardOverviewPageProps {
  missions: Mission[];
  telemetry: TelemetryData;
  logs: LogEntry[];
  onNavigate: (route: any) => void;
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({
  missions,
  telemetry,
  logs,
  onNavigate
}) => {
  const activeMissionsCount = missions.filter(m => m.status === 'Active' || m.status === 'En Route' || m.status === 'Orbiting').length;
  const criticalCount = missions.filter(m => m.status === 'Critical').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 border border-slate-800 bg-gradient-to-r from-space-900/90 via-space-900/60 to-nebula-950/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-nebula-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 bottom-0 w-80 h-80 bg-stellar-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stellar-500/10 border border-stellar-500/30 text-stellar-400 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-stellar-400 animate-pulse"></span>
            <span>All Deep Space Array Nodes Synchronized</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-3">
            Welcome back, Commander.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Sector telemetry is optimal. 5 active interstellar missions are currently reporting normal subspace transmissions. Solar weather indices remain stable.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('/missions')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-nebula-600 to-nebula-500 text-white font-medium text-sm shadow-lg shadow-nebula-500/25 hover:from-nebula-500 hover:to-nebula-400 transition-all flex items-center space-x-2"
            >
              <Rocket className="w-4 h-4" />
              <span>Inspect Active Missions</span>
            </button>
            <button
              onClick={() => onNavigate('/starmap')}
              className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm transition-all flex items-center space-x-2"
            >
              <Compass className="w-4 h-4 text-stellar-400" />
              <span>Open Star Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-nebula-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Active Missions</span>
            <div className="w-10 h-10 rounded-xl bg-nebula-500/10 border border-nebula-500/30 flex items-center justify-center text-nebula-400 group-hover:scale-110 transition-transform">
              <Rocket className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <h3 className="text-3xl font-bold font-mono text-white">{activeMissionsCount}</h3>
            <span className="text-xs text-emerald-400 font-mono flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +1 this month
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">All fleets reporting nominal telemetry</p>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-stellar-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Hull Temperature</span>
            <div className="w-10 h-10 rounded-xl bg-stellar-500/10 border border-stellar-500/30 flex items-center justify-center text-stellar-400 group-hover:scale-110 transition-transform">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <h3 className="text-3xl font-bold font-mono text-white">{telemetry.hullTemp}°C</h3>
            <span className="text-xs text-stellar-400 font-mono">Stable</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-stellar-500 to-nebula-500 h-full rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Radiation Shield</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <h3 className="text-3xl font-bold font-mono text-white">{telemetry.radiationShield}%</h3>
            <span className="text-xs text-emerald-400 font-mono">Optimal</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${telemetry.radiationShield}%` }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Quantum Core</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <h3 className="text-3xl font-bold font-mono text-white">{telemetry.warpCoreOutput}%</h3>
            <span className="text-xs text-amber-400 font-mono">Nominal</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${telemetry.warpCoreOutput}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Missions Summary */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Active Missions Status</h3>
              <p className="text-xs text-slate-400">Real-time telemetry and progression of flagship fleets</p>
            </div>
            <button
              onClick={() => onNavigate('/missions')}
              className="text-xs font-mono text-stellar-400 hover:text-stellar-350 transition-colors"
            >
              View All ({missions.length}) →
            </button>
          </div>

          <div className="space-y-4">
            {missions.slice(0, 4).map(mission => (
              <div key={mission.id} className="p-4 rounded-2xl bg-space-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-white text-sm">{mission.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      mission.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      mission.status === 'En Route' ? 'bg-stellar-500/10 text-stellar-400 border-stellar-500/30' :
                      mission.status === 'Orbiting' ? 'bg-nebula-500/10 text-nebula-400 border-nebula-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {mission.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{mission.destination} • Code: <span className="font-mono text-slate-300">{mission.codeName}</span></p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="w-32">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-slate-200">{mission.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-nebula-500 to-stellar-400 h-full rounded-full" style={{ width: `${mission.progress}%` }}></div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 hidden sm:block">{mission.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: System Telemetry Log Stream */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Subspace Log Stream</h3>
              <p className="text-xs text-slate-400">Autonomous telemetry diagnostics</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
            {logs.slice(0, 6).map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-space-950/80 border border-slate-800/60 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    log.level === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.level === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
                    log.level === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-stellar-500/10 text-stellar-400'
                  }`}>
                    {log.system}
                  </span>
                  <span className="text-slate-500">{log.timestamp}</span>
                </div>
                <p className="text-slate-300 font-sans">{log.message}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('/telemetry')}
            className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-xs font-mono text-slate-200 transition-colors text-center"
          >
            Open Full Telemetry Suite →
          </button>
        </div>
      </div>
    </div>
  );
};