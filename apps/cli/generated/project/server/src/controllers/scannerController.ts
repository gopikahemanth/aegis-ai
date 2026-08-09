import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import Resume from '../models/Resume';
import { nlpProcessor } from '../utils/nlpProcessor';

export const scanResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file || !req.body.jobDescription) {
      res.status(400).json({ error: 'Missing resume file or job description' });
      return;
    }

    // Extract text from uploaded PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    // Use NLP Utility to calculate scores
    const analysis = nlpProcessor.process(resumeText, req.body.jobDescription);

    // Map results for persistence
    const keywordBreakdown = analysis.matchedKeywords.map(k => ({ keyword: k, found: true }))
      .concat(analysis.missingKeywords.map(k => ({ keyword: k, found: false })));

    const resumeRecord = new Resume({
      filename: req.file.originalname,
      content: resumeText,
      matchScore: analysis.matchScore,
      keywordBreakdown
    });

    await resumeRecord.save();

    res.status(200).json({
      score: analysis.matchScore,
      matched: analysis.matchedKeywords,
      missing: analysis.missingKeywords
    });
  } catch (error) {
    console.error('Scan processing error:', error);
    res.json([]);
  }
};