import React, { useState } from 'react';
import { AssetHolding, Currency, AssetClass } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { Wallet, Plus, TrendingUp, Trash2 } from 'lucide-react';

interface PortfolioManagementProps {
  holdings: AssetHolding[];
  onUpdateHoldings: (holdings: AssetHolding[]) => void;
  currency: Currency;
}

const assetClasses: AssetClass[] = ['Stocks', 'Crypto', 'Real Estate', 'Cash', 'Commodities', 'Bonds'];

export const PortfolioManagement: React.FC<PortfolioManagementProps> = ({
  holdings,
  onUpdateHoldings,
  currency,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('Stocks');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  const totalValue = holdings.reduce((acc, h) => acc + (h.amount * h.currentPrice), 0);
  const totalCost = holdings.reduce((acc, h) => acc + (h.amount * h.averageBuyPrice), 0);
  const totalGain = totalValue - totalCost;

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol || !amount || !currentPrice) return;

    const newHolding: AssetHolding = {
      id: `h-${Date.now()}`,
      name,
      symbol: symbol.toUpperCase(),
      assetClass,
      amount: parseFloat(amount),
      averageBuyPrice: parseFloat(buyPrice || currentPrice),
      currentPrice: parseFloat(currentPrice),
      currency,
      allocationPercentage: 0,
      dailyChangePercent: 1.25,
    };

    onUpdateHoldings([...holdings, newHolding]);
    setName('');
    setSymbol('');
    setAmount('');
    setBuyPrice('');
    setCurrentPrice('');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    onUpdateHoldings(holdings.filter(h => h.id !== id));
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100">Portfolio & Wealth Assets</h2>
          <p className="text-xs text-slate-400">Track and manage individual equities, cryptocurrencies, and cash reserves</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset Holding</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Portfolio Value</span>
          <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">{formatCurrency(totalValue, currency)}</div>
        </div>
        <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Cost Basis</span>
          <div className="text-3xl font-extrabold text-slate-300 font-mono mt-1">{formatCurrency(totalCost, currency)}</div>
        </div>
        <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Unrealized Gain</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span>{formatCurrency(totalGain, currency)}</span>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-100 mb-6">All Asset Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Asset</th>
                <th className="pb-3">Class</th>
                <th className="pb-3">Holdings</th>
                <th className="pb-3">Avg Buy Price</th>
                <th className="pb-3">Current Price</th>
                <th className="pb-3">Total Value</th>
                <th className="pb-3">24h Change</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {holdings.map((h) => {
                const val = h.amount * h.currentPrice;
                const isPositive = h.dailyChangePercent >= 0;

                return (
                  <tr key={h.id} className="group hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs font-mono">
                          {h.symbol}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{h.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{h.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {h.assetClass}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-slate-300">{h.amount} {h.symbol}</td>
                    <td className="py-4 font-mono text-slate-400">{formatCurrency(h.averageBuyPrice, currency)}</td>
                    <td className="py-4 font-mono text-slate-200 font-semibold">{formatCurrency(h.currentPrice, currency)}</td>
                    <td className="py-4 font-mono text-slate-100 font-bold">{formatCurrency(val, currency)}</td>
                    <td className="py-4">
                      <span className={`font-semibold text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{h.dailyChangePercent}%
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-slate-100">Add Asset Position</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddHolding} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tesla Inc."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ticker Symbol *</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="TSLA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Class</label>
                <select
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {assetClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Avg Buy Price</label>
                  <input
                    type="number"
                    step="any"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="150"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current Price *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    placeholder="180"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-2xl text-sm font-semibold bg-indigo-600 text-white shadow-lg">Save Holding</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};