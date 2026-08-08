import { motion } from 'framer-motion';
import React from 'react';

export interface MetricProps {
  label: string;
  value: string | number;
  className?: string;
}

/**
 * DashboardMetric Component
 * Renders a data point within the dashboard with motion animations.
 */
export const DashboardMetric: React.FC<any> = ({ label, value, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900 border border-zinc-800 p-6 rounded-xl ${className}`}
    >
      <p className="text-zinc-400 text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </motion.div>
  );
};
export const DashboardMetrics = DashboardMetric;

export default DashboardMetrics;
