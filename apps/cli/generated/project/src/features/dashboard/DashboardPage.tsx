import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../shared/components/Card';
import { useDashboardData } from './hooks/useDashboardData';

const DashboardPage: React.FC<any> = () => {
  const { data: scans, isLoading, error } = useDashboardData();

  if (isLoading) return <div className="animate-pulse h-96 bg-slate-800 rounded-xl" />;
  if (error) return <div className="text-red-400">Failed to load history.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-2xl font-bold text-white">Resume Scans</h1>
        <p className="text-slate-400">View your latest job match analysis reports.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Scans" value={scans?.length || 0} />
        <Card title="Avg Match Score" value={`${calculateAvg(scans)}%`} />
        <Card title="Missing Skills Found" value={calculateMissing(scans)} />
      </section>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        {/* Table implementation with @tanstack/react-table goes here */}
      </div>
    </motion.div>
  );
};

export default DashboardPage;
export { DashboardPage };
