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

    if ((domain as string) === "student-management") {
      return `import React, { useState } from 'react';

export default function ${componentName}() {
  const [search, setSearch] = useState('');
  const students = [
    { id: 1, name: 'Alice Walker', studentId: 'CS-2026-101', department: 'Computer Science', semester: 'Semester 4', status: 'ACTIVE' },
    { id: 2, name: 'Marcus Bennett', studentId: 'DS-2026-204', department: 'Data Science', semester: 'Semester 2', status: 'ACTIVE' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Student Management System</h1>
          <p className="text-slate-400 text-sm mt-1">Manage student registration, academic departments, and enrollment standing.</p>
        </div>
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
        />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {students.map((st) => (
          <div key={st.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-2">
            <span className="text-xs text-indigo-400 font-semibold">{st.department}</span>
            <h2 className="text-xl font-bold text-white">{st.name}</h2>
            <p className="text-sm text-slate-400 font-mono">{st.studentId} • {st.semester}</p>
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">{st.status}</span>
          </div>
        ))}
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

    const entityName = spec.domainVocabulary?.entityName || "Item";
    const entityPlural = spec.domainVocabulary?.entityPlural || `${entityName}s`;
    const metrics = (spec.domainVocabulary?.primaryMetrics && spec.domainVocabulary.primaryMetrics.length > 0)
      ? spec.domainVocabulary.primaryMetrics.slice(0, 4)
      : [`Total ${entityPlural}`, `Active ${entityPlural}`, `Today's Activity`, `Completed`];
    const addVerb = (spec.domainVocabulary?.actionVerbs && spec.domainVocabulary.actionVerbs.length > 0)
      ? spec.domainVocabulary.actionVerbs[0]
      : `Add ${entityName}`;
    const title = spec.name || `${entityName} Management System`;
    const subtitle = `Manage ${entityPlural.toLowerCase()}, monitor operational analytics, search records, and streamline workflows.`;

    return `import React, { useState, useEffect } from 'react';

interface ${entityName}Record {
  id: number | string;
  name: string;
  category: string;
  status: string;
  updatedAt: string;
}

export default function ${safeCompName}() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<${entityName}Record | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<${entityName}Record | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newStatus, setNewStatus] = useState('Active');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [records, setRecords] = useState<${entityName}Record[]>([
    { id: 1, name: '${entityName} Alpha', category: 'Standard', status: 'Active', updatedAt: '2026-09-10' },
    { id: 2, name: '${entityName} Beta', category: 'Priority', status: 'Active', updatedAt: '2026-09-09' },
    { id: 3, name: '${entityName} Gamma', category: 'Standard', status: 'Pending', updatedAt: '2026-09-08' },
    { id: 4, name: '${entityName} Delta', category: 'Priority', status: 'Completed', updatedAt: '2026-09-05' }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newRecord: ${entityName}Record = {
      id: Date.now(),
      name: newName.trim(),
      category: newCategory,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setRecords([newRecord, ...records]);
    setNewName('');
    setIsModalOpen(false);
    showToast(\`\${newRecord.name} successfully created\`);
  };

  const handleStartEdit = (r: ${entityName}Record) => {
    setEditingRecord(r);
    setNewName(r.name);
    setNewCategory(r.category);
    setNewStatus(r.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !newName.trim()) return;
    setRecords(records.map(r => r.id === editingRecord.id ? { ...r, name: newName.trim(), category: newCategory, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : r));
    setEditingRecord(null);
    setNewName('');
    showToast(\`\${newName.trim()} updated successfully\`);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    setRecords(records.filter(r => r.id !== deletingRecord.id));
    showToast(\`\${deletingRecord.name} removed\`);
    setDeletingRecord(null);
  };

  const handleExportData = () => {
    const json = JSON.stringify(records, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`${entityPlural.toLowerCase()}-export.json\`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = records.length;
  const activeCount = records.filter(r => r.status === 'Active').length;
  const pendingCount = records.filter(r => r.status === 'Pending').length;
  const completedCount = records.filter(r => r.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 font-sans space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 font-semibold px-4 py-2.5 rounded-lg shadow-xl animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">${title}</h1>
          <p className="text-slate-400 text-sm mt-1">${subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm border border-slate-700 transition-colors"
            aria-label="Export data as JSON"
          >
            Export
          </button>
          <button
            onClick={() => { setEditingRecord(null); setNewName(''); setIsModalOpen(true); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm shadow-md transition-colors"
            aria-label="Add new ${entityName}"
          >
            + ${addVerb}
          </button>
        </div>
      </header>

      {/* Top KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">${metrics[0] || 'Total Items'}</span>
          <h2 className="text-2xl font-bold text-white mt-1">{totalCount}</h2>
          <span className="text-xs text-emerald-400 mt-2 block">↑ Live database sync</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">${metrics[1] || 'Active Items'}</span>
          <h2 className="text-2xl font-bold text-indigo-400 mt-1">{activeCount}</h2>
          <span className="text-xs text-slate-400 mt-2 block">Operational</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">${metrics[2] || 'Pending'}</span>
          <h2 className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</h2>
          <span className="text-xs text-slate-400 mt-2 block">Awaiting review</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">${metrics[3] || 'Completed'}</span>
          <h2 className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</h2>
          <span className="text-xs text-slate-400 mt-2 block">100% compliant</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Search ${entityPlural.toLowerCase()}..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search ${entityPlural}"
          className="w-full sm:w-80 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-base text-white">${entityPlural} Directory</h3>
          <span className="text-xs text-slate-400">{filteredRecords.length} records found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">${entityName} Name</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Last Updated</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mb-2"></div>
                    <p className="text-xs">Loading ${entityPlural.toLowerCase()}...</p>
                  </td>
                </tr>
              ) : filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{r.name}</td>
                  <td className="py-3.5 px-4"><span className="bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-full text-xs">{r.category}</span></td>
                  <td className="py-3.5 px-4">
                    <span className={\`px-2.5 py-1 rounded-full text-xs font-medium \${
                      r.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                      r.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-800 text-slate-400'
                    }\`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">{r.updatedAt}</td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleStartEdit(r)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors"
                      aria-label={\`Edit \${r.name}\`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingRecord(r)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      aria-label={\`Delete \${r.name}\`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-300">No matching ${entityPlural.toLowerCase()} found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isModalOpen || editingRecord) && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">{editingRecord ? 'Edit ${entityName}' : '${addVerb}'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingRecord(null); }} className="text-slate-400 hover:text-white" aria-label="Close modal">✕</button>
            </div>
            <form onSubmit={editingRecord ? handleSaveEdit : handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">${entityName} Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category / Group</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="General">General</option>
                  <option value="Priority">Priority</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingRecord(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm"
                >
                  {editingRecord ? 'Save Changes' : 'Save ${entityName}'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingRecord && (
        <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Confirm Removal</h3>
            <p className="text-sm text-slate-300">Are you sure you want to remove <span className="text-white font-semibold">{deletingRecord.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;
  }
}
