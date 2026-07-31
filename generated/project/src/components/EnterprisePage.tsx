import React from 'react';

interface EnterprisePageProps {
  onOpenModal: () => void;
}

export const EnterprisePage: React.FC<EnterprisePageProps> = ({ onOpenModal }) => {
  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Enterprise Grade</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mt-2 mb-4">Scalable Security for Global Organizations</h1>
          <p className="text-slate-400 text-lg">Custom deployment models, dedicated neural enclaves, and 24/7 priority incident response.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">Starter Grid</div>
              <div className="text-3xl font-extrabold text-white mb-4">$2,400 <span className="text-sm font-normal text-slate-400">/mo</span></div>
              <p className="text-slate-400 text-sm mb-6">Ideal for growing SaaS applications and mid-market cloud infrastructure.</p>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-cyan-400"></i> Up to 50 cluster nodes</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-cyan-400"></i> Real-time neural inference</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-cyan-400"></i> Standard support SLA</li>
              </ul>
            </div>
            <button onClick={onOpenModal} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer">
              Deploy Starter
            </button>
          </div>

          <div className="bg-gradient-to-b from-cyan-950/40 to-slate-900/80 border border-cyan-500/50 rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider rounded-full">
              Most Popular
            </div>
            <div>
              <div className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">Enterprise Grid</div>
              <div className="text-3xl font-extrabold text-white mb-4">$8,900 <span className="text-sm font-normal text-slate-400">/mo</span></div>
              <p className="text-slate-400 text-sm mb-6">Advanced threat neutralization for high-throughput enterprise systems.</p>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-cyan-400"></i> Unlimited cluster nodes</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-cyan-400"></i> Dedicated hardware enclaves</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-cyan-400"></i> 24/7 priority incident response</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-cyan-400"></i> Custom model training</li>
              </ul>
            </div>
            <button onClick={onOpenModal} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer">
              Deploy Enterprise
            </button>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="text-purple-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">Sovereign Air-Gapped</div>
              <div className="text-3xl font-extrabold text-white mb-4">Custom</div>
              <p className="text-slate-400 text-sm mb-6">Tailored for government, defense, and strictly regulated financial institutions.</p>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-purple-400"></i> 100% On-premise air-gapped</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-purple-400"></i> Zero external telemetry</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-check text-purple-400"></i> Dedicated security architect</li>
              </ul>
            </div>
            <button onClick={onOpenModal} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};