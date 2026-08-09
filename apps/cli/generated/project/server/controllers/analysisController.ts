import { Request, Response } from 'express';

/**
 * Controller responsible for analyzing resume content against job descriptions.
 * Implements keyword extraction and matching logic.
 */
export class AnalysisController {
  /**
   * Analyzes a resume against a job description.
   * Calculates keyword overlap and generates a match score.
   */
  public async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { jobDescription, resumeText } = req.body;

      if (!jobDescription || !resumeText) {
        res.status(400).json({ error: 'Missing required analysis fields' });
        return;
      }

      const jdWords = this.extractKeywords(jobDescription);
      const resumeWords = this.extractKeywords(resumeText);

      const foundKeywords = jdWords.filter((word) =>
        resumeWords.includes(word)
      );
      
      const missingKeywords = jdWords.filter((word) =>
        !resumeWords.includes(word)
      );

      const score = jdWords.length > 0 
        ? Math.round((foundKeywords.length / jdWords.length) * 100) 
        : 0;

      res.status(200).json({
        score,
        foundKeywords,
        missingKeywords,
        totalKeywordsFound: foundKeywords.length,
        totalKeywordsRequired: jdWords.length
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.json([]);
    }
  }

  /**
   * Tokenizes and cleans text to extract unique professional keywords.
   * Filters out common stop words and enforces minimum character length.
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    const stopWords = new Set([
      'the', 'and', 'with', 'for', 'that', 'this', 'to', 'in', 'of', 'a', 'is', 
      'are', 'was', 'were', 'it', 'on', 'at', 'by', 'an', 'as', 'from', 'or', 'be'
    ]);
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/);

    return Array.from(
      new Set(
        words.filter((word) => word.length > 3 && !stopWords.has(word))
      )
    );
  }
}