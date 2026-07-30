import React from 'react';
import { TelemetryData, LogEntry } from '../types';
import { Activity, Thermometer, ShieldCheck, Zap, Wind, Droplets, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TelemetryDeepDivePageProps {
  telemetry: TelemetryData;
  logs: LogEntry[];
}

export const TelemetryDeepDivePage: React.FC<TelemetryDeepDivePageProps> = ({ telemetry, logs }) => {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Telemetry & Subsystem Diagnostics</h1>
        <p className="text-xs sm:text-sm text-slate-400">Real-time telemetry feeds, quantum core harmonics, and subsystem logs</p>
      </div>

      {/* Grid of Telemetry Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Hull Temperature</span>
            <Thermometer className="w-5 h-5 text-stellar-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold font-mono text-white">{telemetry.hullTemp}</h3>
            <span className="text-xs text-stellar-400 font-mono">°C</span>
          </div>
          <div className="text-xs text-slate-400">External thermal shielding active</div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Radiation Shield</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold font-mono text-white">{telemetry.radiationShield}</h3>
            <span className="text-xs text-emerald-400 font-mono">%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${telemetry.radiationShield}%` }}></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Quantum Core</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold font-mono text-white">{telemetry.warpCoreOutput}</h3>
            <span className="text-xs text-amber-400 font-mono">GW</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${telemetry.warpCoreOutput}%` }}></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Oxygen Reserves</span>
            <Droplets className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold font-mono text-white">{telemetry.oxygenLevels}</h3>
            <span className="text-xs text-cyan-400 font-mono">%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.oxygenLevels}%` }}></div>
          </div>
        </div>
      </div>

      {/* Advanced Telemetry Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold text-white">Subspace Ion Drive & Flux Waveform</h3>
          <div className="h-64 rounded-2xl bg-space-950/80 border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="flex justify-between items-center z-10 text-xs font-mono text-slate-400">
              <span>FREQUENCY: 4.82 GHz</span>
              <span className="text-emerald-400 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Harmonic Lock</span>
            </div>

            {/* Simulated oscilloscope wave */}
            <div className="relative z-10 flex items-center justify-center h-32">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 100">
                <path
                  d="M 0 50 Q 75 10, 150 50 T 300 50 T 450 50 T 600 50"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  className="opacity-80"
                />
                <path
                  d="M 0 50 Q 75 90, 150 50 T 300 50 T 450 50 T 600 50"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  className="opacity-80"
                />
              </svg>
            </div>

            <div className="flex justify-between z-10 text-[10px] font-mono text-slate-500">
              <span>-500ms</span>
              <span>-250ms</span>
              <span>LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-space-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-mono">Ion Thrust</span>
              <p className="text-xl font-bold text-white font-mono mt-1">{telemetry.ionEngineThrust} kN</p>
            </div>
            <div className="p-4 rounded-2xl bg-space-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-mono">Solar Flux</span>
              <p className="text-xl font-bold text-white font-mono mt-1">{telemetry.solarFlux} W/m²</p>
            </div>
            <div className="p-4 rounded-2xl bg-space-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-mono">Fuel Reserves</span>
              <p className="text-xl font-bold text-white font-mono mt-1">{telemetry.fuelReserves}%</p>
            </div>
          </div>
        </div>

        {/* System Logs Feed */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 flex flex-col">
          <h3 className="text-lg font-bold text-white">System Diagnostics Log</h3>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
            {logs.map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-space-950/80 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    log.level === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.level === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400' :
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
        </div>
      </div>
    </div>
  );
};