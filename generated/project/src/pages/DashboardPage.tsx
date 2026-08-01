import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScoreCard } from '../components/ScoreCard';
import { ATSScoreChart } from '../components/ATSScoreChart';
import { KeywordMatchList } from '../components/KeywordMatchList';
import { ImprovementSuggestions } from '../components/ImprovementSuggestions';
import { AnalysisResult } from '../types';
import { generatePdfReport } from '../services/atsAnalysisService';
import { Download, FileText, ArrowLeft, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('latest_scan_result');
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      const history = JSON.parse(localStorage.getItem('ats_scan_history') || '[]');
      if (history.length > 0) {
        setResult(history[0]);
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-xl">
          <FileText className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Active Scan Found</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Upload your resume and paste a job description on the home page to view detailed ATS diagnostics.
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Scanner</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Analysis Report</span>
            <span>•</span>
            <span>{result.date}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-3">
            <span>{result.fileName}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-800 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Scan</span>
          </Link>
          <button
            onClick={() => generatePdfReport(result)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 flex items-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <ScoreCard score={result.score} />
        <div className="lg:col-span-2">
          <ATSScoreChart categories={result.categories} />
        </div>
      </div>

      <div className="space-y-8">
        <KeywordMatchList
          foundKeywords={result.foundKeywords}
          missingKeywords={result.missingKeywords}
        />
        <ImprovementSuggestions recommendations={result.recommendations} />
      </div>
    </div>
  );
};