import React from 'react';
import { MatchScoreDial } from '../../../shared/components/MatchScoreDial';

export const MatchDashboard: React.FC<any> = ({ scan }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Analysis Summary</h2>
        <p className="text-slate-300 leading-relaxed">{scan.summary}</p>
      </div>
      
      <div className="flex flex-col items-center">
        <MatchScoreDial score={scan.matchScore} />
        <div className="mt-6 w-full">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Missing Skills</h3>
          <ul className="space-y-2">
            {scan.skillGaps.map((skill: string) => (
              <li key={skill} className="text-rose-400 bg-rose-950/30 px-3 py-1 rounded-md text-sm border border-rose-900/50">
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
export default MatchDashboard;
