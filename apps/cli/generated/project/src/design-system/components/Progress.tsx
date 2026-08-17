import React from "react";

export interface ProgressProps {
  [key: string]: any;
  scans?: any;
  history?: any;
  data?: any;
  value?: number;
  className?: string;
}

export function Progress({ value = 0, className = "" }: ProgressProps) {
  return (
    <div className={`w-full bg-slate-800 rounded-full h-2.5 overflow-hidden ${className}`}>
      <div
        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default Progress;
