import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { cn } from '../../../shared/utils/cn';

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
    multiple: false,
    disabled: isUploading
  });

  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors duration-200",
        isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-slate-400",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} aria-label="Upload PDF Resume" />
      <p className="text-sm text-slate-600 font-medium">
        {isUploading ? "Processing..." : "Drag & drop your PDF resume here, or click to select"}
      </p>
      <p className="text-xs text-slate-400 mt-2">Maximum file size: 5MB</p>
    </motion.div>
  );
};
export default ResumeDropzone;

export type { Props };
