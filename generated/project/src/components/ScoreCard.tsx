import React from 'react';
import { Award, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreCardProps {
  score: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  const getBadgeInfo = (s: number) => {
    if (s >= 80) {
      return {
        label: 'Excellent Match',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-950/40 border-emerald-500/30',
        icon: CheckCircle,
        description: 'Your resume is exceptionally well optimized for this job description.',
      };
    } else if (s >= 55) {
      return {
        label: 'Moderate Match',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-950/40 border-amber-500/30',
        icon: AlertTriangle,
        description: 'Good foundation, but integrating more targeted keywords will boost your ranking.',
      };
    } else {
      return {
        label: 'Needs Improvement',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-950/40 border-rose-500/30',
        icon: XCircle,
        description: 'Significant keyword and structural gaps detected against the target job posting.',
      };
    }
  };

  const badge = getBadgeInfo(score);
  const IconComponent = badge.icon;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wider flex items-center space-x-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Overall ATS Compatibility</span>
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${badge.bgColor} ${badge.textColor}`}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{badge.label}</span>
          </span>
        </div>

        <div className="flex items-baseline space-x-3 my-6">
          <span className="text-6xl font-black text-white tracking-tight">{score}</span>
          <span className="text-2xl text-slate-500 font-bold">/100</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          {badge.description}
        </p>
      </div>

      <div className="w-full bg-slate-950/80 rounded-full h-3 p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            score >= 80 ? 'bg-emerald-500' : score >= 55 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};