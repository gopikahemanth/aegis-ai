import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { extractTextFromPDF } from '../services/pdfExtractor';
import { analyzeKeywords } from '../services/nlpProcessor';
import { calculateScore } from '../services/scoreCalculator';

export const analyzeResume = async (req: Request, res: Response) => {
  const { jobDescription } = req.body;
  const file = req.file;

  if (!file || !jobDescription) {
    return res.status(400).json({ error: 'Missing file or job description' });
  }

  try {
    // 1. Parse
    const rawText = await extractTextFromPDF(file.buffer);
    
    // 2. Analyze
    const { skills, density } = await analyzeKeywords(rawText, jobDescription);
    
    // 3. Score
    const { score, missing } = calculateScore(skills, jobDescription);

    // 4. Persist
    const result = await prisma.resume.create({
      data: {
        userId: req.user.id,
        fileName: file.originalname,
        rawContent: rawText,
        parsedSkills: skills,
        analysis: {
          create: {
            score,
            missingSkills: missing,
            keywordDensity: density as any
          }
        }
      },
      include: { analysis: true }
    });

    res.json(result);
  } catch (error) {
    res.json([]);
  }
};