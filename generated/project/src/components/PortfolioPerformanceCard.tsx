import React from 'react';
import { AssetHolding, Currency } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, Award } from 'lucide-react';

interface PortfolioPerformanceCardProps {
  holdings: AssetHolding[];
  currency: Currency;
}

export const PortfolioPerformanceCard: React.FC<PortfolioPerformanceCardProps> = ({ holdings, currency }) => {
  const sortedByGain = [...holdings].sort((a, b) => {
    const gainA = (a.currentPrice - a.averageBuyPrice) * a.amount;
    const gainB = (b.currentPrice - b.averageBuyPrice) * b.amount;
    return gainB - gainA;
  });

  const topPerformer = sortedByGain[0];
  const topGainVal = topPerformer ? (topPerformer.currentPrice - topPerformer.averageBuyPrice) * topPerformer.amount : 0;
  const topGainPct = topPerformer ? ((topPerformer.currentPrice - topPerformer.averageBuyPrice) / topPerformer.averageBuyPrice) * 100 : 0;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute right-0 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">Top Performing Asset</h3>
            <p className="text-xs text-slate-400">Highest absolute returns</p>
          </div>
        </div>
      </div>

      {topPerformer ? (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center font-mono text-xs">
              {topPerformer.symbol}
            </div>
            <div>
              <div className="font-bold text-slate-100">{topPerformer.name}</div>
              <div className="text-xs text-slate-400 font-mono">{topPerformer.amount} shares</div>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="font-bold text-emerald-400">+{formatCurrency(topGainVal, currency)}</div>
            <div className="text-xs text-emerald-500 font-semibold">+{topGainPct.toFixed(1)}%</div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400">No holdings recorded.</div>
      )}
    </div>
  );
};