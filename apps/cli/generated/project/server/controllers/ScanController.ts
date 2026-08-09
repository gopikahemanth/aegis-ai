import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { userId, jobDescription, resumeText } = req.body;

    // Simulation of NLP logic to be expanded into natural/compromise engine
    const keywords = jobDescription.toLowerCase().split(' ').filter((w: string) => w.length > 5);
    const matched = keywords.filter((k: string) => resumeText.toLowerCase().includes(k));
    const score = Math.round((matched.length / Math.max(keywords.length, 1)) * 100);

    const scan = await prisma.resumeScan.create({
      data: {
        userId,
        rawText: resumeText,
        jobDescription,
        matchScore: score,
        matchedKeywords: matched,
        missingSkills: keywords.filter((k: string) => !matched.includes(k))
      }
    });

    res.status(201).json(scan);
  } catch (error) {
    res.json([]);
  }
};