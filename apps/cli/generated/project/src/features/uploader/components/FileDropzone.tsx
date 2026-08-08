import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  onUpload: (file: File) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) onUpload(acceptedFiles[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] } 
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center
        ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-600'}`}
    >
      <input {...getInputProps()} />
      <p className="text-lg">Drag & drop your resume PDF here</p>
      <p className="text-sm text-slate-400 mt-2">Only PDF files are supported</p>
    </div>
  );
};
export default FileDropzone;