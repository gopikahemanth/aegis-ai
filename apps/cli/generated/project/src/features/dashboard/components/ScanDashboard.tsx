import React, { useState } from 'react';
import { Card } from '../../../shared/components/Card';
import { motion } from 'framer-motion';
import { cn } from '../../../shared/utils/cn';

export const ScanDashboard: React.FC<any> = () => {
  const [matchData, setMatchData] = useState<{ matchScore: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Resume Scan Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <p className="text-sm text-slate-500">Match Score</p>
          <p className="text-3xl font-semibold text-indigo-600">
            {matchData ? `${matchData.matchScore}%` : '--'}
          </p>
        </Card>
      </div>

      <motion.div 
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white"
        )}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        <p className="text-slate-600 font-medium">Drag & Drop Resume PDF</p>
        <p className="text-xs text-slate-400 mt-2">Maximum file size: 5MB</p>
      </motion.div>
    </div>
  );
};
export default ScanDashboard;
