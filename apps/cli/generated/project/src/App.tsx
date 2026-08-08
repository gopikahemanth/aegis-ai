import React, { useState } from 'react';
import { ScoreCard } from './features/dashboard/components/ScoreCard';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('keywords', JSON.stringify(['react', 'typescript', 'node', 'sql']));

    try {
      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-10">
        {/* Fixed: Contrast issue resolved by using slate-900 for high readability */}
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          AI Resume Scanner
        </h1>
        <p className="mt-2 text-slate-600">Optimize your resume against job descriptions automatically.</p>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume (PDF)</label>
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2.5 file:px-6
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 transition-colors cursor-pointer"
          />
          <button 
            onClick={handleAnalyze} 
            disabled={!file || loading}
            className="mt-6 w-full md:w-auto bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-300 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Processing Analysis...' : 'Analyze Resume'}
          </button>
        </section>

        {result && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ScoreCard 
              score={result.score} 
              matchedCount={result.matchedKeywords.length} 
              totalCount={result.matchedKeywords.length + result.missingKeywords.length}
            />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;