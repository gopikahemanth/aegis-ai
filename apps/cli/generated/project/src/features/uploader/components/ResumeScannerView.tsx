import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../../shared/components/Button';
import { api } from '../../../services/api';

export const ResumeScannerView: React.FC<any> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/api/analysis', formData);
      return data;
    }
  });

  const handleSubmit = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescriptionText', jd);
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
      <h1 className="text-2xl font-bold text-white mb-6">Resume Keyword Scanner</h1>
      
      <div className="space-y-4">
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
        />
        
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
          placeholder="Paste job description here..."
        />

        <Button 
          onClick={handleSubmit} 
          loading={mutation.isPending}
          disabled={!file || !jd}
        >
          Analyze Resume
        </Button>
      </div>
    </div>
  );
};
export default ResumeScannerView;
