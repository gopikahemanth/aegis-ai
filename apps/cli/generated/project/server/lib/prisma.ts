import React, { useState } from 'react';

export default function prisma() {
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

import { PrismaClient } from '@prisma/client';
export const prisma = (globalThis as any).prisma || new PrismaClient();
export default prisma;
export const db = prisma;
