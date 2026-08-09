import React, { useState } from 'react';
import { Button } from '../../shared/components/Button';

export default function DashboardPage(props: any) {
  const [matchScore, setMatchScore] = useState<number | null>(null);

  return (
    <main className="max-w-7xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Resume Analysis Dashboard</h1>
        <p className="text-slate-500">Track your match scores and optimize applications.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Match Score</h2>
          <div className="text-4xl font-bold mt-2 text-indigo-600">{matchScore ?? '--'}%</div>
        </div>
      </section>
    </main>
  );
}
export { DashboardPage };
