import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';

export function UploadDashboard(props: any) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/scan/analyze', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Failed to analyze');
      return res.json();
    }
  });

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => setFile(files[0]),
    accept: { 'application/pdf': ['.pdf'] }
  });

  return (
    <div className="max-w-3xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Analyze New Resume</h2>
      
      <div {...getRootProps()} className="border-2 border-dashed border-slate-700 p-12 text-center rounded-xl cursor-pointer hover:border-indigo-500 transition-colors">
        <input {...getInputProps()} />
        <p className="text-slate-400">{file ? file.name : "Drag & drop PDF here"}</p>
      </div>

      <textarea 
        className="w-full mt-6 p-4 bg-slate-950 text-white rounded-lg border border-slate-700"
        placeholder="Paste job description requirements here..."
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <button 
        onClick={() => {
          const fd = new FormData();
          if (file) fd.append('resume', file);
          fd.append('jobDescription', jobDescription);
          mutation.mutate(fd);
        }}
        className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-all"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Analyzing...' : 'Run Match Analysis'}
      </button>
    </div>
  );
}
export default UploadDashboard;
