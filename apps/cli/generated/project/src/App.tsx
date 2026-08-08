import React from 'react';
import { DashboardPage } from './features/dashboard/DashboardPage';

const App = () => {
  return (
    <main className="app-container">
      <header className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white">Aegis Optimizer</h1>
      </header>
      <section className="flex-1 overflow-auto">
        <DashboardPage />
      </section>
    </main>
  );
};

export default App;