import { Request, Response } from 'express';
import { calculateResumeMatch } from '../../shared/utils/scoring-algorithms';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { parsedText, jobDescription } = req.body;
    const userId = (req as any).user.id;

    const result = calculateResumeMatch(parsedText, jobDescription);

    const report = await prisma.analysisReport.create({
      data: {
        userId,
        resumeText: parsedText,
        jobDescription,
        matchPercentage: result.score,
        matchedKeywords: result.matchedKeywords,
        missingSkills: result.missingKeywords
      }
    });

    res.status(201).json(report);
  } catch (error) {
    res.json([]);
  }
};