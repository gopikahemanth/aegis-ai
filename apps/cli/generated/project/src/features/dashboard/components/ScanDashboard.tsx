import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export const ScanDashboard: React.FC<any> = () => {
  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: () => fetch('/api/scans').then(res => res.json())
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scans?.map((scan: any) => (
        <motion.div 
          key={scan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white">Score: {scan.matchScore}%</h3>
          <p className="text-sm text-slate-400 mt-2">Analyzed: {new Date(scan.createdAt).toLocaleDateString()}</p>
        </motion.div>
      ))}
    </div>
  );
};
export default ScanDashboard;
