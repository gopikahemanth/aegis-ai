import React from 'react';
import { AssetHolding, Currency } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { Layers, ShieldCheck, Target } from 'lucide-react';

interface AssetAllocationProps {
  holdings: AssetHolding[];
  currency: Currency;
}

export const AssetAllocation: React.FC<AssetAllocationProps> = ({ holdings, currency }) => {
  const totalVal = holdings.reduce((acc, h) => acc + (h.amount * h.currentPrice), 0);

  const targets: Record<string, number> = {
    Stocks: 60,
    Crypto: 15,
    'Real Estate': 15,
    Cash: 10
  };

  const actuals: Record<string, number> = {};
  holdings.forEach(h => {
    actuals[h.assetClass] = (actuals[h.assetClass] || 0) + (h.amount * h.currentPrice);
  });

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100">Strategic Asset Allocation</h2>
        <p className="text-xs text-slate-400">Target vs actual portfolio rebalancing matrices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(targets).map(([className, targetPct]) => {
          const actualVal = actuals[className] || 0;
          const actualPct = totalVal > 0 ? (actualVal / totalVal) * 100 : 0;
          const diff = actualPct - targetPct;

          return (
            <div key={className} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{className}</h3>
                    <p className="text-xs text-slate-400">Target: {targetPct}%</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-slate-100">{formatCurrency(actualVal, currency)}</div>
                  <div className="text-xs text-slate-400">{actualPct.toFixed(1)}% Actual</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Variance</span>
                  <span className={diff > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {diff > 0 ? `+${diff.toFixed(1)}% Overweight` : `${diff.toFixed(1)}% Underweight`}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    style={{ width: `${Math.min(100, actualPct)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};