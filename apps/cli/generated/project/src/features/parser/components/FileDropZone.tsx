import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onFileUpload: (file: File) => void;
}

export const FileDropZone: React.FC<any> = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) onFileUpload(acceptedFiles[0]);
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1 
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-12 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-slate-600">Drag & drop your resume (PDF) here, or click to select</p>
    </div>
  );
};
export default FileDropZone;

export type { Props };
