import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>© {new Date().getFullYear()} ATS ScanPro. Client-side secure resume optimization.</span>
        </div>
        <div className="flex items-center space-x-6">
          <span>Privacy Guaranteed</span>
          <span>•</span>
          <span>PDF & DOCX Parsers Active</span>
          <span>•</span>
          <span>Recharts Analytics</span>
        </div>
      </div>
    </footer>
  );
};