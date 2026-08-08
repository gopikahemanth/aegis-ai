import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { calculateKeywordMatch } from '../../shared/utils/nlpEngine';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Resume file required' });
    const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description required' });

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;
    
    const analysis = calculateKeywordMatch(resumeText, jobDescription);
    
    res.status(200).json({
      success: true,
      data: {
        score: analysis.score,
        matched: analysis.matchedKeywords,
        missing: analysis.missingKeywords,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.json([]);
  }
};