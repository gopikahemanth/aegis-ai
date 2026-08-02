import React from 'react';
import { CustomizationState } from '../types/mecha';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: CustomizationState;
  onChange: React.Dispatch<React.SetStateAction<CustomizationState>>;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  onClose,
  customization,
  onChange,
}) => {
  if (!isOpen) return null;

  const handleColorChange = (key: keyof CustomizationState, value: string) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-mono font-bold text-sm text-slate-100 tracking-wider">CHASSIS CUSTOMIZER SUITE</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-2">PRIMARY HULL COATING</label>
            <div className="flex gap-3">
              {['#2563eb', '#dc2626', '#059669', '#7c3aed', '#d97706'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange('primaryColor', color)}
                  className={`w-10 h-10 rounded-xl transition-all cursor-pointer border-2 ${
                    customization.primaryColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select primary color ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-2">OPTIC VISOR GLOW</label>
            <div className="flex gap-3">
              {['#ef4444', '#38bdf8', '#10b981', '#f59e0b', '#a855f7'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange('visorGlow', color)}
                  className={`w-10 h-10 rounded-xl transition-all cursor-pointer border-2 ${
                    customization.visorGlow === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select visor glow color ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-2">ARMOR FINISH</label>
            <div className="grid grid-cols-2 gap-3">
              {['matte', 'glossy', 'titanium', 'carbon'].map((finish) => (
                <button
                  key={finish}
                  onClick={() => handleColorChange('armorCoating', finish)}
                  className={`py-3 rounded-xl border text-center uppercase tracking-wider transition-all cursor-pointer ${
                    customization.armorCoating === finish
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {finish}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-mono text-xs font-bold text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            APPLY CUSTOMIZATION
          </button>
        </div>
      </div>
    </div>
  );
};