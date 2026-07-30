import React from 'react';
import { Transaction, AssetHolding, Currency } from '../types/finance';
import { MetricCard } from '../components/MetricCard';
import { NetWorthChart } from '../components/NetWorthChart';
import { AssetDistributionChart } from '../components/AssetDistributionChart';
import { RecentTransactionsTable } from '../components/RecentTransactionsTable';
import { PortfolioPerformanceCard } from '../components/PortfolioPerformanceCard';
import { RiskGaugeWidget } from '../components/RiskGaugeWidget';
import { formatCurrency } from '../utils/formatters';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles } from 'lucide-react';

interface DashboardOverviewProps {
  transactions: Transaction[];
  holdings: AssetHolding[];
  currency: Currency;
  riskTolerance: 'Conservative' | 'Balanced' | 'Aggressive';
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  holdings,
  currency,
  riskTolerance,
}) => {
  const totalInvestments = holdings.reduce((acc, h) => acc + (h.amount * h.currentPrice), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netWorth = totalInvestments + (totalIncome - totalExpense);
  const monthlySavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (monthlySavings / totalIncome) * 100) : 0;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/40 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Financial Intelligence Active</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-1">
              Welcome back, Alex <span className="text-indigo-400">⚡</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Your overall net worth has grown by <span className="text-emerald-400 font-semibold">+4.2%</span> this month. All primary investments and budgets are on track.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-xs text-slate-400 block">Monthly Savings Rate</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{savingsRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Net Worth"
          value={formatCurrency(netWorth, currency)}
          change={4.2}
          icon={Wallet}
          gradient="from-indigo-600 to-indigo-800"
          borderColor="border-indigo-500/30"
        />
        <MetricCard
          title="Monthly Income"
          value={formatCurrency(totalIncome, currency)}
          change={2.8}
          icon={TrendingUp}
          gradient="from-emerald-600 to-emerald-800"
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatCurrency(totalExpense, currency)}
          change={-1.5}
          changeLabel="vs last month"
          icon={TrendingDown}
          gradient="from-rose-600 to-rose-800"
        />
        <MetricCard
          title="Net Savings"
          value={formatCurrency(monthlySavings, currency)}
          change={6.4}
          icon={PiggyBank}
          gradient="from-purple-600 to-purple-800"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <NetWorthChart currentNetWorth={netWorth} currency={currency} />
        </div>
        <div>
          <AssetDistributionChart holdings={holdings} currency={currency} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentTransactionsTable transactions={transactions} currency={currency} />
        </div>
        <div className="space-y-8">
          <PortfolioPerformanceCard holdings={holdings} currency={currency} />
          <RiskGaugeWidget riskTolerance={riskTolerance} />
        </div>
      </div>
    </div>
  );
};