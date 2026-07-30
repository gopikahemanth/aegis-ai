import React, { useState } from 'react';
import { Transaction, Currency, TransactionCategory, TransactionType } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { Search, ArrowUpRight, ArrowDownLeft, Trash2, Plus } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  currency: Currency;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  currency,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.merchant && t.merchant.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100">Transaction History</h2>
          <p className="text-xs text-slate-400">Search, filter, and audit all financial transactions</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions or merchants..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Income">Income</option>
            <option value="Investment">Investment</option>
            <option value="Housing">Housing</option>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Transport">Transport</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Shopping">Shopping</option>
            <option value="Subscriptions">Subscriptions</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Transaction</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Account</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="group hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                            {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{tx.title}</div>
                            <div className="text-xs text-slate-500">{tx.merchant || tx.notes}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-slate-400">{tx.account}</td>
                      <td className="py-4 text-xs text-slate-400 font-mono">{tx.date}</td>
                      <td className="py-4 text-right font-mono">
                        <span className={`font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};