import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AnimatedMatchScoreGauge } from '../../components/AnimatedMatchScoreGauge';

export default function DashboardPage(props: any) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['resume-history'],
    queryFn: () => fetch('/api/resumes').then(res => res.json())
  });

  if (isLoading) return <div className="animate-pulse space-y-4" />;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Your Resume Insights</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {history?.map((item: any) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <h3 className="font-semibold">{item.fileName}</h3>
            <AnimatedMatchScoreGauge score={item.analysis.score} />
          </motion.div>
        ))}
      </section>
    </div>
  );
}
export { DashboardPage };
