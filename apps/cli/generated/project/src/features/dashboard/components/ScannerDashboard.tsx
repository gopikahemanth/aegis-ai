const onSubmit = (data: any) => console.log(data);
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../../shared/components/Button';

export const ScannerDashboard: React.FC<any> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/scan', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Analysis failed');
      return res.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold mb-6">Resume Keyword Scanner</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea 
          className="w-full h-40 p-4 border rounded-lg"
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button 
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {mutation.isPending ? 'Analyzing...' : 'Generate Match Score'}
        </Button>
      </form>

      {mutation.data && (
        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h2 className="text-xl font-semibold">Match Score: {mutation.data.score}%</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {mutation.data.matchedKeywords.map((k: string) => (
              <span key={k} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ScannerDashboard;
