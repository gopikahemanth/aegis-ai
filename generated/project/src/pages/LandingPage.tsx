import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResumeDropzone } from '../components/ResumeDropzone';
import { JobDescriptionInput } from '../components/JobDescriptionInput';
import { analyzeResumeText } from '../services/atsAnalysisService';
import { ShieldCheck, ArrowRight, Zap, FileSearch, Award, Loader2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const navigate = useNavigate();

  const handleStartAnalysis = async () => {
    if (!file) {
      alert('Please upload a resume file first.');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Please paste a job description.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    try {
      const result = await analyzeResumeText(file, jobDescription);
      sessionStorage.setItem('latest_scan_result', JSON.stringify(result));
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[ATS Analysis Error]', err);
      const msg = err?.message || String(err);
      if (msg.includes('worker') || msg.includes('Worker') || msg.includes('pdf')) {
        setErrorMsg('PDF parsing failed. Try saving your resume as a .txt file and uploading that, or use a DOCX file. Technical detail: ' + msg.slice(0, 120));
      } else if (msg.includes('mammoth') || msg.includes('docx')) {
        setErrorMsg('DOCX parsing failed. Try saving your resume as .txt. Technical detail: ' + msg.slice(0, 120));
      } else {
        setErrorMsg('Analysis failed: ' + msg.slice(0, 200));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Advanced AI-Powered ATS Scanner</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Beat the ATS. <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Land More Interviews.</span>
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed">
          Instantly evaluate your resume against real job descriptions. Detect missing keywords, fix formatting flaws, and maximize your ATS score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2 flex items-center space-x-2">
              <FileSearch className="w-5 h-5 text-indigo-400" />
              <span>Step 1: Upload Your Resume</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Upload in PDF, DOCX, or TXT format.</p>
          </div>
          <ResumeDropzone file={file} onFileSelect={setFile} />
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2 flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Step 2: Add Job Description</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">Paste the complete job posting details below.</p>
          </div>
          <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleStartAnalysis}
          disabled={isAnalyzing}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center space-x-3 disabled:opacity-50 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing Resume &amp; Keywords...</span>
            </>
          ) : (
            <>
              <span>Run ATS Scan Now</span>
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
        {errorMsg && (
          <div className="max-w-2xl w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-300">
            <p className="font-semibold text-red-200 mb-1">⚠ Analysis Error</p>
            <p>{errorMsg}</p>
            <p className="mt-2 text-xs text-red-400">Tip: If your PDF is failing, try opening it and saving as <strong>.txt</strong> (plain text), then re-upload.</p>
          </div>
        )}
      </div>
    </div>
  );
};