import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file || !req.body.jobDescription) {
      res.status(400).json({ error: 'Resume file and Job Description required' });
      return;
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    const jdText = (req.body.jobDescription as string).toLowerCase();

    // Basic keyword extraction logic
    const tokens = jdText.match(/\b(\w+)\b/g) || [];
    const keywords = Array.from(new Set(tokens.filter(t => t.length > 3)));
    
    const matched = keywords.filter(k => resumeText.includes(k));
    const missing = keywords.filter(k => !resumeText.includes(k));
    
    const score = Math.round((matched.length / (keywords.length || 1)) * 100);

    res.json({
      matchScore: score,
      breakdown: { matched, missing },
      summary: `You match ${score}% of the identified requirements.`
    });
  } catch (err) {
    res.json([]);
  }
};