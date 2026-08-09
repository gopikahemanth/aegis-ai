import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export const Dashboard: React.FC<any> = () => {
  const [file, setFile] = useState<File | null>(null);
  
  const { mutate, data, isLoading } = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/scans', { method: 'POST', body: formData });
      return response.json();
    }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Resume Scan Dashboard</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {data && (
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Analysis Results</h2>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-indigo-600">{data.matchScore}%</div>
              <p className="text-slate-600">Match Score calculated against job requirements.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
export default Dashboard;
