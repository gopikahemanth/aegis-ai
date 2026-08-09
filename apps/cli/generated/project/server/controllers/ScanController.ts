import { Request, Response } from 'express';
import { extractTextFromPDF } from '../utils/pdfParser';
import { performKeywordAnalysis } from '../utils/nlpEngine';
import { prisma } from '../index'; // Assuming prisma client is exported from index

export const analyzeResumeScan = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume provided' });
    
    const { jobDescription } = req.body;
    const resumeText = await extractTextFromPDF(req.file.buffer);
    
    const analysis = performKeywordAnalysis({ resumeText, jobDescriptionText: jobDescription });
    
    const record = await prisma.submission.create({
      data: {
        userId: (req as any).user.id,
        jobDescription,
        analysisResult: {
          create: analysis
        }
      },
      include: { analysisResult: true }
    });

    res.json(record);
  } catch (error) {
    res.json([]);
  }
};