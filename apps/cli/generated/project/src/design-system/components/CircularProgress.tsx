import React from "react";

export interface CircularProgressProps {
  value?: number;
  size?: number;
  className?: string;
}

export function CircularProgress({ value = 0, size = 40, className = "" }: CircularProgressProps) {
  return (
    <div className={`relative inline-flex items-center justify-center font-bold text-cyan-400 ${className}`} style={{ width: size, height: size }}>
      <span>{Math.round(value)}%</span>
    </div>
  );
}

export default CircularProgress;