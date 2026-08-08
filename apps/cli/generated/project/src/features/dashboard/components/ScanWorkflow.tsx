import React, { useState } from 'react';
import scanService from '../services/scanService'; // Assuming default export
import { ScoreCard } from './ScoreCard';

// If scanService used a named export, use: import { scanResume } from '../services/scanService';

export const ScanWorkflow: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDesc) return;

    setLoading(true);
    try {
      // Use the imported service function
      const response = await scanService.scanResume({ 
        resume: file, 
        jobDescription: jobDesc, 
        jobTitle: 'Job Scan' 
      });
      setResult(response.data);
    } catch (err) {
      console.error("Scan submission failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of the render logic remains the same) ...
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Form and UI elements */}
    </div>
  );
};

export default ScanWorkflow;