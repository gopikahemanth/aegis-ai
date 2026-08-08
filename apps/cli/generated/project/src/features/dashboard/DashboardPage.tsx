import React, { useState } from 'react';
import { MatchScoreCard } from './components/MatchScoreCard';
import { UploadSection } from './components/UploadSection';

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<any>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white">ATS Keyword Scanner</h1>
        <p className="text-slate-400">Upload your resume to receive an instant compatibility score.</p>
      </section>

      <UploadSection onAnalysisComplete={setAnalysis} />

      {analysis && (
        <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MatchScoreCard score={analysis.matchScore} />
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Keyword Breakdown</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.matchedKeywords.map((kw: string) => (
                <span key={kw} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}