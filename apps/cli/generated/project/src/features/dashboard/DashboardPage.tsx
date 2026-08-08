import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../../shared/components/Layout';
import { ScoreGauge } from '../../shared/components/ScoreGauge';

const DashboardPage: React.FC<any> = () => {
  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Analysis Overview</h1>
          <p className="text-slate-500">Track your career alignment and skill gap trends.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Scans</h3>
            <p className="text-4xl font-bold mt-2 text-indigo-600">12</p>
          </motion.div>
          
          <div className="md:col-span-2 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Latest Match Score</h3>
            <ScoreGauge score={78} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
             {/* DataTable implementation here */}
             <div className="p-8 text-center text-slate-500">No recent scan history available.</div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default DashboardPage;
export { DashboardPage };
