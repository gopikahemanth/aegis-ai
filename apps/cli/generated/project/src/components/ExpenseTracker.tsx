import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export const ExpenseTracker = () => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const transactions = [
    { id: 1, merchant: 'Supermarket Groceries', category: 'Food & Dining', amount: '$124.50', date: '2026-08-05' },
    { id: 2, merchant: 'Monthly Electric Utility', category: 'Housing', amount: '$85.00', date: '2026-08-04' }
  ];

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold">Personal Expense Tracker</h1>
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
        />
      </header>
      {/* Table and analytics content goes here */}
    </div>
  );
};