import { Request, Response } from 'express';
import { AnalysisResult } from '../models/AnalysisResult';

export const saveAnalysis = async (req: Request, res: Response) => {
  try {
    const { userId, resumeFileName, matchScore, missingKeywords, matchedKeywords } = req.body;
    
    const newAnalysis = new AnalysisResult({
      userId,
      resumeFileName,
      matchScore,
      missingKeywords,
      matchedKeywords
    });

    await newAnalysis.save();
    return res.status(201).json({ success: true, data: newAnalysis });
  } catch (error) {
    console.error('Save Analysis Error:', error);
    return res.json([]);
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const history = await AnalysisResult.find().sort({ createdAt: -1 }).limit(20);
    return res.status(200).json(history);
  } catch (error) {
    return res.json([]);
  }
};