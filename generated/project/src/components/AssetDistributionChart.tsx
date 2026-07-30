import React from 'react';
import { AssetHolding, Currency } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { PieChart, Shield } from 'lucide-react';

interface AssetDistributionChartProps {
  holdings: AssetHolding[];
  currency: Currency;
}

export const AssetDistributionChart: React.FC<AssetDistributionChartProps> = ({ holdings, currency }) => {
  const classTotals: Record<string, number> = {};
  let totalValue = 0;

  holdings.forEach(h => {
    const val = h.amount * h.currentPrice;
    classTotals[h.assetClass] = (classTotals[h.assetClass] || 0) + val;
    totalValue += val;
  });

  const colors: Record<string, string> = {
    Stocks: 'bg-indigo-500',
    Crypto: 'bg-purple-500',
    'Real Estate': 'bg-emerald-500',
    Cash: 'bg-sky-500',
    Commodities: 'bg-amber-500',
    Bonds: 'bg-rose-500'
  };

  const distribution = Object.entries(classTotals).map(([className, val]) => ({
    className,
    val,
    pct: totalValue > 0 ? (val / totalValue) * 100 : 0
  })).sort((a, b) => b.val - a.val);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Asset Distribution</h3>
            <p className="text-xs text-slate-400">Diversification by asset class</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* Progress Bar Stack */}
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800 mb-6">
          {distribution.map((item) => (
            <div
              key={item.className}
              style={{ width: `${item.pct}%` }}
              className={`h-full first:rounded-l-full last:rounded-r-full ${colors[item.className] || 'bg-indigo-500'} transition-all duration-500`}
              title={`${item.className}: ${item.pct.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend List */}
        <div className="space-y-3">
          {distribution.map((item) => (
            <div key={item.className} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-lg ${colors[item.className] || 'bg-indigo-500'}`} />
                <span className="font-semibold text-slate-300">{item.className}</span>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-slate-100">{formatCurrency(item.val, currency)}</span>
                <span className="text-xs text-slate-400 ml-2">({item.pct.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Portfolio risk score: <strong>7.4 / 10 (Growth Optimized)</strong></span>
      </div>
    </div>
  );
};