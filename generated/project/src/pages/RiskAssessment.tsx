import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react';
import { StoragePersistenceService } from '../services/StoragePersistenceService';

interface RiskAssessmentProps {
  currentRisk: 'Conservative' | 'Balanced' | 'Aggressive';
  onUpdateRisk: (risk: 'Conservative' | 'Balanced' | 'Aggressive') => void;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ currentRisk, onUpdateRisk }) => {
  const [selected, setSelected] = useState<'Conservative' | 'Balanced' | 'Aggressive'>(currentRisk);

  const profiles = [
    {
      title: 'Conservative',
      score: '3.2 / 10',
      desc: 'Focus on capital preservation, high-grade government bonds, blue-chip dividend payers, and ample cash reserves.',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Balanced',
      score: '6.4 / 10',
      desc: 'Optimal growth posture with a diversified mix of S&P 500 index funds, tech equities, real estate, and limited crypto holdings.',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Aggressive',
      score: '8.9 / 10',
      desc: 'Maximum capital appreciation focus. Heavy allocation into growth tech, high-beta crypto assets, and early-stage venture portfolios.',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
  ];

  const handleSave = (title: 'Conservative' | 'Balanced' | 'Aggressive') => {
    setSelected(title);
    onUpdateRisk(title);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100">Risk & Investment Profile</h2>
        <p className="text-xs text-slate-400">Configure your portfolio risk appetite and volatility parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profiles.map((p) => {
          const isSelected = selected === p.title;
          return (
            <div
              key={p.title}
              onClick={() => handleSave(p.title as any)}
              className={`bg-slate-900/60 backdrop-blur-xl border rounded-3xl p-6 shadow-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                isSelected ? 'border-indigo-500 shadow-indigo-500/20 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${p.badgeColor}`}>
                    Score: {p.score}
                  </div>
                  {isSelected && <ShieldCheck className="w-5 h-5 text-indigo-400" />}
                </div>

                <h3 className="text-xl font-bold text-slate-100">{p.title} Profile</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Active Profile' : 'Select Profile'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};