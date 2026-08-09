import React, { useState } from 'react';
import { useResumeMatcher } from '../hooks/useResumeMatcher';
import { ScoreGauge } from '../../../shared/components/ScoreGauge';
import { Button } from '../../../shared/components/Button';

export const ScanStepper: React.FC<any> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const { analyzeResume, loading, result, error } = useResumeMatcher();

  const handleScan = () => {
    if (file && jobDescription) {
      analyzeResume(file, jobDescription);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Upload and Analyze</h2>
      
      <div className="space-y-4">
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <textarea 
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <Button onClick={handleScan} disabled={loading || !file || !jobDescription}>
          {loading ? 'Analyzing...' : 'Analyze Match'}
        </Button>
      </div>

      {error && <p className="text-rose-500">{error}</p>}
      {result && (
        <div className="mt-8 flex justify-center">
          <ScoreGauge score={result.matchScore} />
        </div>
      )}
    </div>
  );
};
export default ScanStepper;
