import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const processResume = async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.resume?.[0]) {
      return res.status(400).json({ error: 'Resume file required' });
    }

    const resumeBuffer = files.resume[0].buffer;
    const { text: resumeText } = await pdfParse(resumeBuffer);

    // Business Logic: Scoring calculation
    const jobKeywords = jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const resumeWords = new Set(resumeText.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    
    const matched = jobKeywords.filter((kw: string) => resumeWords.has(kw));
    const score = Math.round((matched.length / Math.max(jobKeywords.length, 1)) * 100);

    // Persist to DB
    const scan = await prisma.scan.create({
      data: {
        userId: (req as any).user.id,
        compatibilityScore: score,
        report: {
          create: {
            matchedKeywords: matched,
            missingKeywords: jobKeywords.filter((kw: string) => !resumeWords.has(kw)),
            suggestions: ["Include more industry-specific technical certifications."]
          }
        }
      }
    });

    res.status(200).json({ success: true, scanId: scan.id, score });
  } catch (error) {
    res.json([]);
  }
};