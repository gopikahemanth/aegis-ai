import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResumeParserService } from '../services/ResumeParserService';
import { KeywordMatcherEngine } from '../services/KeywordMatcherEngine';

const prisma = new PrismaClient();

export class AnalysisController {
  public static async createAnalysis(req: Request, res: Response) {
    try {
      const { jobDescriptionText, userId } = req.body;
      
      if (!req.file || !jobDescriptionText) {
        return res.status(400).json({ error: 'Missing file or job description' });
      }

      // 1. Parse Resume
      const parsedResume = await ResumeParserService.parsePDFBuffer(req.file.buffer);
      
      // 2. Compute Match
      const matchData = KeywordMatcherEngine.calculateMatch(
        parsedResume.text, 
        jobDescriptionText
      );

      // 3. Persist Result
      const result = await prisma.analysisResult.create({
        data: {
          userId,
          matchScore: matchData.score,
          matchedKeywords: matchData.matchedKeywords,
          missingKeywords: matchData.missingKeywords,
        }
      });

      res.status(201).json(result);
    } catch (error) {
      res.json([]);
    }
  }
}