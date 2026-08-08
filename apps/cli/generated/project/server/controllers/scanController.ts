import { Request, Response } from 'express';
import { ScanResult } from '../models/ScanResult';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobDescription, extractedText } = req.body;
    const userId = (req as any).user?.id;

    // Core keyword matching logic (simplified for brevity, should use natural library)
    const keywords = jobDescription.split(/[\s,]+/);
    const matchedKeywords = keywords.filter((k: string) => 
      extractedText.toLowerCase().includes(k.toLowerCase())
    );
    const missingKeywords = keywords.filter((k: string) => 
      !extractedText.toLowerCase().includes(k.toLowerCase())
    );
    
    const matchScore = Math.round((matchedKeywords.length / keywords.length) * 100);

    const result = await ScanResult.create({
      userId,
      matchScore,
      matchedKeywords,
      missingKeywords,
      createdAt: new Date()
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.json([]);
  }
};