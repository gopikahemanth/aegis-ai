import React, { useState } from 'react';

export const InteractivePlayground: React.FC = () => {
  const [selectedCluster, setSelectedCluster] = useState('us-east-1 (Prod)');
  const [sensitivity, setSensitivity] = useState(95);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Playground simulation sandbox active.',
    '[INFO] Cluster connected: us-east-1 (Prod)',
    '[INFO] Neural sensitivity tuned to 95%',
  ]);

  const runSimulation = (threatType: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      `[${timestamp}] SIMULATION INITIATED: ${threatType} payload injected.`,
      `[${timestamp}] Neural Matrix analyzing behavior vector...`,
      `[${timestamp}] SUCCESS: Threat neutralized in 3.8ms. Sandbox quarantine complete.`,
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 border-b border-slate-800 pb-6">
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Sandbox Environment</span>
          <h1 className="text-4xl font-extrabold text-white mt-2 mb-3">Interactive Threat Simulation</h1>
          <p className="text-slate-400">Test autonomous defense protocols against simulated enterprise cyber threats in real-time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Simulation Controls</h3>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Target Cluster</label>
              <select 
                value={selectedCluster} 
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option>us-east-1 (Prod)</option>
                <option>eu-central-1 (Staging)</option>
                <option>ap-southeast-1 (Edge)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Neural Sensitivity: {sensitivity}%
              </label>
              <input 
                type="range" 
                min="50" 
                max="99" 
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer" 
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Strict Sandbox Isolation</span>
              <input 
                type="checkbox" 
                checked={sandboxMode}
                onChange={() => setSandboxMode(!sandboxMode)}
                className="w-5 h-5 accent-cyan-500 cursor-pointer" 
              />
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button onClick={() => runSimulation('Zero-Day SQL Injection')} className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer">
                Simulate SQL Injection
              </button>
              <button onClick={() => runSimulation('Distributed DDoS Flood')} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer">
                Simulate DDoS Flood
              </button>
              <button onClick={() => runSimulation('Malicious Memory Escalation')} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer">
                Simulate Privilege Escalation
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-mono text-cyan-400">LIVE SIMULATION TELEMETRY</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{selectedCluster}</span>
            </div>
            <div className="p-6 font-mono text-xs text-slate-300 h-[450px] overflow-y-auto space-y-2">
              {logs.map((log, idx) => (
                <div key={idx} className={log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('SIMULATION') ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};