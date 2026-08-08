import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '../../../design-system/components/Button';

interface Props {
  onFileAccepted: (file: File) => void;
  isUploading: boolean;
}

export const ResumeDropzone: React.FC<any> = ({ onFileAccepted, isUploading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) onFileAccepted(acceptedFiles[0]);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
        ${isDragActive ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-8 w-8 text-zinc-500 mb-4" />
      <p className="text-sm text-zinc-300">
        {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume (PDF only)'}
      </p>
      <Button variant="secondary" className="mt-4" loading={isUploading}>
        Select File
      </Button>
    </div>
  );
};
export default ResumeDropzone;

export type { Props };
