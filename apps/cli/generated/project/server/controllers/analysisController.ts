import { Request, Response } from 'express';
import pdf from 'pdf-parse';
import { calculateMatch } from '../utils/nlpEngine';
import { prisma } from '../lib/prisma';

export const analyzeResumeController = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.resume || !files.jd) {
      return res.status(400).json({ error: 'Missing required files' });
    }

    const resumePdf = await pdf(files.resume[0].buffer);
    const jdPdf = await pdf(files.jd[0].buffer);

    const { score, matched, missing } = calculateMatch(resumePdf.text, jdPdf.text);

    // Save to database
    const submission = await prisma.submission.create({
      data: {
        userId: (req as any).user.id,
        resumeText: resumePdf.text.slice(0, 1000),
        jobDescriptionText: jdPdf.text.slice(0, 1000),
        result: {
          create: {
            matchScore: score,
            matchedKeywords: matched,
            missingKeywords: missing
          }
        }
      },
      include: { result: true }
    });

    res.json(submission);
  } catch (error) {
    res.json([]);
  }
};