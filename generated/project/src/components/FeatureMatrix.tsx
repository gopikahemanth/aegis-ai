import React from 'react';

export const FeatureMatrix: React.FC = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Enterprise Capabilities</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-4">Engineered for Absolute Resilience</h2>
          <p className="text-slate-400 text-lg">Aegis AI combines distributed neural processing with deterministic sandboxing to neutralize zero-day exploits instantly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl hover:border-cyan-500/50 transition-all group">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-brain"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Self-Learning Neural Matrix</h3>
            <p className="text-slate-400 leading-relaxed">Continuously analyzes ingress telemetry patterns across millions of edge vectors, adapting defense signatures within milliseconds.</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl hover:border-indigo-500/50 transition-all group">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-shield-cat"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Autonomous Threat Neutralization</h3>
            <p className="text-slate-400 leading-relaxed">Executes automated containment protocols, quarantining malicious payload streams before reaching core application microservices.</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl hover:border-purple-500/50 transition-all group">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Zero-Trust Memory Vault</h3>
            <p className="text-slate-400 leading-relaxed">Enforces hardware-isolated memory sandboxing for all cryptographic key exchanges and sensitive enterprise credentials.</p>
          </div>
        </div>
      </div>
    </section>
  );
};