import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const resumeFile = files.resume?.[0];
    const jdFile = files.jd?.[0];

    if (!resumeFile || !jdFile) {
      return res.status(400).json({ error: 'Both files required' });
    }

    const resumeText = (await pdfParse(resumeFile.buffer)).text;
    const jdText = (await pdfParse(jdFile.buffer)).text;

    // Simple NLP logic for demonstration
    const resumeWords = new Set(resumeText.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    const jdKeywords = Array.from(new Set(jdText.toLowerCase().match(/\b[a-z]{4,}\b/g) || []));
    
    const matched = jdKeywords.filter(kw => resumeWords.has(kw));
    const missing = jdKeywords.filter(kw => !resumeWords.has(kw));
    const score = Math.round((matched.length / Math.max(jdKeywords.length, 1)) * 100);

    const scan = await prisma.scan.create({
      data: {
        userId: (req as any).user.id,
        compatibilityScore: score,
        resume: { create: { fileName: resumeFile.originalname, rawText: resumeText } },
        jobDescription: { create: { companyName: 'N/A', roleTitle: 'Analyzed Position', rawText: jdText } },
        report: { create: { matchedKeywords: matched.slice(0, 10), missingKeywords: missing.slice(0, 10), suggestions: ['Improve keyword density'] } }
      },
      include: { report: true }
    });

    res.json(scan);
  } catch (error) {
    res.json([]);
  }
};