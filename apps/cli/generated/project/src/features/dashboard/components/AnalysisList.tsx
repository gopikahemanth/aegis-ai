import React from 'react';

export interface AnalysisListProps {
  data?: any[];
  isLoading?: boolean;
}

export const AnalysisList: React.FC<AnalysisListProps> = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return <div className="p-4 text-sm text-slate-400 animate-pulse">Loading analysis history...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
        <p className="text-sm text-slate-400">No recent resume scans found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item: any, idx: number) => (
        <div key={item.id || idx} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-white text-sm">{item.fileName || 'Resume Analysis'}</h4>
            <p className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-lg">
            {item.matchScore || 85}% Match
          </span>
        </div>
      ))}
    </div>
  );
};

export default AnalysisList;
