import React, { useState } from 'react';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'structural' | 'hydraulics' | 'avionics'>('structural');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="font-mono font-bold text-sm text-slate-100 tracking-wider">CHASSIS BLUEPRINT SPECIFICATION</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-6 font-mono text-xs">
          <button
            onClick={() => setActiveTab('structural')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'structural' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            01. STRUCTURAL MATRIX
          </button>
          <button
            onClick={() => setActiveTab('hydraulics')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'hydraulics' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            02. HYDRAULIC ACTUATORS
          </button>
          <button
            onClick={() => setActiveTab('avionics')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'avionics' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            03. AVIONICS & POWER
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative aspect-video flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />
            
            {/* SVG Wireframe Illustration */}
            <svg className="w-48 h-48 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="absolute bottom-3 left-3 text-[10px] font-mono text-blue-400">SCHEMATIC_REF // 094-B</span>
          </div>

          <div className="space-y-4 font-mono text-xs text-slate-300">
            {activeTab === 'structural' && (
              <>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 mb-1">Titanium-Graphite Composite Sub-Frame</h4>
                  <p className="text-slate-400">High tensile strength alloy weave engineered to withstand extreme torsional loads during bipedal transformation.</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 mb-1">Impact Dispersion Armor Plating</h4>
                  <p className="text-slate-400">Active magnetic damping tiles absorb kinetic energy and dissipate directed plasma discharge.</p>
                </div>
              </>
            )}

            {activeTab === 'hydraulics' && (
              <>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 mb-1">High-Pressure Fluid Actuators (12,000 PSI)</h4>
                  <p className="text-slate-400">Instantaneous fluid displacement grants 0.04-second joint articulation response time.</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 mb-1">Redundant Servo Loops</h4>
                  <p className="text-slate-400">Dual-channel optical feedback lines ensure 99.99% operational fidelity under heavy fire.</p>
                </div>
              </>
            )}

            {activeTab === 'avionics' && (
              <>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 mb-1">Class-IV Micro-Fusion Reactor</h4>
                  <p className="text-slate-400">Delivers stable 120V continuous bus power with titanium-shielded magnetic containment.</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 mb-1">Neural Pilot Interface Matrix</h4>
                  <p className="text-slate-400">Direct synaptic pairing allows subconscious reflex mapping for pilot combat maneuvers.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-mono text-xs font-bold text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            CLOSE BLUEPRINT
          </button>
        </div>
      </div>
    </div>
  );
};