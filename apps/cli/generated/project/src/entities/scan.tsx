export interface Scan {
  id: string;
  userId: string;
  matchScore: number;
  matchedKeywords: string[];
  missingSkills: string[];
  createdAt: Date;
}

export interface AnalysisResponse {
  matchScore: number;
  breakdown: {
    matched: string[];
    missing: string[];
    totalAnalyzed: number;
  };
  extractedTextSnippet: string;
}

// src/server/routes/scanRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import analyzeResumeHandler from "../controllers/scanController";
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post('/analyze', authMiddleware, upload.single('resume'), analyzeResumeHandler);

export default router;

// src/server/controllers/scanController.ts
import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const analyzeResumeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded' });
      return;
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      res.status(400).json({ error: 'Job description is required' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    const cleanText = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const jdWords = Array.from(new Set(cleanText(jobDescription).split(/\s+/).filter(w => w.length > 3)));
    const resumeClean = cleanText(resumeText);

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    jdWords.forEach(word => {
      if (resumeClean.includes(word)) {
        matchedKeywords.push(word);
      } else {
        missingKeywords.push(word);
      }
    });

    const totalKeywords = jdWords.length || 1;
    const matchScore = Math.round((matchedKeywords.length / totalKeywords) * 100);

    res.status(200).json({
      matchScore,
      breakdown: {
        matched: matchedKeywords,
        missing: missingKeywords,
        totalAnalyzed: totalKeywords
      },
      extractedTextSnippet: resumeText.slice(0, 300) + '...'
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Internal server error during analysis' });
  }
};

// src/features/upload/components/ResumeDropzone.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onFileAccepted: (file: File) => void;
}

export const ResumeDropzone: React.FC<any> = ({ onFileAccepted }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) onFileAccepted(acceptedFiles[0 as any]);
  }, [onFileAccepted as any]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] } 
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer text-center 
      ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500'}`}
    >
      <input {...getInputProps()} aria-label="Upload Resume PDF" />
      <p className="text-slate-400">Drag & drop your resume PDF here, or click to select</p>
    </div>
  );
};
export type { Props };
