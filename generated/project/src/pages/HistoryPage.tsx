import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScanHistoryItem } from '../types';
import { generatePdfReport } from '../services/atsAnalysisService';
import { History, FileText, Download, Trash2, ArrowLeft } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('ats_scan_history') || '[]');
    setHistory(stored);
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your scan history?')) {
      localStorage.removeItem('ats_scan_history');
      setHistory([]);
    }
  };

  const handleSelectReport = (item: ScanHistoryItem) => {
    sessionStorage.setItem('latest_scan_result', JSON.stringify(item));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <History className="w-7 h-7 text-indigo-400" />
            <span>Scan History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Review past resume scans stored securely in your browser.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 font-medium text-xs hover:bg-rose-900/40 transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No scan history found</h3>
          <p className="text-slate-500 text-xs mb-6">Scans you run will automatically appear here for future reference.</p>
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-all inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Run Your First Scan</span>
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6 font-semibold">Resume File</th>
                  <th className="py-4 px-6 font-semibold">Scan Date</th>
                  <th className="py-4 px-6 font-semibold">ATS Score</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-200 flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate max-w-xs">{item.fileName}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">{item.date}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          item.score >= 75
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                            : item.score >= 50
                            ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {item.score}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <Link
                        to="/dashboard"
                        onClick={() => handleSelectReport(item)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-xs underline"
                      >
                        View Report
                      </Link>
                      <button
                        onClick={() => generatePdfReport(item)}
                        className="inline-flex items-center space-x-1 text-slate-300 hover:text-white bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700/60 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};