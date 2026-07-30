import React from 'react';
import { Transaction, Currency } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  currency: Currency;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ transactions, currency }) => {
  const recent = transactions.slice(0, 5);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Recent Transactions</h3>
          <p className="text-xs text-slate-400">Latest income and expense records</p>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View All →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pl-2">Transaction</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Date</th>
              <th className="pb-3 text-right pr-2">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {recent.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <tr key={tx.id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                        {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{tx.title}</div>
                        <div className="text-[11px] text-slate-500">{tx.account}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-slate-400 font-mono">{tx.date}</td>
                  <td className="py-3.5 text-right font-mono pr-2">
                    <span className={`font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};