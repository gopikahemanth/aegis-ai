import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  const { resumeText, jobDescription, jobTitle } = req.body;
  const userId = (req as any).user.id;

  // Simple NLP keyword matching logic
  const jobKeywords = jobDescription.toLowerCase().split(/\W+/).filter((w: string) => w.length > 5);
  const matched = jobKeywords.filter((word: string) => resumeText.toLowerCase().includes(word));
  const missing = jobKeywords.filter((word: string) => !resumeText.toLowerCase().includes(word));
  
  const score = Math.round((matched.length / (jobKeywords.length || 1)) * 100);

  const scan = await prisma.resumeScan.create({
    data: {
      userId,
      matchScore: score,
      matchedKeywords: matched.slice(0, 10),
      missingSkills: missing.slice(0, 10),
      rawText: resumeText,
      jobTitle
    }
  });

  res.json({ success: true, data: scan });
};