import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { extractTextFromPdf } from '../services/pdf.service';
import { analyzeKeywords } from '../services/keyword.service';
import { MulterRequest } from '../middleware/upload.middleware';

export const uploadResume = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const text = await extractTextFromPdf(req.file.buffer);
    res.json({ text });
  } catch (error) {
    res.json([]);
  }
};

export const analyzeResume = async (req: Request, res: Response) => {
  const { userId, resumeText, jdText } = req.body;
  const analysis = await analyzeKeywords(resumeText, jdText);
  
  const savedScan = await prisma.analysisResult.create({
    data: {
      userId,
      
      jobDescription: jdText,
      matchScore: analysis.score,
      missingKeywords: analysis.gaps,
      
    }
  });
  
  res.json(savedScan);
};