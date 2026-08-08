import React from 'react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

export const TransactionList: React.FC<any> = ({ transactions }) => {
  if (transactions.length === 0) {
    return <div className="p-8 text-center text-slate-400">No transactions found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
      <table className="w-full text-left">
        <thead className="bg-slate-800/50 text-xs font-semibold uppercase text-slate-400">
          <tr>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4 text-slate-200">{t.description}</td>
              <td className="px-6 py-4 text-slate-400">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
              <td className={`px-6 py-4 font-bold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default TransactionList;

export type { Transaction };
