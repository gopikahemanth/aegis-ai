import express, { Request, Response } from 'express';
import multer from 'multer';
import * as pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      file: Express.Multer.File;
      user?: { id: string };
    }
  }
}

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

interface AnalysisResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

/**
 * Analyzes resume content against job description.
 * Encapsulated logic for clean architectural separation.
 */
function analyzeResumeText(resumeText: string, jobDescription: string): AnalysisResult {
  const cleanText = resumeText.toLowerCase();
  const rawKeywords = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/);
  
  const stopWords = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'is', 'on', 'with', 'an', 'at', 'by']);
  const keywords = Array.from(new Set(rawKeywords.filter(w => w.length > 3 && !stopWords.has(w))));

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  keywords.forEach(keyword => {
    if (cleanText.includes(keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  const total = keywords.length;
  const matchScore = total > 0 ? Math.round((matchedKeywords.length / total) * 100) : 0;

  return { matchScore, matchedKeywords, missingKeywords };
}

router.post('/scan', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobDescription, jobTitle } = req.body;
    const userId = req.user?.id;

    if (!req.file || !jobDescription || !userId) {
      res.status(400).json({ error: 'Missing file, job description, or unauthorized' });
      return;
    }

    // pdfParse is imported as a module to handle default export issue
    const pdfData = await pdfParse.default(req.file.buffer);
    const analysis = analyzeResumeText(pdfData.text, jobDescription);

    const scan = await prisma.scanResult.create({
      data: {
        userId,
        fileName: req.file.originalname,
        jobTitle: jobTitle || 'Untitled Job',
        matchPercentage: analysis.matchScore,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
      }
    });

    res.status(200).json({ success: true, ...analysis, id: scan.id });
  } catch (error) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: 'Internal server error during analysis' });
  }
});

export default router;