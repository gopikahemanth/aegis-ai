import React from 'react';
import MatchScoreDial from '../../../shared/components/MatchScoreDial';

export interface MatchDashboardProps {
  className?: string;
  children?: any;
  onClick?: any;
  [key: string]: any;

  score?: number;
  skills?: string[];
}

export const MatchDashboard: React.FC<any> = ({ score = 85, skills = ["React", "TypeScript", "Express", "PostgreSQL"] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-900/60 rounded-2xl border border-slate-800">
      <MatchScoreDial score={score} />
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Matched Keywords</h3>
        <ul className="space-y-2">
          {skills.map(s => (
            <li key={s} className="text-sm text-emerald-400 flex items-center space-x-2">
              <span>✓</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MatchDashboard;
