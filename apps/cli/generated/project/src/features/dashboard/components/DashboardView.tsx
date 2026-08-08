import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  score: number;
}

export const DashboardView = ({ score }: DashboardViewProps) => {
  const data = [
    { name: 'Matched', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8"
    >
      <h2 className="text-xl font-semibold text-white mb-6">Compatibility Overview</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
              <Cell fill="#3b82f6" />
              <Cell fill="#1e293b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center">
        <span className="text-4xl font-bold text-white">{score}%</span>
        <p className="text-slate-400 text-sm mt-2">Overall Match Score</p>
      </div>
    </motion.div>
  );
};

export default DashboardView;