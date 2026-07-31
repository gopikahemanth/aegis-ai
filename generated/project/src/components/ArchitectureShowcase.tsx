import React from 'react';

export const ArchitectureShowcase: React.FC = () => {
  return (
    <section id="architecture" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Clean Architecture</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-4">Built on SOLID Engineering Principles</h2>
          <p className="text-slate-400 text-lg">Designed for high-concurrency enterprise workloads with zero single points of failure.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10">
            <div className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">01 / Ingress Layer</div>
            <h3 className="text-lg font-bold text-white mb-2">Edge Proxy & WAF</h3>
            <p className="text-slate-400 text-sm">Intercepts and inspects all inbound HTTP/gRPC streams at edge nodes with sub-millisecond filtering.</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10">
            <div className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">02 / Processing Layer</div>
            <h3 className="text-lg font-bold text-white mb-2">Neural Inference Engine</h3>
            <p className="text-slate-400 text-sm">Lightweight transformer models evaluate behavioral anomalies and score payload risk probabilities.</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
            <div className="text-purple-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">03 / Defense Layer</div>
            <h3 className="text-lg font-bold text-white mb-2">Autonomous Sandbox</h3>
            <p className="text-slate-400 text-sm">Isolates suspicious execution threads in micro-VMs to perform deep forensic analysis safely.</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10">
            <div className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">04 / Storage Layer</div>
            <h3 className="text-lg font-bold text-white mb-2">Distributed Vault</h3>
            <p className="text-slate-400 text-sm">Maintains immutable threat logs and cryptographically verified audit trails across multi-region clusters.</p>
          </div>
        </div>
      </div>
    </section>
  );
};