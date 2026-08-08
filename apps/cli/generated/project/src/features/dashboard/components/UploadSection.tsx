import React, { useState } from 'react';
import { scanResume } from '../../analyzer/services/api';

export const UploadSection: React.FC<{ onAnalysisComplete: (data: any) => void }> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');

  const handleScan = async () => {
    if (!file || !jd) return;
    const result = await scanResume(file, jd);
    onAnalysisComplete(result);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <textarea 
        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
        placeholder="Paste your job description here..."
        onChange={(e) => setJd(e.target.value)}
      />
      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button 
        onClick={handleScan}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
      >
        Analyze Resume
      </button>
    </div>
  );
};