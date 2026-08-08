import React, { useMemo } from 'react';
import { AnimatedMatchScoreGauge } from '../../../shared/components/AnimatedMatchScoreGauge';

interface StatsOverviewProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score: number;
  totalSkills: number;
  missingSkills: string[];
}

export const StatsOverview: React.FC<any> = ({ score, totalSkills, missingSkills }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      <AnimatedMatchScoreGauge score={score} />
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <h3 className="text-sm font-medium text-slate-500">Skill Coverage</h3>
        <p className="text-3xl font-bold text-slate-900 mt-2">{totalSkills} Skills Identified</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <h3 className="text-sm font-medium text-slate-500">Gap Analysis</h3>
        <p className="text-3xl font-bold text-rose-600 mt-2">{missingSkills.length} Missing Competencies</p>
      </div>
    </div>
  );
};
export default StatsOverview;

export type { StatsOverviewProps };
