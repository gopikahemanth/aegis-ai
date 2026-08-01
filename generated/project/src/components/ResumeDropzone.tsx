import React, { useCallback } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface ResumeDropzoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
}

export const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ file, onFileSelect }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center flex flex-col items-center justify-center ${
        file
          ? 'border-indigo-500/50 bg-indigo-950/10'
          : 'border-slate-800 bg-slate-900/40 hover:border-indigo-500/40 hover:bg-slate-900/60'
      }`}
    >
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {file ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="font-semibold text-slate-200 text-base">{file.name}</p>
            <p className="text-xs text-indigo-400 mt-1 flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready for analysis • {(file.size / 1024).toFixed(1)} KB</span>
            </p>
          </div>
          <span className="text-xs text-slate-400 underline pt-2">Click or drop a different file to replace</span>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 shadow-lg">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="font-semibold text-slate-200 text-base">
              Drop your resume here, or <span className="text-indigo-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, and TXT formats</p>
          </div>
        </div>
      )}
    </div>
  );
};