import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadResume } from '../services/uploadService';

export const ResumeUploader: React.FC<any> = () => {
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (data) => {
      // Handle success routing
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  return (
    <div className="p-8 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center gap-4">
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept=".pdf" 
        className="hidden" 
        id="resume-upload" 
      />
      <label 
        htmlFor="resume-upload"
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
      >
        {file ? file.name : "Select PDF Resume"}
      </label>
      <button 
        disabled={!file || mutation.isPending}
        onClick={() => file && mutation.mutate(file)}
        className="px-6 py-2 bg-slate-800 rounded-lg disabled:opacity-50"
      >
        {mutation.isPending ? "Analyzing..." : "Analyze Match"}
      </button>
    </div>
  );
};
export default ResumeUploader;
