import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../services/prismaService';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume file provided' });
    
    const { jobDescription } = req.body;
    const resumeData = await pdfParse(req.file.buffer);
    const resumeText = resumeData.text;

    // Simple keyword-based scoring engine for MVP
    const jobKeywords = jobDescription.toLowerCase().split(/\W+/);
    const foundKeywords = jobKeywords.filter((k: string) => k.length > 3 && resumeText.toLowerCase().includes(k));
    const score = Math.round((foundKeywords.length / Math.max(jobKeywords.length, 1)) * 100);

    const analysis = await prisma.resumeAnalysis.create({
      data: {
        userId: (req as any).user.id,
        resumeText,
        jobDescription,
        matchScore: score,
        keywordMatches: { found: foundKeywords }
      }
    });

    res.json(analysis);
  } catch (error) {
    res.json([]);
  }
};