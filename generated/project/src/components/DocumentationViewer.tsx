import React from 'react';

export const DocumentationViewer: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 border-b border-slate-800 pb-6">
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Aegis AI Knowledge Base</span>
          <h1 className="text-4xl font-extrabold text-white mt-2 mb-3">System Documentation & Whitepaper</h1>
          <p className="text-slate-400">Comprehensive guide to integrating and configuring Aegis Neural Core within enterprise environments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2 text-sm text-slate-400 font-medium">
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Table of Contents</div>
            <a href="#quickstart" className="block hover:text-cyan-400 transition-colors">1. Quickstart Guide</a>
            <a href="#neural-matrix" className="block hover:text-cyan-400 transition-colors">2. Neural Matrix Architecture</a>
            <a href="#cli-reference" className="block hover:text-cyan-400 transition-colors">3. CLI & SDK Reference</a>
            <a href="#security" className="block hover:text-cyan-400 transition-colors">4. Zero-Trust Security Model</a>
          </div>

          <div className="md:col-span-3 space-y-10 text-slate-300">
            <section id="quickstart" className="space-y-4">
              <h2 className="text-2xl font-bold text-white">1. Quickstart Guide</h2>
              <p className="leading-relaxed">
                Deploying Aegis AI onto your Kubernetes cluster takes less than 60 seconds. Our zero-friction operator installs as a mutating webhook controller.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-400 overflow-x-auto">
                kubectl apply -f https://aegis.ai/v4/operator.yaml
              </div>
            </section>

            <section id="neural-matrix" className="space-y-4">
              <h2 className="text-2xl font-bold text-white">2. Neural Matrix Architecture</h2>
              <p className="leading-relaxed">
                The Aegis Neural Inference Engine runs decentralized lightweight transformer models directly on ingress proxy nodes. This eliminates round-trip latency to centralized cloud classifiers.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li>Sub-millisecond anomaly detection using hardware acceleration.</li>
                <li>Real-time gradient updates synchronized across multi-region clusters.</li>
                <li>Deterministic containment guaranteeing zero data leakage.</li>
              </ul>
            </section>

            <section id="cli-reference" className="space-y-4">
              <h2 className="text-2xl font-bold text-white">3. CLI & SDK Reference</h2>
              <p className="leading-relaxed">
                Interact with your cluster security mesh programmatically using the Aegis CLI tool or our official TypeScript/Python SDKs.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-300 space-y-1">
                <div>aegis-cli init --cluster=production-east</div>
                <div>aegis-cli scan --deep-inspection</div>
                <div>aegis-cli shield --status</div>
              </div>
            </section>

            <section id="security" className="space-y-4">
              <h2 className="text-2xl font-bold text-white">4. Zero-Trust Security Model</h2>
              <p className="leading-relaxed">
                All cryptographic key exchanges are secured inside isolated hardware enclaves. Telemetry streams are cryptographically signed and stored on immutable ledgers.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};