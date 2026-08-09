import { Request, Response } from 'express';
import * as pdfParse from "pdf-parse";
import natural from 'natural';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res.status(400).json({ error: 'Missing resume or job description.' });
    }

    const resumeData = await pdf(req.file.buffer);
    const resumeText = resumeData.text.toLowerCase();
    const jobDescription = (req.body.jobDescription as string).toLowerCase();

    const tokenizer = new natural.WordTokenizer();
    const resumeTokens = new Set(tokenizer.tokenize(resumeText));
    const jobTokens = tokenizer.tokenize(jobDescription);
    
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    jobTokens.forEach(token => {
      if (token.length > 3) {
        if (resumeTokens.has(token)) {
          if (!matchedKeywords.includes(token)) matchedKeywords.push(token);
        } else {
          if (!missingKeywords.includes(token)) missingKeywords.push(token);
        }
      }
    });

    const matchScore = jobTokens.length > 0 
      ? Math.round((matchedKeywords.length / jobTokens.length) * 100) 
      : 0;

    res.json({
      matchScore: Math.min(matchScore, 100),
      matchedKeywords,
      missingKeywords: missingKeywords.slice(0, 10),
      summary: `Your resume matches ${matchedKeywords.length} key terms found in the job description.`
    });
  } catch (error) {
    res.json([]);
  }
};