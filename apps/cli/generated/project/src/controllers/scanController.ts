import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res.status(400).json({ error: 'Resume and Job Description required' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    // NLP logic - simple keyword frequency analysis
    const jobKeywords = req.body.jobDescription.toLowerCase().match(/\b(\w+)\b/g) || [];
    const uniqueKeywords = Array.from(new Set(jobKeywords.filter((w: string) => w.length > 3)));
    
    const matched = uniqueKeywords.filter(word => resumeText.includes(word));
    const missing = uniqueKeywords.filter(word => !resumeText.includes(word));
    const score = Math.round((matched.length / uniqueKeywords.length) * 100);

    const scan = await prisma.scan.create({
      data: {
        userId: (req as any).user.id,
        matchScore: score,
        matchedKeywords: matched as string[],
        missingKeywords: missing as string[],
        jobTitle: req.body.jobTitle || 'Untitled Role'
      }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
};