import React from 'react';

interface CallToActionProps {
  onOpenModal: () => void;
  onScrollTo: (id: string) => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({ onOpenModal, onScrollTo }) => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-purple-950/40 border border-cyan-500/30 rounded-3xl p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_50%)]"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to Secure Your Infrastructure?</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
              Join Fortune 500 engineering teams who trust Aegis AI for autonomous enterprise threat defense.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={onOpenModal} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer">
                Schedule Enterprise Demo
              </button>
              <button onClick={() => onScrollTo('terminal')} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold hover:bg-slate-800 transition-all cursor-pointer">
                Test in Sandbox
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};