import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });
    
    const { jobDescription, jobTitle } = req.body;
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();

    const keywords = jobDescription.toLowerCase().match(/\b(\w+){4,}\b/g) || [];
    const uniqueKeywords = Array.from(new Set(keywords));
    
    const matched = uniqueKeywords.filter(kw => resumeText.includes(kw));
    const missing = uniqueKeywords.filter(kw => !resumeText.includes(kw));
    const score = Math.round((matched.length / (uniqueKeywords.length || 1)) * 100);

    const result = await prisma.scanResult.create({
      data: {
        userId: (req as any).user.id,
        jobTitle,
        jobDescription,
        matchScore: score,
        matchedSkills: matched,
        missingSkills: missing
      }
    });

    res.json(result);
  } catch (error) {
    res.json([]);
  }
};