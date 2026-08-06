import React, { useState } from 'react';

// Define the shape of our transaction data for consistency
interface Transaction {
  id: number;
  title: string;
  category: string;
  status: string;
  tag: string;
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  const sampleItems: Transaction[] = [
    { id: 1, title: 'Grocery Shopping', category: 'Food', status: 'Done', tag: 'Expense' },
    { id: 2, title: 'Salary Deposit', category: 'Income', status: 'Done', tag: 'Income' },
    { id: 3, title: 'Internet Bill', category: 'Utilities', status: 'In Progress', tag: 'Expense' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Review your financial activity and manage records.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Income', 'Expense'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === cat 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="space-y-3">
          {sampleItems
            .filter(i => (filter === 'All' || i.tag === filter) && i.title.toLowerCase().includes(search.toLowerCase()))
            .map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm hover:border-slate-700 transition-all flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${item.tag === 'Income' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {item.tag}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}