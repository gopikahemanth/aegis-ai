import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileUploader } from '@/shared/components/FileUploader';

export const AnalysisView = () => {
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/scan/analyze', { method: 'POST', body: data });
      return res.json();
    },
    onSuccess: (data) => setResult(data)
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">Analyze New Resume</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FileUploader 
          onUpload={(file) => {
            const fd = new FormData();
            fd.append('resume', file);
            mutation.mutate(fd);
          }} 
        />
        {result && (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-bold mb-4">Match Score: {result.matchScore}%</h2>
            <div className="flex flex-wrap gap-2">
              {result.matchedKeywords.map((k: string) => (
                <span key={k} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AnalysisView;
