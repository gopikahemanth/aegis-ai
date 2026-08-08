import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import natural from 'natural';

const tokenizer = new natural.WordTokenizer();

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Resume PDF required' });
      return;
    }

    const { jobDescription } = req.body;
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.toLowerCase();
    
    const jdTokens = tokenizer.tokenize(jobDescription.toLowerCase()) || [];
    const uniqueSkills = Array.from(new Set(jdTokens.filter(t => t.length > 3)));
    
    const matched: string[] = [];
    const missing: string[] = [];

    uniqueSkills.forEach(skill => {
      if (resumeText.includes(skill)) matched.push(skill);
      else missing.push(skill);
    });

    const matchScore = Math.round((matched.length / (uniqueSkills.length || 1)) * 100);

    res.json({ matchScore, matched, missing });
  } catch (error) {
    res.json([]);
  }
};