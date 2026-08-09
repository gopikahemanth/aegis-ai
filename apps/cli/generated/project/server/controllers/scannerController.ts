import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const { jobDescription, jobTitle } = req.body;
    
    const pdfData = await pdfParse(req.file.buffer);
    const resumeKeywords = new Set(pdfData.text.toLowerCase().match(/\b(\w+)\b/g));
    const jobKeywords = jobDescription.toLowerCase().match(/\b(\w+)\b/g) || [];

    const matched = jobKeywords.filter((kw: string) => resumeKeywords.has(kw));
    const missing = Array.from(new Set(jobKeywords.filter((kw: string) => !resumeKeywords.has(kw))));
    const score = Math.round((matched.length / Math.max(jobKeywords.length, 1)) * 100);

    const scan = await prisma.resumeScan.create({
      data: {
        userId: (req as any).user.id,
        jobTitle,
        matchScore: score,
        matchedKeywords: Array.from(new Set(matched)),
        missingKeywords: missing
      }
    });

    res.json(scan);
  } catch (err) {
    res.json([]);
  }
};