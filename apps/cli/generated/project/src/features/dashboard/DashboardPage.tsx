const onSubmit = (data: any) => console.log(data);
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export default function DashboardPage(props: any) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Analysis failed');
      return res.json();
    },
    onSuccess: (data) => setResult(data)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) return;
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);
    mutation.mutate(formData);
  };

  return (
    <main className="max-w-4xl mx-auto p-8 bg-slate-900 min-h-screen text-slate-100">
      <h1 className="text-3xl font-bold mb-8">Resume Keyword Scanner</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea 
          className="w-full p-4 bg-slate-800 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500"
          placeholder="Paste Job Description..."
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button 
          type="submit" 
          disabled={mutation.isPending}
          className="px-6 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Processing...' : 'Analyze Match Score'}
        </button>
      </form>

      {result && (
        <section className="mt-8 p-6 bg-slate-800 rounded-xl">
          <h2 className="text-xl font-semibold">Match Score: {result.score}%</h2>
          <p className="mt-4">Matched: {result.matched.length} keywords</p>
        </section>
      )}
    </main>
  );
}
export { DashboardPage };
