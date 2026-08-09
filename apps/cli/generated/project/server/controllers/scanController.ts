import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res.status(400).json({ error: 'Missing resume file or job description' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    const jdText = req.body.jobDescription.toLowerCase();

    // Keyword Extraction Logic
    const keywords = Array.from(new Set(jdText.match(/\b[a-z]{4,}\b/g) || []));
    const matched = keywords.filter(kw => resumeText.includes(kw));
    const missing = keywords.filter(kw => !resumeText.includes(kw));
    const score = Math.round((matched.length / (keywords.length || 1)) * 100);

    const scan = await prisma.scan.create({
      data: {
        userId: (req as any).user.id,
        jobDescription: req.body.jobDescription,
        matchScore: score,
        matchedKeywords: matched,
        missingKeywords: missing,
      }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
};