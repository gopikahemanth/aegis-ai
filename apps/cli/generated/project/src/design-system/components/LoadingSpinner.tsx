import React from "react";

export function LoadingSpinner(props: any) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
    </div>
  );
}

export default LoadingSpinner;
export const Spinner = LoadingSpinner;