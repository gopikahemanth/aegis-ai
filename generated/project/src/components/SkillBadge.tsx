import React from 'react';

interface SkillBadgeProps {
  name: string;
  level: number;
  description: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ name, level, description }) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-200">{name}</span>
        <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          {level}%
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      <div className="w-full bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000"
          style={{ width: `${level}%` }}
        ></div>
      </div>
    </div>
  );
};