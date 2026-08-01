import React from 'react';
import { ShieldCheck, Zap, FileText, Lock, Award, Cpu } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Professional ATS Intelligence Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
          How ATS ScanPro Works
        </h1>
        <p className="text-slate-400 text-base leading-relaxed">
          Designed to bridge the gap between candidate resumes and modern Applicant Tracking Systems (ATS) used by top employers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Deep Document Parsing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extracts raw text directly in your browser from PDF, DOCX, and TXT files using advanced client-side parsing libraries.
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Heuristic Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluates keyword matches, core skill density, education verification, work history depth, and formatting standards.
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">100% Client-Side Privacy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your resume never leaves your computer. All parsing and analysis occur entirely in your local browser environment.
          </p>
        </div>
      </div>
    </div>
  );
};