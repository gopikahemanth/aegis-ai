import React from 'react';
import { Transaction, AssetHolding, Currency } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { PieChart, TrendingUp, DollarSign, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react';

interface AnalyticsAndReportsProps {
  transactions: Transaction[];
  holdings: AssetHolding[];
  currency: Currency;
}

export const AnalyticsAndReports: React.FC<AnalyticsAndReportsProps> = ({
  transactions,
  holdings,
  currency,
}) => {
  const categoryTotals: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const breakdown = Object.entries(categoryTotals).map(([cat, amount]) => ({
    category: cat,
    amount,
    pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100">Analytics & Financial Reports</h2>
          <p className="text-xs text-slate-400">Deep-dive audit into spending habits, cash flow velocities, and yield generation</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Average Monthly Burn Rate</span>
          <div className="text-3xl font-extrabold text-slate-100 font-mono mt-2">
            {formatCurrency(totalExpense, currency)}
          </div>
          <span className="text-xs text-emerald-400 font-semibold mt-1 block">-3.2% vs previous period</span>
        </div>
        <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Portfolio Annual Dividend Yield</span>
          <div className="text-3xl font-extrabold text-indigo-400 font-mono mt-2">3.85%</div>
          <span className="text-xs text-slate-400 mt-1 block">Est. annual cash payout</span>
        </div>
        <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Financial Independence Score</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">84 / 100</div>
          <span className="text-xs text-slate-400 mt-1 block">Tier: Wealth Accumulator</span>
        </div>
      </div>

      {/* Expense Categorization Breakdown */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Expense Categorization Breakdown</h3>
            <p className="text-xs text-slate-400">Where your money goes each month</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-4">
          {breakdown.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200">{item.category}</span>
                <span className="font-mono font-bold text-slate-100">
                  {formatCurrency(item.amount, currency)} <span className="text-xs text-slate-400 font-normal ml-1">({item.pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  style={{ width: `${item.pct}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};