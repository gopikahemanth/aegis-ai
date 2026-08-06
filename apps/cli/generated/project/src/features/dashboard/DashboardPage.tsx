import React, { useState } from 'react';
export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const sampleItems = [
    { id: 1, title: 'Database Schema & Auth Setup', category: 'High Priority', status: 'In Progress', tag: 'Backend' },
    { id: 2, title: 'Kanban Board Drag & Drop', category: 'Medium Priority', status: 'To Do', tag: 'Frontend' },
    { id: 3, title: 'Dark Mode Persistent State', category: 'Low Priority', status: 'Done', tag: 'UI' }
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DashboardPage</h1>
          <p className="text-slate-400 text-sm mt-1">Manage tasks, track project status, and search records in real time.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </header>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'To Do', 'In Progress', 'Done'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['To Do', 'In Progress', 'Done'].map((status) => (
          <div key={status} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center justify-between">
              <span>{status}</span>
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs">Active</span>
            </h2>
            <div className="space-y-3">
              {sampleItems.filter(i => i.status === status && (filter === 'All' || i.category.toLowerCase().includes(filter.toLowerCase()) || i.tag.toLowerCase().includes(filter.toLowerCase()))).map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-indigo-400">{item.tag}</span>
                    <span className="text-slate-500">{item.category}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
