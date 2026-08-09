import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, Button, Input, ProgressTracker } from '../../shared/components';

export default function DashboardPage(props: any) {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      return res.json();
    }
  });

  return (
    <div className="grid lg:grid-cols-2 gap-8 p-8">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Upload & Analyze</h2>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <textarea 
          className="w-full h-48 mt-4 border rounded p-2" 
          placeholder="Paste job description here..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <Button 
          disabled={!file || !jd || mutation.isPending}
          onClick={() => {
            const fd = new FormData();
            if(file) fd.append('resume', file);
            fd.append('jobDescription', jd);
            mutation.mutate(fd);
          }}
        >
          {mutation.isPending ? 'Analyzing...' : 'Run Scan'}
        </Button>
      </Card>

      {mutation.data && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Match Score: {mutation.data.matchScore}%</h3>
          <ProgressTracker progress={mutation.data.matchScore} />
          <div className="mt-6">
            <h4 className="font-medium">Missing Skills:</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {mutation.data.missingKeywords.map((kw: string) => (
                <span key={kw} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
export { DashboardPage };
