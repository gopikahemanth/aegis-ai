import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const AnalysisDashboard: React.FC<any> = ({ data }) => {
  const chartData = [
    { name: 'Matched', value: data.matchScore },
    { name: 'Missing', value: 100 - data.matchScore }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm"
    >
      <h2 className="text-xl font-semibold mb-6">Gap Analysis Results</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={60} outerRadius={80}>
              <Cell fill="#4f46e5" />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 rounded-lg">
          <p className="text-emerald-700 font-medium">Matched Skills</p>
          <p className="text-2xl">{data.breakdown.matched.length}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg">
          <p className="text-amber-700 font-medium">Skills Gap</p>
          <p className="text-2xl">{data.breakdown.missing.length}</p>
        </div>
      </div>
    </motion.div>
  );
};
export default AnalysisDashboard;
