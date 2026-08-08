import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/shared/components/Button';
import { DropzoneField } from '@/shared/components/DropzoneField';

export const DashboardPage = () => {
  const [resume, setResume] = useState<File | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/scan/analyze', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    }
  });

  const handleUpload = () => {
    if (!resume) return;
    const formData = new FormData();
    formData.append('resume', resume);
    analyzeMutation.mutate(formData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-100">ResumeScan Dashboard</h1>
      </header>

      <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <DropzoneField 
          onFileAccepted={setResume} 
          label="Upload your resume (PDF only)" 
        />
        <Button 
          className="mt-4 w-full" 
          onClick={handleUpload}
          disabled={!resume || analyzeMutation.isPending}
        >
          {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Match'}
        </Button>
      </section>
      
      {/* Result cards would be conditionally rendered here */}
    </div>
  );
};

export default DashboardPage;
