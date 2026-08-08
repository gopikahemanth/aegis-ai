const onSubmit = (data: any) => console.log(data);
import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scanService } from '../services/scan.service';

export const UploadForm: React.FC<any> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');

  const mutation = useMutation({
    mutationFn: scanService.analyze,
    onSuccess: (data) => console.log('Scan Complete:', data)
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) return;
    mutation.mutate({ file, jobDescription });
  }, [file, jobDescription, mutation]);

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">New Resume Analysis</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Description</label>
          <textarea 
            className="w-full h-32 p-3 border rounded-lg focus:ring-2 ring-indigo-500"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700"
        />
        <button 
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>
    </form>
  );
};
export default UploadForm;
