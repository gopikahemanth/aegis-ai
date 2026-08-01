import React from 'react';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

interface ImprovementSuggestionsProps {
  recommendations: string[];
}

export const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({ recommendations }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center space-x-2">
        <Lightbulb className="w-4 h-4 text-indigo-400" />
        <span>Actionable Recommendations & Insights</span>
      </h3>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 font-bold text-xs">
              {index + 1}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
};