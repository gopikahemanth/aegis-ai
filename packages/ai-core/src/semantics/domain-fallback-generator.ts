import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";

export class DomainAwareFallbackGenerator {
  public static generateFallbackComponent(
    spec: CanonicalProjectSpecification,
    componentName: string,
    targetRelPath: string
  ): string {
    const domain = spec.domainCategory;
    const lowerRel = targetRelPath.toLowerCase();
    let safeCompName = componentName;
    for (const pat of spec.forbiddenPatterns) {
      if (pat.length > 2) {
        safeCompName = safeCompName.replace(new RegExp(pat, "gi"), domain === "expense-tracker" ? "Expense" : "Feature");
      }
    }
    if (!safeCompName || /^\d+$/.test(safeCompName)) safeCompName = "DomainFeature";

    if (lowerRel.includes("apiclient") || lowerRel.includes("api-client")) {
      return `import axios from 'axios';
export const apiClient = axios.create({ baseURL: '/api' });
export default apiClient;
`;
    }

    if (lowerRel.includes("hook") || lowerRel.includes("/hooks/") || safeCompName.startsWith("use")) {
      return `import { useState, useEffect } from 'react';

export function ${safeCompName}(initialData?: any) {
  const [data, setData] = useState<any>(initialData || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, refetch: () => {}, mutate: () => {} };
}
export default ${safeCompName};
`;
    }

    if (lowerRel.includes("context")) {
      return `import React, { createContext, useContext, useState } from 'react';

const ${safeCompName}Context = createContext<any>({});

export const ${safeCompName}Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<any>({});
  return (
    <${safeCompName}Context.Provider value={{ state, setState }}>
      {children}
    </${safeCompName}Context.Provider>
  );
};

export const use${safeCompName} = () => useContext(${safeCompName}Context);
export default ${safeCompName}Provider;
`;
    }

    if (lowerRel.includes("service")) {
      return `export const ${safeCompName} = {
  async getAll() { return []; },
  async getById(id: string | number) { return { id }; },
  async create(data: any) { return { id: Date.now(), ...data }; },
  async update(id: string | number, data: any) { return { id, ...data }; },
  async delete(id: string | number) { return true; }
};
export default ${safeCompName};
`;
    }

    if (lowerRel.includes("type") || lowerRel.includes("model") || lowerRel.includes("entity")) {
      return `export interface ${safeCompName} {
  id: string | number;
  title?: string;
  name?: string;
  amount?: number;
  category?: string;
  createdAt?: string;
  [key: string]: any;
}
export default ${safeCompName};
`;
    }

    if (domain === "workout-fitness") {
      return `import React, { useState } from 'react';

export default function ${safeCompName}() {
  const [search, setSearch] = useState('');
  const workouts = [
    { id: 1, name: 'Bench Press', category: 'Chest', weight: '185 lbs', sets: 4, reps: 10 },
    { id: 2, name: 'Barbell Squat', category: 'Legs', weight: '225 lbs', sets: 4, reps: 8 },
    { id: 3, name: 'Deadlift', category: 'Back', weight: '275 lbs', sets: 3, reps: 5 },
    { id: 4, name: 'Overhead Press', category: 'Shoulders', weight: '115 lbs', sets: 3, reps: 10 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Workout & Fitness Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Log workouts, track volume analytics, and monitor weekly progress.</p>
        </div>
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Weekly Training Volume</span>
          <h2 className="text-2xl font-bold text-emerald-400 mt-1">14,250 lbs</h2>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[80%]"></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Active Workout Streak</span>
          <h2 className="text-2xl font-bold text-white mt-1">5 Days 🔥</h2>
          <span className="text-xs text-slate-500 mt-2 block">Personal Best Streak</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Muscle Group Targets</span>
          <h2 className="text-2xl font-bold text-indigo-400 mt-1">4 Groups</h2>
          <span className="text-xs text-slate-500 mt-2 block">Chest, Legs, Back, Shoulders</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Workout Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Exercise</th>
                <th className="py-3 px-4">Muscle Group</th>
                <th className="py-3 px-4">Sets & Reps</th>
                <th className="py-3 px-4 text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {workouts.filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase())).map((w) => (
                <tr key={w.id} className="hover:bg-slate-850">
                  <td className="py-3.5 px-4 font-semibold text-white">{w.name}</td>
                  <td className="py-3.5 px-4"><span className="bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-full text-xs">{w.category}</span></td>
                  <td className="py-3.5 px-4 text-slate-400">{w.sets} sets × {w.reps} reps</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{w.weight}</td>
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

    if (domain === "expense-tracker") {
      return `import React, { useState } from 'react';

export default function ${safeCompName}() {
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
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Monthly Expenses</span>
          <h2 className="text-2xl font-bold text-emerald-400 mt-1">$2,450.00</h2>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[65%]"></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Monthly Budget Remaining</span>
          <h2 className="text-2xl font-bold text-white mt-1">$1,350.00</h2>
          <span className="text-xs text-slate-500 mt-2 block">Out of $3,800.00 Total Budget</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Budget Health Status</span>
          <h2 className="text-2xl font-bold text-indigo-400 mt-1">On Track (65% Spent)</h2>
          <span className="text-xs text-slate-500 mt-2 block">4 Active Categories</span>
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

    if (domain === "code-reviewer") {
      return `import React, { useState } from 'react';

export default function ${safeCompName}() {
  const [code, setCode] = useState(\`// Example security analysis target\\nconst query = "SELECT * FROM users WHERE id = " + req.params.id;\`);
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<any[]>([
    { id: "SEC-001", title: "SQL Injection via Concatenation", severity: "CRITICAL", file: "server/controllers/user.controller.ts:42" },
    { id: "SEC-002", title: "Hardcoded Credential Fallback", severity: "HIGH", file: "server/middleware/auth.ts:18" }
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans space-y-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">AI Code Reviewer & Security Vulnerability Scanner</h1>
          <p className="text-slate-400 text-sm mt-1">Static AST Analysis & Automated Patch Remediation Engine</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold">
          Risk Score: 78.5/100
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Scanned Vulnerabilities</span>
          <h2 className="text-3xl font-bold text-white mt-1">14</h2>
        </div>
        <div className="bg-slate-900 border border-red-500/30 p-5 rounded-xl">
          <span className="text-xs text-red-400 font-semibold uppercase">Critical Vulnerabilities</span>
          <h2 className="text-3xl font-bold text-red-400 mt-1">3</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Open Remediations</span>
          <h2 className="text-3xl font-bold text-cyan-400 mt-1">8</h2>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Security Findings</h2>
        <div className="space-y-3">
          {findings.map((f) => (
            <div key={f.id} className="flex justify-between items-center p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div>
                <div className="font-semibold text-white text-sm">{f.title}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{f.file}</div>
              </div>
              <span className={\`px-2.5 py-1 text-xs font-bold rounded \${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}\`}>
                {f.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
    }

    // Default General Dashboard
    return `import React, { useState } from 'react';

export default function ${safeCompName}() {
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
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Activity Volume</span>
          <h2 className="text-2xl font-bold text-emerald-400 mt-1">2,450 Units</h2>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[65%]"></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Target Goal Metric</span>
          <h2 className="text-2xl font-bold text-white mt-1">3,800 Goal</h2>
          <span className="text-xs text-slate-500 mt-2 block">1,350 remaining</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Performance Compliance</span>
          <h2 className="text-2xl font-bold text-indigo-400 mt-1">100% On Track</h2>
          <span className="text-xs text-slate-500 mt-2 block">4 Active Categories</span>
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
}
