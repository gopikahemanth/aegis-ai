import React from 'react';
import { useDropzone } from 'react-dropzone';

export const FileUploader = (props: any) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => files[0] && onUpload(files[0])
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed border-slate-300 p-12 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors text-center">
      <input {...getInputProps()} />
      <p className="text-slate-600">Drag & drop resume PDF here</p>
    </div>
  );
};
export default FileUploader;
