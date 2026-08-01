import React from 'react';
import { Briefcase } from 'lucide-react';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <span>Target Job Description</span>
        </label>
        <span className="text-xs text-slate-400">{value.length} characters</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the job posting description, requirements, and required skills here..."
        className="w-full flex-grow min-h-[200px] bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50 resize-y text-sm leading-relaxed shadow-inner"
      />
    </div>
  );
};