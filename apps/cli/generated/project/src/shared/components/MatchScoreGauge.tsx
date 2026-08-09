import React from 'react';

export const MatchScoreGauge: React.FC<any> = ({ score }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle className="text-zinc-800" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="64" cy="64" />
        <circle
          className="text-violet-500 transition-all duration-1000 ease-out"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
        />
      </svg>
      <span className="absolute text-2xl font-bold text-white">{score}%</span>
    </div>
  );
};
export default MatchScoreGauge;
