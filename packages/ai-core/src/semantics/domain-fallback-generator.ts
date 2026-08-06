import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";

export class DomainAwareFallbackGenerator {
  public static generateFallbackComponent(
    spec: CanonicalProjectSpecification,
    componentName: string,
    targetRelPath: string
  ): string {
    const domain = spec.domainCategory;
    const lowerRel = targetRelPath.toLowerCase();

    if (lowerRel.includes("apiclient") || lowerRel.includes("api-client")) {
      return `import axios from 'axios';
export const apiClient = axios.create({ baseURL: '/api' });
export default apiClient;
`;
    }

    if (lowerRel.includes("type") || lowerRel.includes("model") || lowerRel.includes("entity")) {
      return `export interface ${componentName} {
  id: string | number;
  title?: string;
  name?: string;
  amount?: number;
  category?: string;
  createdAt?: string;
  [key: string]: any;
}
export default ${componentName};
`;
    }

    if (domain === "expense-tracker") {
      return `import React, { useState } from 'react';

export default function ${componentName}() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const transactions = [
    { id: 1, merchant: 'Supermarket Groceries', category: 'Food & Dining', amount: '$124.50', date: '2026-08-05' },
    { id: 2, merchant: 'Monthly Electric Utility', category: 'Housing', amount: '$85.00', date: '2026-08-04' },
    { id: 3, merchant: 'Gas Station Fuel', category: 'Transportation', amount: '$45.00', date: '2026-08-03' },
    { id: 4, merchant: 'Streaming Subscription', category: 'Entertainment', amount: '$14.99', date: '2026-08-01' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Personal Expense Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor category budgets, track spending analytics, and manage transactions.</p>
        </div>
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Monthly Spent</span>
          <h2 className="text-2xl font-bold text-emerald-400 mt-1">$2,450.00</h2>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[65%]"></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Monthly Budget Limit</span>
          <h2 className="text-2xl font-bold text-white mt-1">$3,800.00</h2>
          <span className="text-xs text-slate-500 mt-2 block">$1,350.00 remaining</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Category Compliance</span>
          <h2 className="text-2xl font-bold text-indigo-400 mt-1">100% On Track</h2>
          <span className="text-xs text-slate-500 mt-2 block">4 Active Category Budgets</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.filter(t => categoryFilter === 'All' || t.category === categoryFilter).map((t) => (
                <tr key={t.id} className="hover:bg-slate-850">
                  <td className="py-3.5 px-4 font-semibold text-white">{t.merchant}</td>
                  <td className="py-3.5 px-4"><span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-xs">{t.category}</span></td>
                  <td className="py-3.5 px-4 text-slate-400">{t.date}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;
    }

    if (domain === "art-gallery") {
      return `import React, { useState } from 'react';

export default function ${componentName}() {
  const [search, setSearch] = useState('');
  const artworks = [
    { id: 1, title: 'Starry Horizon', artist: 'Vincent van Gogh', price: '$12,500', category: 'Oil Painting' },
    { id: 2, title: 'Abstract Composition', artist: 'Wassily Kandinsky', price: '$8,900', category: 'Modern Art' }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Art Gallery Collection</h1>
          <p className="text-neutral-400 text-sm mt-1">Explore curated exhibitions, artwork details, and artist portfolios.</p>
        </div>
        <input
          type="text"
          placeholder="Search artworks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white"
        />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {artworks.map((art) => (
          <div key={art.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
            <span className="text-xs text-amber-400 font-semibold">{art.category}</span>
            <h2 className="text-xl font-bold text-white mt-1">{art.title}</h2>
            <p className="text-sm text-neutral-400">By {art.artist}</p>
            <span className="text-lg font-bold text-amber-400 mt-4 block">{art.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
    }

    if (domain === "task-manager") {
      return `import React, { useState } from 'react';

export default function ${componentName}() {
  const [search, setSearch] = useState('');
  const sampleItems = [
    { id: 1, title: 'Database Schema & Auth Setup', category: 'High Priority', status: 'In Progress', tag: 'Backend' },
    { id: 2, title: 'Kanban Board Drag & Drop', category: 'Medium Priority', status: 'To Do', tag: 'Frontend' },
    { id: 3, title: 'Dark Mode Persistent State', category: 'Low Priority', status: 'Done', tag: 'UI' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Kanban Task Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Manage project status, task workflows, and team assignments.</p>
        </div>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
        />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['To Do', 'In Progress', 'Done'].map((status) => (
          <div key={status} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-300 mb-3">{status}</h2>
            <div className="space-y-3">
              {sampleItems.filter(i => i.status === status).map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-indigo-400 font-semibold">{item.tag}</span>
                  <h3 className="text-sm font-semibold text-white mt-1">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
    }

    // Default General Dashboard
    return `import React from 'react';

export default function ${componentName}() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">${componentName}</h1>
        <p className="text-slate-400 text-sm mt-1">Application Module Overview</p>
      </header>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <p className="text-slate-300">${componentName} module content</p>
      </div>
    </div>
  );
}
`;
  }
}
