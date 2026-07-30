import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RiskGaugeWidgetProps {
  riskTolerance: 'Conservative' | 'Balanced' | 'Aggressive';
}

export const RiskGaugeWidget: React.FC<RiskGaugeWidgetProps> = ({ riskTolerance }) => {
  const riskLevels = {
    Conservative: { score: 3.2, color: 'text-sky-400', bg: 'bg-sky-500', desc: 'Capital preservation & fixed income focus' },
    Balanced: { score: 6.4, color: 'text-indigo-400', bg: 'bg-indigo-500', desc: 'Healthy mix of equities, crypto & cash reserves' },
    Aggressive: { score: 8.9, color: 'text-rose-400', bg: 'bg-rose-500', desc: 'High growth equities, tech & leveraged assets' },
  };

  const current = riskLevels[riskTolerance] || riskLevels.Balanced;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">Risk Assessment</h3>
            <p className="text-xs text-slate-400">Current profile: {riskTolerance}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">Volatility Index</span>
          <span className={`text-sm font-black font-mono ${current.color}`}>{current.score} / 10</span>
        </div>

        {/* Meter */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            style={{ width: `${(current.score / 10) * 100}%` }}
            className={`h-full rounded-full ${current.bg} transition-all duration-500`}
          />
        </div>

        <p className="text-xs text-slate-300 font-medium">{current.desc}</p>
      </div>
    </div>
  );
};