import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface AnalysisProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  data: { matchScore: number; matchedKeywords: string[]; missingKeywords: string[] };
}

export const Dashboard: React.FC<any> = ({ data }) => {
  const chartData = useMemo(() => [
    { name: 'Matched', value: data.matchedKeywords.length },
    { name: 'Missing', value: data.missingKeywords.length }
  ], [data]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
    >
      <h2 className="text-2xl font-bold mb-6">Match Score Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                <Cell fill="#4f46e5" />
                <Cell fill="#e2e8f0" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4">
          <div className="text-4xl font-black text-indigo-600">{data.matchScore}%</div>
          <p className="text-slate-600">Overall qualification alignment with job description.</p>
        </div>
      </div>
    </motion.div>
  );
};
export default Dashboard;

export type { AnalysisProps };
