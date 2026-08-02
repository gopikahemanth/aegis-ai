import React, { useState } from 'react';

interface CockpitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CockpitModal: React.FC<CockpitModalProps> = ({ isOpen, onClose }) => {
  const [shieldActive, setShieldActive] = useState(true);
  const [weaponsArmed, setWeaponsArmed] = useState(false);
  const [overdrive, setOverdrive] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${overdrive ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <h2 className="font-mono font-bold text-sm text-slate-100 tracking-wider">PILOT COCKPIT SIMULATOR</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Cockpit Controls Body */}
        <div className="p-6 space-y-6 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shield Toggle */}
            <div className={`p-4 rounded-xl border transition-all ${shieldActive ? 'bg-blue-950/30 border-blue-500/50' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-xs text-slate-400 mb-2">ENERGY SHIELD</div>
              <div className="text-lg font-bold text-slate-100 mb-4">{shieldActive ? 'ONLINE' : 'OFFLINE'}</div>
              <button
                onClick={() => setShieldActive(!shieldActive)}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  shieldActive ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {shieldActive ? 'DEACTIVATE' : 'ACTIVATE'}
              </button>
            </div>

            {/* Weaponry Arm */}
            <div className={`p-4 rounded-xl border transition-all ${weaponsArmed ? 'bg-red-950/30 border-red-500/50' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-xs text-slate-400 mb-2">PLASMA CANNON</div>
              <div className="text-lg font-bold text-slate-100 mb-4">{weaponsArmed ? 'ARMED' : 'SAFE'}</div>
              <button
                onClick={() => setWeaponsArmed(!weaponsArmed)}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  weaponsArmed ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {weaponsArmed ? 'DISARM' : 'ARM WEAPONS'}
              </button>
            </div>

            {/* Reactor Overdrive */}
            <div className={`p-4 rounded-xl border transition-all ${overdrive ? 'bg-amber-950/30 border-amber-500/50' : 'bg-slate-950 border-slate-800'}`}>
              <div className="text-xs text-slate-400 mb-2">REACTOR OVERDRIVE</div>
              <div className="text-lg font-bold text-slate-100 mb-4">{overdrive ? '150% PEAK' : 'STANDARD'}</div>
              <button
                onClick={() => setOverdrive(!overdrive)}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  overdrive ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {overdrive ? 'NORMAL POWER' : 'ENGAGE OVERDRIVE'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>SYNAPTIC LINK STABILITY:</span>
              <span className="text-slate-100 font-bold">{overdrive ? '98.4%' : '99.9%'}</span>
            </div>
            <div className="flex justify-between">
              <span>HYDRAULIC FLUX:</span>
              <span className="text-slate-100 font-bold">{overdrive ? '14,500 PSI' : '12,000 PSI'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-mono text-xs font-bold text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            EXIT COCKPIT
          </button>
        </div>
      </div>
    </div>
  );
};