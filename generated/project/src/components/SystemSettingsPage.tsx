import React, { useState } from 'react';
import { Settings, Shield, Cpu, Wifi, Database, CheckCircle2, RefreshCw } from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const [telemetryInterval, setTelemetryInterval] = useState('1000ms');
  const [encryptionLevel, setEncryptionLevel] = useState('Quantum 512-bit');
  const [autoSync, setAutoSync] = useState(true);
  const [aiDiagnosticAgent, setAiDiagnosticAgent] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System & Telemetry Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400">Configure core array protocols, quantum encryption, and telemetry stream frequency</p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-3 text-xs font-mono">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>System configuration parameters successfully synchronized across deep space relay nodes.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Settings */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-stellar-400" />
            <span>Array Command Protocols</span>
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Telemetry Stream Interval</label>
                <select
                  value={telemetryInterval}
                  onChange={(e) => setTelemetryInterval(e.target.value)}
                  className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-stellar-500 font-mono"
                >
                  <option value="500ms">500ms (High Frequency)</option>
                  <option value="1000ms">1000ms (Standard Nominal)</option>
                  <option value="3000ms">3000ms (Power Saver)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Quantum Encryption Matrix</label>
                <select
                  value={encryptionLevel}
                  onChange={(e) => setEncryptionLevel(e.target.value)}
                  className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-stellar-500 font-mono"
                >
                  <option value="Quantum 256-bit">Quantum 256-bit</option>
                  <option value="Quantum 512-bit">Quantum 512-bit (Recommended)</option>
                  <option value="Subspace Lattice">Subspace Lattice 1024-bit</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-space-950/60 border border-slate-800">
                <div>
                  <span className="text-sm font-bold text-white block">Autonomous Fleet Auto-Sync</span>
                  <span className="text-xs text-slate-400">Continuously synchronize mission telemetry with Earth deep space network</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-5 h-5 accent-stellar-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-space-950/60 border border-slate-800">
                <div>
                  <span className="text-sm font-bold text-white block">AI Subsystem Diagnostic Agent</span>
                  <span className="text-xs text-slate-400">Enable autonomous anomaly detection and automated corrective logging</span>
                </div>
                <input
                  type="checkbox"
                  checked={aiDiagnosticAgent}
                  onChange={(e) => setAiDiagnosticAgent(e.target.checked)}
                  className="w-5 h-5 accent-stellar-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-stellar-600 to-nebula-600 hover:from-stellar-500 hover:to-nebula-500 text-white font-medium text-sm shadow-lg shadow-stellar-500/20 transition-all"
          >
            Save Configuration Changes
          </button>
        </div>

        {/* Right Col: System Status Summary */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-nebula-400" />
              <span>Core Hardware Diagnostics</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-space-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Central Processor:</span>
                <span className="text-emerald-400 font-bold">Q-Core 9900X (12% Load)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-space-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Subspace Array:</span>
                <span className="text-emerald-400 font-bold">Optimal (4.82 GHz)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-space-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Secure Vault Storage:</span>
                <span className="text-stellar-400 font-bold">4.2 TB / 64 TB Used</span>
              </div>
              <div className="p-3.5 rounded-xl bg-space-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Firmware Build:</span>
                <span className="text-slate-200 font-bold">v4.8.2-RELEASE</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-space-950/60 border border-slate-800 text-center space-y-2">
            <span className="text-xs font-mono text-slate-400">Need to reset subspace array?</span>
            <button
              type="button"
              onClick={() => alert('Subspace relay network rebooted successfully. All telemetry streams re-initialized.')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition-colors"
            >
              Reboot Telemetry Array
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};