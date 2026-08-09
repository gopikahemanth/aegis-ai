import { PrismaClient } from '@prisma/client';
import * as pdfParse from "pdf-parse";
import fs from 'fs';

const prisma = new PrismaClient();

interface AnalysisResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export class AnalyzerService {
  public async processResume(filePath: string, userId: string, jobDescription: string, keywords: string[]): Promise<any> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;

    const analysis = this.calculateMatch(resumeText, keywords);

    const scan = await prisma.resumeScan.create({
      data: {
        userId,
        jobDescription,
        resumeText,
        matchScore: analysis.score,
        results: {
          create: {
            keywordCoverage: analysis.matchedKeywords,
            skillAlignment: analysis.missingKeywords,
            detailedScore: { score: analysis.score }
          }
        }
      },
      include: { results: true }
    });

    return scan;
  }

  private calculateMatch(text: string, keywords: string[]): AnalysisResult {
    const lowerText = text.toLowerCase();
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    const score = keywords.length > 0 
      ? Math.round((matchedKeywords.length / keywords.length) * 100) 
      : 0;

    return { score, matchedKeywords, missingKeywords };
  }
}
export type { AnalysisResult };

export { prisma };

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
