import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handleScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobDescription, jobTitle } = req.body;
    const userId = (req as any).user?.id;

    if (!req.file || !jobDescription || !userId) {
      res.status(400).json({ error: 'Missing required fields: resume file, job description, or user context.' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const analysis = analyzeResumeText(pdfData.text, jobDescription);

    const scanResult = await prisma.scanResult.create({
      data: {
        userId,
        fileName: req.file.originalname,
        jobTitle: jobTitle || 'Standard Position',
        matchPercentage: analysis.matchScore,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
      }
    });

    res.status(200).json({ success: true, data: scanResult });
  } catch (error) {
    console.error('Scan Error:', error);
    res.json([]);
  }
};

const analyzeResumeText = (resumeText: string, jobDescription: string) => {
  const cleanText = resumeText.toLowerCase();
  const rawKeywords = jobDescription.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const stopWords = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'is', 'on', 'with', 'an', 'at', 'by']);
  const keywords = Array.from(new Set(rawKeywords.filter(w => w.length > 3 && !stopWords.has(w))));

  const matchedKeywords = keywords.filter(k => cleanText.includes(k));
  const missingKeywords = keywords.filter(k => !cleanText.includes(k));
  
  const matchScore = keywords.length > 0 
    ? Math.round((matchedKeywords.length / keywords.length) * 100) 
    : 0;

  return { matchScore, matchedKeywords, missingKeywords };
};