import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { db } from '../db';
import { resumes } from '../db/schema';
import { NlpService } from '../services/nlpService';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const analysis = NlpService.calculateMatch(pdfData.text, jobDescription);

    const [record] = await db.insert(resumes).values({
      fileName: req.file.originalname,
      content: pdfData.text,
      keywords: { found: analysis.found, missing: analysis.missing },
      matchScore: analysis.score
    }).returning();

    return res.status(201).json(record);
  } catch (error) {
    console.error('Analysis controller error:', error);
    return res.json([]);
  }
};