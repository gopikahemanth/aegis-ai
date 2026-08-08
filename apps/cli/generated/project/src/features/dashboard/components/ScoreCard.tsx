import React from 'react';
import { generateAnalysisReport } from '../../../shared/utils/pdfExport';

interface ScoreCardProps {
  score: number;
  matched: string[];
  missing: string[];
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, matched, missing }) => {
  const handleExport = () => {
    generateAnalysisReport({
      score,
      matched,
      missing,
      timestamp: new Date().toLocaleString(),
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Resume Match Score</h2>
        <button 
          onClick={handleExport}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Export PDF
        </button>
      </div>
      
      <div className="flex items-center justify-center py-6">
        <div className="text-6xl font-extrabold text-indigo-600">{score}%</div>
      </div>
      
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
};