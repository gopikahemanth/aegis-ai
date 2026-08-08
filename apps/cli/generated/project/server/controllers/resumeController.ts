import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { extractTextFromPdf } from '../services/pdfExtractor';
import { analyzeSkills } from '../services/nlpProcessor';
import { calculateMatchScore } from '../services/scoreCalculator';

const prisma = new PrismaClient();

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    const resumeFile = req.file;

    if (!resumeFile || !jobDescription) {
      return res.status(400).json({ error: 'Missing resume file or job description' });
    }

    const rawText = await extractTextFromPdf(resumeFile.buffer);
    const skills = await analyzeSkills(rawText);
    const matchData = await calculateMatchScore(skills, jobDescription);

    const result = await prisma.analysisResult.create({
      data: {
        resume: { create: { rawContent: rawText, parsedSkills: skills, userId: (req as any).user.id } },
        score: matchData.score,
        missingSkills: matchData.missingSkills,
        keywordDensity: matchData.density
      }
    });

    res.status(200).json(result);
  } catch (error) {
    res.json([]);
  }
};